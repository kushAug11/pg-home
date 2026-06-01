// @desc    Manage Exit Request (Approve/Reject)
// @route   POST /api/owner/tenants/exit-request
// @access  Private (Owner)
exports.manageExitRequest = async (req, res) => {
    try {
        const { tenantId, status, comment, exitDate } = req.body; // status: APPROVED or REJECTED

        const tenant = await Tenant.findOne({ _id: tenantId, pg_id: req.user.pg_id });

        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        if (!tenant.exit_request || tenant.exit_request.status !== 'PENDING') {
            return res.status(400).json({ success: false, message: 'No pending exit request found' });
        }

        tenant.exit_request.status = status;
        tenant.exit_request.admin_comment = comment;

        if (status === 'APPROVED') {
            tenant.exit_date = exitDate || tenant.exit_request.requested_date;
            tenant.status = 'on_notice';
        }

        await tenant.save();

        res.json({ success: true, message: `Exit request ${status.toLowerCase()}`, data: tenant });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
