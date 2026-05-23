const express = require('express');
const router = express.Router();
const controller = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Rapport journalier : agent voit le sien, superviseur/admin voient n'importe lequel
router.get('/daily', controller.dailyReport);

module.exports = router;
