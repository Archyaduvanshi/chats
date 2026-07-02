const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
};

export const fetchMessages = async () => {
  const data = await request('/api/messages');
  return data.messages || [];
};

export const sendMessage = async ({ username, text }) => {
  const data = await request('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ username, text }),
  });
  return data.message;
};

export const markMessagesRead = async (username) => {
  const data = await request('/api/messages/read', {
    method: 'PATCH',
    body: JSON.stringify({ username }),
  });
  return data.messages || [];
};

export const editMessage = async ({ id, username, text }) => {
  const data = await request(`/api/messages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ username, text }),
  });
  return data.message;
};

export const deleteMessage = async ({ id, username }) => {
  const data = await request(`/api/messages/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ username }),
  });
  return data.id;
};
