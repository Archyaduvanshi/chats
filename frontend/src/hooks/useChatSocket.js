import { useEffect, useMemo, useRef, useState } from 'react';
import { createChatSocket } from '../services/socket';

export const useChatSocket = ({
  token,
  username,
  roomId,
  onMessage,
  onMessageDelete,
  onMessageUpdate,
  onReadUpdate,
  onRoomsRefresh,
  onUnreadUpdate,
}) => {
  const socket = useMemo(() => createChatSocket(token), [token]);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!token || !username) return undefined;

    socket.connect();

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit('user:join', { roomId });
      if (roomId) {
        socket.emit('messages:read', { roomId });
      }
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
    const handleNewMessage = (message) => {
      onMessage(message);
      if (roomId && message.roomId === roomId && message.username !== username) {
        socket.emit('messages:read', { roomId });
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('message:new', handleNewMessage);
    socket.on('message:updated', onMessageUpdate);
    socket.on('message:deleted', ({ id }) => onMessageDelete(id));
    socket.on('users:online', setOnlineUsers);
    socket.on('rooms:refresh', onRoomsRefresh);
    socket.on('unread:update', onUnreadUpdate);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('messages:read', ({ roomId: updatedRoomId, messages }) => {
      if (updatedRoomId === roomId) onReadUpdate(messages);
    });

    if (socket.connected) handleConnect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('message:new', handleNewMessage);
      socket.off('message:updated', onMessageUpdate);
      socket.off('message:deleted');
      socket.off('users:online', setOnlineUsers);
      socket.off('rooms:refresh', onRoomsRefresh);
      socket.off('unread:update', onUnreadUpdate);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('messages:read');
      socket.disconnect();
    };
  }, [
    onMessage,
    onMessageDelete,
    onMessageUpdate,
    onReadUpdate,
    onRoomsRefresh,
    onUnreadUpdate,
    roomId,
    socket,
    token,
    username,
  ]);

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
    if (!username || !roomId || !socket.connected) return;
    socket.emit('typing:start', { roomId });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { roomId });
    }, 900);
  };

  const stopTyping = () => {
    if (!username || !roomId || !socket.connected) return;
    clearTimeout(typingTimeoutRef.current);
    socket.emit('typing:stop', { roomId });
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
