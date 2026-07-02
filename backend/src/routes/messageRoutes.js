const express = require('express');
const {
  editMessage,
  fetchMessages,
  readMessages,
  removeMessage,
  sendMessage,
} = require('../controllers/messageController');

const router = express.Router();

router.get('/', fetchMessages);
router.post('/', sendMessage);
router.patch('/read', readMessages);
router.patch('/:id', editMessage);
router.delete('/:id', removeMessage);

module.exports = router;
