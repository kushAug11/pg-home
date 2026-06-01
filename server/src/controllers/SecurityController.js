const Visitor = require('../models/Visitor');
const GuestRequest = require('../models/GuestRequest');

const getScopedPgId = (req) => {
    if (req.user.role === 'admin') {
        return null;
    }
    return req.user.pg_id;
};

// --- Visitor Management ---

// Log New Visitor
exports.logVisitorEntry = async (req, res) => {
    try {
        const { name, phone, purpose, details } = req.body;
        const pg_id = req.user.pg_id;

        const visitor = await Visitor.create({
            pg_id,
            name,
            phone,
            purpose,
            details
        });

        res.status(201).json(visitor);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Active Visitors (Inside premises)
exports.getActiveVisitors = async (req, res) => {
    try {
        const pg_id = req.user.pg_id;
        const visitors = await Visitor.find({ pg_id, status: 'INSIDE' }).sort({ entryTime: -1 });
        res.json(visitors);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Mark Visitor Exit
exports.markVisitorExit = async (req, res) => {
    try {
        const { id } = req.params;
        const query = { _id: id };

        if (getScopedPgId(req)) {
            query.pg_id = getScopedPgId(req);
        }

        const visitor = await Visitor.findOneAndUpdate(
            query,
            { status: 'EXITED', exitTime: Date.now() },
            { new: true }
        );

        if (!visitor) {
            return res.status(404).json({ message: 'Visitor not found' });
        }

        res.json(visitor);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- Guest Request Management ---

// Tenant: Create Request
exports.createGuestRequest = async (req, res) => {
    try {
        const { guest_name, relation, fromDate, toDate } = req.body;

        // Ensure user is really a tenant
        // In clean architecture, we should get tenant_id from req.user (if populated) or look it up.
        // Assuming req.user.id is linked to a Tenant record, but here we need the Tenant ID, not User ID.
        // Quick fix: look up tenant by user_id.
        const Tenant = require('../models/Tenant');
        const tenant = await Tenant.findOne({ user_id: req.user.id });

        if (!tenant) {
            return res.status(404).json({ message: 'Tenant profile not found' });
        }

        const request = await GuestRequest.create({
            pg_id: tenant.pg_id,
            tenant_id: tenant._id,
            guest_name,
            relation,
            fromDate,
            toDate
        });

        res.status(201).json(request);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Owner: Get Pending Requests
exports.getPendingGuestRequests = async (req, res) => {
    try {
        const pg_id = req.user.pg_id;
        const requests = await GuestRequest.find({ pg_id, status: 'PENDING' })
            .populate('tenant_id', 'contact_number') // basic info
            .sort({ createdAt: -1 });

        // We might want to populate User name from Tenant -> User
        // But for now let's keep it simple.
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Owner: Update Request Status
exports.updateGuestRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // APPROVED or REJECTED
        const query = { _id: id };

        if (getScopedPgId(req)) {
            query.pg_id = getScopedPgId(req);
        }

        const request = await GuestRequest.findOneAndUpdate(
            query,
            { status },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({ message: 'Guest request not found' });
        }

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Tenant: Get My Requests
exports.getMyGuestRequests = async (req, res) => {
    try {
        const Tenant = require('../models/Tenant');
        const tenant = await Tenant.findOne({ user_id: req.user.id });

        if (!tenant) return res.status(404).json([]);

        const requests = await GuestRequest.find({ tenant_id: tenant._id }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const PreAuthVisitor = require('../models/PreAuthVisitor');

// Get Pre-Authorized Visitors List (Owner/Security dashboard)
exports.getPreAuthVisitorsList = async (req, res) => {
    try {
        const pg_id = req.user.pg_id;
        const preAuths = await PreAuthVisitor.find({ pg_id })
            .populate({
                path: 'tenant_id',
                select: 'user_id room_id',
                populate: [
                    {
                        path: 'user_id',
                        select: 'name email'
                    },
                    {
                        path: 'room_id',
                        select: 'number'
                    }
                ]
            })
            .sort({ createdAt: -1 });
        res.json(preAuths);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Check-In Pre-Authorized Visitor (Owner/Security dashboard)
exports.checkInPreAuthVisitor = async (req, res) => {
    try {
        const { qrCodeToken } = req.body;
        const pg_id = req.user.pg_id;

        if (!qrCodeToken) {
            return res.status(400).json({ message: 'QR Code Token is required' });
        }

        // Find the pre-auth record
        const preAuth = await PreAuthVisitor.findOne({ qrCodeToken, pg_id, status: 'PENDING' })
            .populate({
                path: 'tenant_id',
                select: 'user_id room_id',
                populate: [
                    {
                        path: 'user_id',
                        select: 'name'
                    },
                    {
                        path: 'room_id',
                        select: 'number'
                    }
                ]
            });

        if (!preAuth) {
            return res.status(404).json({ message: 'Invalid or already used Pre-Authorized pass' });
        }

        // Mark pre-auth as CHECKED_IN
        preAuth.status = 'CHECKED_IN';
        await preAuth.save();

        // Create a new Visitor record
        const tenantName = preAuth.tenant_id?.user_id?.name || 'Tenant';
        const roomNo = preAuth.tenant_id?.room_id?.number || 'N/A';
        const details = `Pre-Authorized by ${tenantName} (Room ${roomNo})`;

        // Validate visitor purpose against enum: ['Delivery', 'Visit', 'Maintenance', 'Interview', 'Other']
        let purpose = 'Other';
        if (['Delivery', 'Visit', 'Maintenance', 'Interview', 'Other'].includes(preAuth.purpose)) {
            purpose = preAuth.purpose;
        }

        const visitor = await Visitor.create({
            pg_id,
            name: preAuth.name,
            phone: preAuth.phone,
            purpose,
            details,
            status: 'INSIDE',
            entryTime: Date.now()
        });

        // Notify via socket
        try {
            const { getIO } = require('../services/socket.service');
            const io = getIO();
            io.to(`pg_${pg_id}`).emit('visitor_activity', {
                action: 'CHECKED_IN',
                visitor
            });
        } catch (socketError) {
            console.error('Socket Emission Error:', socketError.message);
        }

        res.status(200).json({
            success: true,
            message: 'Visitor checked in successfully',
            visitor,
            preAuth
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
