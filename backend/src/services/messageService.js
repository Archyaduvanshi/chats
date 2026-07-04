const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const Message = require('../models/messageModel');
const env = require('../config/env');
const { encryptText, decryptText } = require('../utils/crypto');

const ensureDataFile = async () => {
  await fs.mkdir(path.dirname(env.dataFile), { recursive: true });
  try {
    await fs.access(env.dataFile);
  } catch {
    await fs.writeFile(env.dataFile, '[]', 'utf8');
  }
};

const usingMongo = () => mongoose.connection.readyState === 1;

const sanitizeMessage = ({ username, roomId, text }) => {
  const cleanUsername = sanitizeUsername(username);
  const cleanRoomId = String(roomId || '').trim();
  const cleanText = String(text || '').trim();

  if (!cleanUsername) {
    throw Object.assign(new Error('Username is required.'), { status: 400 });
  }
  if (!cleanRoomId) {
    throw Object.assign(new Error('Room is required.'), { status: 400 });
  }

  if (!cleanText) {
    throw Object.assign(new Error('Message text is required.'), { status: 400 });
  }

  if (cleanText.length > 1000) {
    throw Object.assign(new Error('Message cannot exceed 1000 characters.'), { status: 400 });
  }

  return { username: cleanUsername, roomId: cleanRoomId, text: cleanText };
};

const sanitizeMessageEdit = ({ username, text }) => {
  const cleanUsername = sanitizeUsername(username);
  const cleanText = String(text || '').trim();

  if (!cleanUsername) {
    throw Object.assign(new Error('Username is required.'), { status: 400 });
  }

  if (!cleanText) {
    throw Object.assign(new Error('Message text is required.'), { status: 400 });
  }

  if (cleanText.length > 1000) {
    throw Object.assign(new Error('Message cannot exceed 1000 characters.'), { status: 400 });
  }

  return { username: cleanUsername, text: cleanText };
};

const sanitizeUsername = (username) => String(username || '').trim().slice(0, 32);

const canEditMessage = (message) =>
  Date.now() - new Date(message.createdAt).getTime() <= 60 * 1000;

const toClientMessage = (message) => {
  const raw = message.toObject ? message.toObject() : message;

  return {
    id: String(raw._id || raw.id),
    username: raw.username,
    roomId: raw.roomId || 'lobby',
    text: decryptText(raw),
    delivered: Boolean(raw.delivered),
    readBy: raw.readBy || [],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt || raw.createdAt,
    editedAt: raw.editedAt,
  };
};

const readFileMessages = async () => {
  await ensureDataFile();
  const raw = await fs.readFile(env.dataFile, 'utf8');
  return JSON.parse(raw || '[]');
};

const writeFileMessages = async (messages) => {
  await ensureDataFile();
  await fs.writeFile(env.dataFile, JSON.stringify(messages, null, 2), 'utf8');
};

const createMessage = async (payload) => {
  const { username, roomId, text } = sanitizeMessage(payload);
  const encrypted = encryptText(text);

  if (usingMongo()) {
    const message = await Message.create({
      username,
      roomId,
      ...encrypted,
      delivered: true,
      readBy: [username],
    });
    return toClientMessage(message);
  }

  const now = new Date().toISOString();
  const storedMessage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    username,
    roomId,
    ...encrypted,
    delivered: true,
    readBy: [username],
    createdAt: now,
    updatedAt: now,
  };
  const messages = await readFileMessages();
  messages.push(storedMessage);
  await writeFileMessages(messages);
  return toClientMessage(storedMessage);
};

const getMessages = async (roomId, options = {}) => {
  const cleanRoomId = String(roomId || '').trim();
  const clearedAt = options.clearedAt ? new Date(options.clearedAt) : null;
  if (!cleanRoomId) {
    throw Object.assign(new Error('Room is required.'), { status: 400 });
  }

  if (usingMongo()) {
    const query = { roomId: cleanRoomId };
    if (clearedAt) {
      query.createdAt = { $gt: clearedAt };
    }
    const messages = await Message.find(query).sort({ createdAt: 1 }).limit(100);
    return messages.map(toClientMessage);
  }

  const messages = await readFileMessages();
  return messages
    .filter((message) => (message.roomId || 'lobby') === cleanRoomId)
    .filter((message) => !clearedAt || new Date(message.createdAt) > clearedAt)
    .slice(-100)
    .map(toClientMessage);
};

const markMessagesRead = async (username, roomId, options = {}) => {
  const cleanUsername = sanitizeUsername(username);
  const cleanRoomId = String(roomId || '').trim();
  const clearedAt = options.clearedAt ? new Date(options.clearedAt) : null;
  if (!cleanUsername) return [];
  if (!cleanRoomId) return [];

  if (usingMongo()) {
    const query = { roomId: cleanRoomId, readBy: { $ne: cleanUsername } };
    if (clearedAt) {
      query.createdAt = { $gt: clearedAt };
    }
    await Message.updateMany(
      query,
      { $addToSet: { readBy: cleanUsername } }
    );
    return getMessages(cleanRoomId, { clearedAt });
  }

  const messages = await readFileMessages();
  const updatedMessages = messages.map((message) => {
    if ((message.roomId || 'lobby') !== cleanRoomId) return message;
    if (clearedAt && new Date(message.createdAt) <= clearedAt) return message;
    const readBy = message.readBy || [];
    if (readBy.includes(cleanUsername)) return message;
    return { ...message, readBy: [...readBy, cleanUsername], updatedAt: new Date().toISOString() };
  });
  await writeFileMessages(updatedMessages);
  return updatedMessages
    .filter((message) => (message.roomId || 'lobby') === cleanRoomId)
    .filter((message) => !clearedAt || new Date(message.createdAt) > clearedAt)
    .slice(-100)
    .map(toClientMessage);
};

