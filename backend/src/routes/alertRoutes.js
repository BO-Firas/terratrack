const express = require('express');
const router = express.Router();
const controller = require('../controllers/alertController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', controller.list);
router.put('/:id/read', controller.markRead);
router.put('/:id/resolve', authorize('supervisor', 'admin'), controller.resolve);

module.exports = router;
