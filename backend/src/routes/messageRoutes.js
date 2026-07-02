const express = require('express');
const {
  fetchMessages,
  readMessages,
  sendMessage,
} = require('../controllers/messageController');

const router = express.Router();

router.get('/', fetchMessages);
router.post('/', sendMessage);
router.patch('/read', readMessages);

module.exports = router;
