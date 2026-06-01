const PG = require('../models/PG');
const VisitRequest = require('../models/VisitRequest');
const Room = require('../models/Room');

// @desc    Get Public PG Details
// @route   GET /api/public/pg/:id
// @access  Public
exports.getPublicPGDetails = async (req, res) => {
    try {
        const pg = await PG.findById(req.params.id)
            .select('name address city description facilities contact type gender_allowed images');

        if (!pg) {
            return res.status(404).json({ success: false, message: 'PG not found' });
        }

        // Get available room types (aggregated/simplified)
        const rooms = await Room.find({ pg_id: pg._id }).select('type price number occupied capacity');

        // Calculate starting price
        const prices = rooms.map(r => r.price).filter(p => p > 0);
        const startingPrice = prices.length > 0 ? Math.min(...prices) : 0;

        res.json({
            success: true,
            data: {
                ...pg.toObject(),
                startingPrice,
                roomTypes: [...new Set(rooms.map(r => r.type))] // Unique types
            }
        });
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'PG not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Submit Visit Request
// @route   POST /api/public/visit
// @access  Public
exports.submitVisitRequest = async (req, res) => {
    try {
        const { pg_id, name, phone, email, visitDate, notes } = req.body;

        const request = await VisitRequest.create({
            pg_id,
            name,
            phone,
            email,
            visitDate,
            notes
        });

        res.status(201).json({ success: true, message: 'Visit request submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
