const express = require('express');
const router = express.Router();
const controller = require('../controllers/zoneController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', controller.list);
router.get('/contains', controller.containsPoint);
router.get('/:id', controller.getOne);

router.post('/', authorize('admin', 'supervisor'), controller.create);
router.put('/:id', authorize('admin', 'supervisor'), controller.update);
router.delete('/:id', authorize('admin'), controller.remove);

module.exports = router;
