const express = require('express');
const messageController = require('../controllers/messageController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', messageController.fetchMessages);
router.post('/', messageController.sendMessage);
router.patch('/read', messageController.readMessages);
router.patch('/:id', messageController.editMessage);
router.delete('/:id', messageController.removeMessage);

module.exports = router;
