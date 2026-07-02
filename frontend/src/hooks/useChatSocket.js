import { useEffect, useMemo, useRef, useState } from 'react';
import { createChatSocket } from '../services/socket';

export const useChatSocket = ({
  username,
  onMessage,
  onMessageDelete,
  onMessageUpdate,
  onReadUpdate,
}) => {
  const socket = useMemo(() => createChatSocket(), []);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!username) return undefined;

    socket.connect();

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit('user:join', username);
      socket.emit('messages:read', username);
    };
    const handleDisconnect = () => setIsConnected(false);
    const handleTypingStart = (typingUsername) => {
      if (!typingUsername || typingUsername === username) return;
      setTypingUsers((users) =>
        users.includes(typingUsername) ? users : [...users, typingUsername]
      );
    };
    const handleTypingStop = (typingUsername) => {
      setTypingUsers((users) => users.filter((user) => user !== typingUsername));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('message:new', onMessage);
    socket.on('message:updated', onMessageUpdate);
    socket.on('message:deleted', ({ id }) => onMessageDelete(id));
    socket.on('users:online', setOnlineUsers);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('messages:read', ({ messages }) => onReadUpdate(messages));

    if (socket.connected) handleConnect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('message:new', onMessage);
      socket.off('message:updated', onMessageUpdate);
      socket.off('message:deleted');
      socket.off('users:online', setOnlineUsers);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('messages:read');
      socket.disconnect();
    };
  }, [onMessage, onMessageDelete, onMessageUpdate, onReadUpdate, socket, username]);

  const sendSocketMessage = (payload) =>
    new Promise((resolve, reject) => {
      socket.emit('message:send', payload, (response) => {
        if (response?.ok) {
          resolve(response.message);
          return;
        }
        reject(new Error(response?.error || 'Unable to send message.'));
      });
    });

  const editSocketMessage = (payload) =>
    new Promise((resolve, reject) => {
      socket.emit('message:edit', payload, (response) => {
        if (response?.ok) {
          resolve(response.message);
          return;
        }
        reject(new Error(response?.error || 'Unable to edit message.'));
      });
    });

  const deleteSocketMessage = (payload) =>
    new Promise((resolve, reject) => {
      socket.emit('message:delete', payload, (response) => {
        if (response?.ok) {
          resolve(response.id);
          return;
        }
        reject(new Error(response?.error || 'Unable to delete message.'));
      });
    });

  const startTyping = () => {
    if (!username || !socket.connected) return;
    socket.emit('typing:start', username);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', username);
    }, 900);
  };

  const stopTyping = () => {
    if (!username || !socket.connected) return;
    clearTimeout(typingTimeoutRef.current);
    socket.emit('typing:stop', username);
  };

  return {
    isConnected,
    onlineUsers,
    typingUsers,
    deleteSocketMessage,
    editSocketMessage,
    sendSocketMessage,
    startTyping,
    stopTyping,
  };
};
