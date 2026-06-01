const VisitRequest = require('../models/VisitRequest');

// @desc    Get all visit requests for the owner's PG
// @route   GET /api/visits
// @access  Owner
exports.getVisitRequests = async (req, res) => {
    try {
        const requests = await VisitRequest.find({ pg_id: req.user.pg_id })
            .sort({ createdAt: -1 });

        res.json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update visit request status
// @route   PUT /api/visits/:id
// @access  Owner
exports.updateVisitStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;

        const visit = await VisitRequest.findOneAndUpdate(
            { _id: req.params.id, pg_id: req.user.pg_id }, // Ensure ownership
            { status, notes },
            { new: true }
        );

        if (!visit) {
            return res.status(404).json({ success: false, message: 'Visit request not found' });
        }

        res.json({ success: true, data: visit });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
