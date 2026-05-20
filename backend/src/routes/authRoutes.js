const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

// Inscription - en production, restreindre aux admins
router.post('/register', authController.register);

// Connexion
router.post('/login', authController.login);

// Utilisateur courant
router.get('/me', authenticate, authController.me);

module.exports = router;
