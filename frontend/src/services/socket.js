import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const createChatSocket = (token) =>
  io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: false,
    withCredentials: true,
    auth: { token },
    extraHeaders: {
      Authorization: token ? `Bearer ${token}` : '',
      'x-access-token': token || '',
    },
  });
