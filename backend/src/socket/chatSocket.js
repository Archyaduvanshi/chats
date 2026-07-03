const messageService = require('../services/messageService');
const roomService = require('../services/roomService');
const authService = require('../services/authService');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const connectedUsers = new Map();

const getOnlineUsers = () => {
  const users = new Set(connectedUsers.values());
  return Array.from(users).sort((a, b) => a.localeCompare(b));
};

const registerChatSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        next(new Error('Login is required.'));
        return;
      }

      const payload = jwt.verify(token, env.jwtSecret);
      const user = await authService.findApprovedUserById(payload.id);
      if (!user) {
        next(new Error('User is not approved.'));
        return;
      }

      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid session.'));
    }
  });

  io.on('connection', (socket) => {
    socket.emit('users:online', getOnlineUsers());

    socket.on('user:join', async ({ roomId } = {}) => {
      const cleanUsername = socket.user.username;

      connectedUsers.set(socket.id, cleanUsername);
      if (roomId) {
        try {
          await roomService.assertRoomMember(roomId, socket.user);
          socket.join(roomId);
        } catch {
          socket.emit('socket:error', 'You do not have access to this room.');
        }
      }
      io.emit('users:online', getOnlineUsers());
    });

    socket.on('message:send', async (payload, ack) => {
      try {
        await roomService.assertRoomMember(payload?.roomId, socket.user);
        const message = await messageService.createMessage({
          ...payload,
          username: socket.user.username,
        });
        io.to(message.roomId).emit('message:new', message);
        ack?.({ ok: true, message });
      } catch (error) {
        ack?.({ ok: false, error: error.message || 'Unable to send message.' });
        socket.emit('socket:error', error.message || 'Unable to send message.');
      }
    });

    socket.on('message:edit', async (payload, ack) => {
      try {
        const message = await messageService.updateMessage(payload?.id, {
          ...payload,
          username: socket.user.username,
        });
        await roomService.assertRoomMember(message.roomId, socket.user);
        io.to(message.roomId).emit('message:updated', message);
        ack?.({ ok: true, message });
      } catch (error) {
        ack?.({ ok: false, error: error.message || 'Unable to edit message.' });
        socket.emit('socket:error', error.message || 'Unable to edit message.');
      }
    });

    socket.on('message:delete', async (payload, ack) => {
      try {
        const result = await messageService.deleteMessage(payload?.id, socket.user.username);
        io.to(result.roomId).emit('message:deleted', result);
        ack?.({ ok: true, ...result });
      } catch (error) {
        ack?.({ ok: false, error: error.message || 'Unable to delete message.' });
        socket.emit('socket:error', error.message || 'Unable to delete message.');
      }
    });

    socket.on('typing:start', ({ roomId } = {}) => {
      if (!roomId) return;
      socket.to(roomId).emit('typing:start', socket.user.username);
    });

    socket.on('typing:stop', ({ roomId } = {}) => {
      if (!roomId) return;
      socket.to(roomId).emit('typing:stop', socket.user.username);
    });

    socket.on('messages:read', async ({ roomId } = {}) => {
      try {
        await roomService.assertRoomMember(roomId, socket.user);
        const messages = await messageService.markMessagesRead(socket.user.username, roomId);
        io.to(roomId).emit('messages:read', { username: socket.user.username, roomId, messages });
      } catch (error) {
        socket.emit('socket:error', error.message || 'Unable to update read status.');
      }
    });

    socket.on('disconnect', () => {
      connectedUsers.delete(socket.id);
      io.emit('users:online', getOnlineUsers());
    });
  });
};

module.exports = registerChatSocket;
