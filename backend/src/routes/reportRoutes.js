const express = require('express');
const router = express.Router();
const controller = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/daily', controller.dailyReport);
router.get('/period', controller.periodReport);

module.exports = router;
