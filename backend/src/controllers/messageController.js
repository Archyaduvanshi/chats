const messageService = require('../services/messageService');

const fetchMessages = async (req, res, next) => {
  try {
    const messages = await messageService.getMessages();
    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const message = await messageService.createMessage(req.body);
    req.app.get('io')?.emit('message:new', message);
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

const readMessages = async (req, res, next) => {
  try {
    const messages = await messageService.markMessagesRead(req.body.username);
    req.app.get('io')?.emit('messages:read', { username: req.body.username, messages });
    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  fetchMessages,
  sendMessage,
  readMessages,
};
