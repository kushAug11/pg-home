const Complaint = require('../models/Complaint');
const Tenant = require('../models/Tenant');
const { getIO } = require('../services/socket.service');

// @desc    Create a Complaint
// @route   POST /api/complaints
// @access  Private (Tenant)
exports.createComplaint = async (req, res) => {
    try {
        const { title, description, category, priority } = req.body;
        
        if (!req.user.pg_id) {
            return res.status(403).json({ success: false, message: 'User not assigned to a PG' });
        }

        // BUG-026 FIX: Look up the Tenant profile to get the correct Tenant ObjectId
        // Complaint schema refs 'Tenant', not 'User'
        const tenant = await Tenant.findOne({ user_id: req.user._id });
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant profile not found' });
        }

        const complaint = await Complaint.create({
            pg_id: req.user.pg_id,
            tenant_id: tenant._id, // FIX: Use Tenant._id, not User._id
            title,
            description,
            category,
            priority
        });

        // 🟢 Emit Real-Time Socket Event to Owner/Admin
        try {
            const io = getIO();
            // Emit to the specific PG space
            io.to(`pg_${req.user.pg_id}`).emit('NEW_COMPLAINT', {
                complaint,
                tenantName: req.user.name
            });
        } catch (socketError) {
            console.error('Socket Emission Error:', socketError.message);
        }

        res.status(201).json({ success: true, data: complaint });
    } catch (error) {
        console.error('Create Complaint Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create complaint' });
    }
};

// @desc    Update Complaint Status
// @route   PUT /api/complaints/:id/status
// @access  Private (Owner/Admin)
exports.updateComplaintStatus = async (req, res) => {
    try {
        const { status, adminComment } = req.body;
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        // BUG-007 FIX: Enforce PG ownership — prevent cross-tenant data access
        if (req.user.role !== 'admin' && complaint.pg_id.toString() !== req.user.pg_id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this complaint' });
        }

        complaint.status = status;
        if (adminComment) complaint.adminComment = adminComment;
        await complaint.save();

        // 🟢 Emit Real-Time Socket Event to Specific Tenant
        try {
            const io = getIO();
            io.to(`user_${complaint.tenant_id}`).emit('COMPLAINT_UPDATED', complaint);
        } catch (socketError) {
            console.error('Socket Emission Error:', socketError.message);
        }

        res.status(200).json({ success: true, data: complaint });
    } catch (error) {
        console.error('Update Complaint Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update complaint' });
    }
};

// @desc    Get all Complaints for a PG
// @route   GET /api/complaints
// @access  Private
exports.getComplaints = async (req, res) => {
    try {
        let filter = { pg_id: req.user.pg_id };
        
        // BUG-008 FIX: Look up Tenant profile to get correct Tenant ObjectId for filtering
        if (req.user.role === 'tenant') {
            const tenant = await Tenant.findOne({ user_id: req.user._id });
            if (!tenant) {
                return res.status(404).json({ success: false, message: 'Tenant profile not found' });
            }
            filter.tenant_id = tenant._id; // FIX: Use Tenant._id, not User._id
        }

        const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: complaints.length, data: complaints });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
