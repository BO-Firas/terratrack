const express = require('express');
const router = express.Router();
const controller = require('../controllers/statsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Stats de l'agent connecte
router.get('/me', controller.myStats);

// Vue d'ensemble + stats par agent (superviseur/admin uniquement)
router.get('/overview', authorize('supervisor', 'admin'), controller.overview);
router.get('/agent/:id', authorize('supervisor', 'admin'), controller.agentStats);

module.exports = router;
