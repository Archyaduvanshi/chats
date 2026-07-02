const messageService = require('../services/messageService');

const connectedUsers = new Map();

const getOnlineUsers = () => {
  const users = new Set(connectedUsers.values());
  return Array.from(users).sort((a, b) => a.localeCompare(b));
};

const registerChatSocket = (io) => {
  io.on('connection', (socket) => {
    socket.emit('users:online', getOnlineUsers());

    socket.on('user:join', (username) => {
      const cleanUsername = String(username || '').trim().slice(0, 32);
      if (!cleanUsername) return;

      connectedUsers.set(socket.id, cleanUsername);
      io.emit('users:online', getOnlineUsers());
    });

    socket.on('message:send', async (payload, ack) => {
      try {
        const message = await messageService.createMessage(payload);
        io.emit('message:new', message);
        ack?.({ ok: true, message });
      } catch (error) {
        ack?.({ ok: false, error: error.message || 'Unable to send message.' });
        socket.emit('socket:error', error.message || 'Unable to send message.');
      }
    });

    socket.on('typing:start', (username) => {
      socket.broadcast.emit('typing:start', String(username || '').trim().slice(0, 32));
    });

    socket.on('typing:stop', (username) => {
      socket.broadcast.emit('typing:stop', String(username || '').trim().slice(0, 32));
    });

    socket.on('messages:read', async (username) => {
      try {
        const messages = await messageService.markMessagesRead(username);
        io.emit('messages:read', { username, messages });
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
