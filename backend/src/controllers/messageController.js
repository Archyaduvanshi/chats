const messageService = require('../services/messageService');
const roomService = require('../services/roomService');

const getUserRoom = (username) => `user:${username}`;

const fetchMessages = async (req, res, next) => {
  try {
    await roomService.assertRoomMember(req.query.roomId, req.user);
    const messages = await messageService.getMessages(req.query.roomId);
    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const room = await roomService.assertRoomMember(req.body.roomId, req.user);
    const message = await messageService.createMessage({
      ...req.body,
      username: req.user.username,
    });
    const io = req.app.get('io');
    io?.to(message.roomId).emit('message:new', message);
    if (room.type === 'direct') {
      const receivers = room.members.filter((member) => member !== req.user.username);
      await Promise.all(
        receivers.map(async (receiver) => {
          const counts = await messageService.countUnreadByRoomIds(receiver, [message.roomId]);
          io?.to(getUserRoom(receiver)).emit('unread:update', {
            roomId: message.roomId,
            unreadCount: counts.get(message.roomId) || 0,
          });
        })
      );
    }
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

const readMessages = async (req, res, next) => {
  try {
    await roomService.assertRoomMember(req.body.roomId, req.user);
    const messages = await messageService.markMessagesRead(req.user.username, req.body.roomId);
    const io = req.app.get('io');
    io?.to(req.body.roomId).emit('messages:read', {
      username: req.user.username,
      roomId: req.body.roomId,
      messages,
    });
    io?.to(getUserRoom(req.user.username)).emit('unread:update', {
      roomId: req.body.roomId,
      unreadCount: 0,
    });
    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

const editMessage = async (req, res, next) => {
  try {
    const message = await messageService.updateMessage(req.params.id, {
      ...req.body,
      username: req.user.username,
    });
    await roomService.assertRoomMember(message.roomId, req.user);
    req.app.get('io')?.to(message.roomId).emit('message:updated', message);
    res.json({ message });
  } catch (error) {
    next(error);
  }
};

const removeMessage = async (req, res, next) => {
  try {
    const result = await messageService.deleteMessage(req.params.id, req.user.username);
    req.app.get('io')?.to(result.roomId).emit('message:deleted', result);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  editMessage,
  fetchMessages,
  removeMessage,
  sendMessage,
  readMessages,
};
