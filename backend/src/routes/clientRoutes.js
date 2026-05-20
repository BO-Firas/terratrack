const express = require('express');
const router = express.Router();
const controller = require('../controllers/clientController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate); // tout requiert authentification

router.get('/', controller.list);
router.get('/near', controller.findNearby);
router.get('/:id', controller.getOne);

// Mutations reservees admin / superviseur
router.post('/', authorize('admin', 'supervisor'), controller.create);
router.put('/:id', authorize('admin', 'supervisor'), controller.update);
router.delete('/:id', authorize('admin'), controller.remove);

module.exports = router;
