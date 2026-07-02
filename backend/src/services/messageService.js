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

const sanitizeMessage = ({ username, text }) => {
  const cleanUsername = String(username || '').trim().slice(0, 32);
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

const toClientMessage = (message) => {
  const raw = message.toObject ? message.toObject() : message;

  return {
    id: String(raw._id || raw.id),
    username: raw.username,
    text: decryptText(raw),
    delivered: Boolean(raw.delivered),
    readBy: raw.readBy || [],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt || raw.createdAt,
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
  const { username, text } = sanitizeMessage(payload);
  const encrypted = encryptText(text);

  if (usingMongo()) {
    const message = await Message.create({
      username,
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

const getMessages = async () => {
  if (usingMongo()) {
    const messages = await Message.find({}).sort({ createdAt: 1 }).limit(100);
    return messages.map(toClientMessage);
  }

  const messages = await readFileMessages();
  return messages.slice(-100).map(toClientMessage);
};

const markMessagesRead = async (username) => {
  const cleanUsername = String(username || '').trim().slice(0, 32);
  if (!cleanUsername) return [];

  if (usingMongo()) {
    await Message.updateMany(
      { readBy: { $ne: cleanUsername } },
      { $addToSet: { readBy: cleanUsername } }
    );
    return getMessages();
  }

  const messages = await readFileMessages();
  const updatedMessages = messages.map((message) => {
    const readBy = message.readBy || [];
    if (readBy.includes(cleanUsername)) return message;
    return { ...message, readBy: [...readBy, cleanUsername], updatedAt: new Date().toISOString() };
  });
  await writeFileMessages(updatedMessages);
  return updatedMessages.slice(-100).map(toClientMessage);
};

module.exports = {
  createMessage,
  getMessages,
  markMessagesRead,
};
