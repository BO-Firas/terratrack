const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// Toutes les routes de gestion des utilisateurs sont reservees a l'administrateur
router.use(authenticate);
router.use(authorize('admin'));

router.get('/', controller.listUsers);
router.post('/', controller.createUser);
router.get('/:id', controller.getUser);
router.put('/:id', controller.updateUser);
router.put('/:id/password', controller.resetPassword);
router.put('/:id/toggle', controller.toggleActive);
router.delete('/:id', controller.deleteUser);

module.exports = router;
