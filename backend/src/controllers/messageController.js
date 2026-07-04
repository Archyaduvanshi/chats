const messageService = require('../services/messageService');
const roomService = require('../services/roomService');

const getUserRoom = (username) => `user:${username}`;

const fetchMessages = async (req, res, next) => {
  try {
    const room = await roomService.assertRoomMember(req.query.roomId, req.user);
    const clearedAt = room.type === 'direct' ? roomService.getClearedAtForUser(room, req.user.username) : null;
    const messages = await messageService.getMessages(req.query.roomId, { clearedAt });
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
    const visibleRoom =
      room.type === 'direct'
        ? await roomService.revealDirectRoomForMembers(message.roomId, room.members)
        : room;
    const io = req.app.get('io');
    io?.to(message.roomId).emit('message:new', message);
    if (room.type === 'direct') {
      room.members.forEach((member) => {
        io?.to(getUserRoom(member)).emit('rooms:refresh');
      });
      const receivers = room.members.filter((member) => member !== req.user.username);
      await Promise.all(
        receivers.map(async (receiver) => {
          const clearedAt = roomService.getClearedAtForUser(visibleRoom, receiver);
          const counts = await messageService.countUnreadByRoomIds(
            receiver,
            [message.roomId],
            new Map([[message.roomId, clearedAt]])
          );
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
    const room = await roomService.assertRoomMember(req.body.roomId, req.user);
    const clearedAt = room.type === 'direct' ? roomService.getClearedAtForUser(room, req.user.username) : null;
    const messages = await messageService.markMessagesRead(req.user.username, req.body.roomId, { clearedAt });
    const io = req.app.get('io');
    io?.to(getUserRoom(req.user.username)).emit('messages:read', {
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
