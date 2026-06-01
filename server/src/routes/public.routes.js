const express = require('express');
const router = express.Router();
const PublicController = require('../controllers/PublicController');

router.get('/pg/:id', PublicController.getPublicPGDetails);
router.post('/visit', PublicController.submitVisitRequest);

module.exports = router;
