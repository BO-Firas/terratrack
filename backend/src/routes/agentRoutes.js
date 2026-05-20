const express = require('express');
const router = express.Router();
const controller = require('../controllers/agentController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Toutes ces routes sont reservees aux superviseurs/admins
router.get('/', authorize('supervisor', 'admin'), controller.listAgents);
router.get('/live', authorize('supervisor', 'admin'), controller.getLivePositions);
router.get('/:id', authorize('supervisor', 'admin'), controller.getAgent);
router.put('/:id', authorize('supervisor', 'admin'), controller.updateAgent);
router.get('/:id/track', authorize('supervisor', 'admin'), controller.getTrack);

module.exports = router;
