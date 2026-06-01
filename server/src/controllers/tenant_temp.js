// @desc    Request Exit / Notice Period
// @route   POST /api/tenant/request-exit
// @access  Private (Tenant)
exports.requestExit = async (req, res) => {
    try {
        const { reason, date } = req.body;
        const tenant = await Tenant.findOne({ user_id: req.user._id });

        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        if (tenant.exit_request && tenant.exit_request.status === 'PENDING') {
            return res.status(400).json({ success: false, message: 'Exit request already pending' });
        }

        tenant.exit_request = {
            status: 'PENDING',
            reason,
            requested_date: date,
            request_date: Date.now()
        };

        await tenant.save();

        res.json({ success: true, message: 'Exit request submitted successfully', data: tenant });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
