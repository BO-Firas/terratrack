const express = require('express');
const router = express.Router();
const controller = require('../controllers/visitController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', controller.list);
router.get('/today', controller.today);
router.put('/:id/notes', controller.addNotes);

module.exports = router;
