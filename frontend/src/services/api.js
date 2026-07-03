const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}`, 'x-access-token': options.token } : {}),
      ...options.headers,
    },
    ...Object.fromEntries(Object.entries(options).filter(([key]) => key !== 'token')),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed.');
    error.status = response.status;
    throw error;
  }

  return data;
};

export const signup = async ({ username, phone, password }) =>
  request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ username, phone, password }),
  });

export const login = async ({ username, password }) =>
  request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const fetchRooms = async (token) => {
  const data = await request('/api/rooms', { token });
  return data.rooms || [];
};

export const createRoom = async ({ name, password, maxMembers, token }) => {
  const data = await request('/api/rooms', {
    method: 'POST',
    token,
    body: JSON.stringify({ name, password, maxMembers }),
  });
  return data.room;
};

export const joinRoom = async ({ roomId, roomCode, password, inviteCode, token }) => {
  const data = await request('/api/rooms/join', {
    method: 'POST',
    token,
    body: JSON.stringify({ roomId, roomCode, password, inviteCode }),
  });
  return data.room;
};

export const createDirectRoom = async ({ username, token }) => {
  const data = await request('/api/rooms/direct', {
    method: 'POST',
    token,
    body: JSON.stringify({ username }),
  });
  return data.room;
};

export const fetchMessages = async ({ roomId, token }) => {
  const data = await request(`/api/messages?roomId=${encodeURIComponent(roomId)}`, { token });
  return data.messages || [];
};

export const sendMessage = async ({ roomId, text, token }) => {
  const data = await request('/api/messages', {
    method: 'POST',
    token,
    body: JSON.stringify({ roomId, text }),
  });
  return data.message;
};

export const markMessagesRead = async ({ roomId, token }) => {
  const data = await request('/api/messages/read', {
    method: 'PATCH',
    token,
    body: JSON.stringify({ roomId }),
  });
  return data.messages || [];
};

export const editMessage = async ({ id, text, token }) => {
  const data = await request(`/api/messages/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ text }),
  });
  return data.message;
};

export const deleteMessage = async ({ id, token }) => {
  const data = await request(`/api/messages/${id}`, {
    method: 'DELETE',
    token,
  });
  return data.id;
};
