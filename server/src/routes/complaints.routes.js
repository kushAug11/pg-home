const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { enforceIsolation } = require('../middlewares/isolation.middleware');
const {
    createComplaint,
    updateComplaintStatus,
    getComplaints
} = require('../controllers/complaints.controller');
const z = require('zod');

// Schema
const complaintSchema = z.object({
    title: z.string().min(5).max(100),
    description: z.string().min(10).max(1000),
    category: z.enum(['WiFi', 'Plumbing', 'Electrical', 'Food', 'Cleaning', 'Other']).optional(),
    priority: z.enum(['Low', 'Medium', 'High']).optional()
});

const statusUpdateSchema = z.object({
    status: z.enum(['Pending', 'In Progress', 'Resolved']),
    adminComment: z.string().max(500).optional()
});

router.use(protect);
router.use(enforceIsolation);

router.route('/')
    .get(getComplaints)
    .post(authorize('tenant'), validate(complaintSchema), createComplaint);

router.route('/:id/status')
    .put(authorize('owner', 'admin'), validate(statusUpdateSchema), updateComplaintStatus);

module.exports = router;