const countUnreadByRoomIds = async (username, roomIds, clearedAtByRoomId = new Map()) => {
  const cleanUsername = sanitizeUsername(username);
  const cleanRoomIds = roomIds.map((roomId) => String(roomId || '').trim()).filter(Boolean);
  const counts = new Map(cleanRoomIds.map((roomId) => [roomId, 0]));

  if (!cleanUsername || cleanRoomIds.length === 0) return counts;

  if (usingMongo()) {
    const match = {
      roomId: { $in: cleanRoomIds },
      username: { $ne: cleanUsername },
      readBy: { $ne: cleanUsername },
    };
    const perRoomClearedAt = cleanRoomIds
      .map((roomId) => [roomId, clearedAtByRoomId.get?.(roomId)])
      .filter(([, clearedAt]) => clearedAt);

    const pipeline =
      perRoomClearedAt.length > 0
        ? [
            { $match: match },
            {
              $match: {
                $or: cleanRoomIds.map((roomId) => {
                  const clearedAt = clearedAtByRoomId.get?.(roomId);
                  return clearedAt ? { roomId, createdAt: { $gt: clearedAt } } : { roomId };
                }),
              },
            },
          ]
        : [{ $match: match }];

    const unreadCounts = await Message.aggregate([
      ...pipeline,
      { $group: { _id: '$roomId', count: { $sum: 1 } } },
    ]);

    unreadCounts.forEach((entry) => {
      counts.set(String(entry._id), entry.count);
    });
    return counts;
  }

  const messages = await readFileMessages();
  messages.forEach((message) => {
    const roomId = String(message.roomId || 'lobby');
    if (!counts.has(roomId)) return;
    const clearedAt = clearedAtByRoomId.get?.(roomId);
    if (clearedAt && new Date(message.createdAt) <= clearedAt) return;
    if (message.username === cleanUsername) return;
    if ((message.readBy || []).includes(cleanUsername)) return;
    counts.set(roomId, counts.get(roomId) + 1);
  });
  return counts;
};

const updateMessage = async (id, payload) => {
  const { username, text } = sanitizeMessageEdit(payload);

  if (usingMongo()) {
    const message = await Message.findById(id);
    if (!message) {
      throw Object.assign(new Error('Message not found.'), { status: 404 });
    }
    if (message.username !== username) {
      throw Object.assign(new Error('Only the sender can edit this message.'), { status: 403 });
    }
    if (!canEditMessage(message)) {
      throw Object.assign(new Error('Messages can only be edited within 1 minute.'), { status: 403 });
    }

    const encrypted = encryptText(text);
    message.cipherText = encrypted.cipherText;
    message.iv = encrypted.iv;
    message.tag = encrypted.tag;
    message.editedAt = new Date();
    await message.save();
    return toClientMessage(message);
  }

  const messages = await readFileMessages();
  const messageIndex = messages.findIndex((message) => String(message.id) === String(id));
  if (messageIndex === -1) {
    throw Object.assign(new Error('Message not found.'), { status: 404 });
  }

  const message = messages[messageIndex];
  if (message.username !== username) {
    throw Object.assign(new Error('Only the sender can edit this message.'), { status: 403 });
  }
  if (!canEditMessage(message)) {
    throw Object.assign(new Error('Messages can only be edited within 1 minute.'), { status: 403 });
  }

  const encrypted = encryptText(text);
  const editedAt = new Date().toISOString();
  messages[messageIndex] = {
    ...message,
    ...encrypted,
    updatedAt: editedAt,
    editedAt,
  };
  await writeFileMessages(messages);
  return toClientMessage(messages[messageIndex]);
};

const deleteMessage = async (id, username) => {
  const cleanUsername = sanitizeUsername(username);
  if (!cleanUsername) {
    throw Object.assign(new Error('Username is required.'), { status: 400 });
  }

  if (usingMongo()) {
    const message = await Message.findById(id);
    if (!message) {
      throw Object.assign(new Error('Message not found.'), { status: 404 });
    }
    if (message.username !== cleanUsername) {
      throw Object.assign(new Error('Only the sender can delete this message.'), { status: 403 });
    }
    const roomId = message.roomId;
    await Message.deleteOne({ _id: id });
    return { id: String(id), roomId };
  }

  const messages = await readFileMessages();
  const messageIndex = messages.findIndex((message) => String(message.id) === String(id));
  if (messageIndex === -1) {
    throw Object.assign(new Error('Message not found.'), { status: 404 });
  }
  if (messages[messageIndex].username !== cleanUsername) {
    throw Object.assign(new Error('Only the sender can delete this message.'), { status: 403 });
  }

  const roomId = messages[messageIndex].roomId || 'lobby';
  messages.splice(messageIndex, 1);
  await writeFileMessages(messages);
  return { id: String(id), roomId };
};

module.exports = {
  countUnreadByRoomIds,
  createMessage,
  deleteMessage,
  getMessages,
  markMessagesRead,
  updateMessage,
};
