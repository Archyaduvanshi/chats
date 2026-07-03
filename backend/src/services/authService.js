const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const env = require('../config/env');
const { createId, readStore, writeStore } = require('./fileStore');

const usingMongo = () => mongoose.connection.readyState === 1;

const sanitizeUsername = (username) => String(username || '').trim().slice(0, 32);
const normalizePhone = (phone) => String(phone || '').replace(/[^\d+]/g, '').slice(0, 20);
const isValidPhone = (phone) => /^\+?\d{7,15}$/.test(phone);
const normalizeToken = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw.startsWith('Bearer ') ? raw.slice(7) : raw;
};

const toClientUser = (user, includeSensitive = false) => {
  const raw = user.toObject ? user.toObject() : user;
  const clientUser = {
    id: String(raw._id || raw.id),
    username: raw.username,
  };

  if (includeSensitive) {
    clientUser.phone = raw.phone || '';
    clientUser.role = raw.role;
    clientUser.status = raw.status;
  }

  return clientUser;
};

const signToken = (user) =>
  jwt.sign({ id: user.id, username: user.username, role: user.role }, env.jwtSecret, {
    expiresIn: '7d',
  });

const createSession = (user) => {
  const clientUser = toClientUser(user, true);
  return {
    user: clientUser,
    token: signToken(user),
  };
};

const signup = async ({ username, phone, password }) => {
  const cleanUsername = sanitizeUsername(username);
  const cleanPhone = normalizePhone(phone);
  const cleanPassword = String(password || '');

  if (!cleanUsername) {
    throw Object.assign(new Error('Username is required.'), { status: 400 });
  }
  if (!isValidPhone(cleanPhone)) {
    throw Object.assign(new Error('Valid phone number is required.'), { status: 400 });
  }
  if (cleanPassword.length < 6) {
    throw Object.assign(new Error('Password must be at least 6 characters.'), { status: 400 });
  }

  const passwordHash = await bcrypt.hash(cleanPassword, 10);

  if (usingMongo()) {
    const existing = await User.findOne({
      $or: [
        { username: new RegExp(`^${cleanUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        { phone: cleanPhone },
      ],
    });
    if (existing) {
      throw Object.assign(new Error('Username or phone number is already taken.'), { status: 409 });
    }

    const isFirstUser = (await User.countDocuments()) === 0;
    const user = await User.create({
      username: cleanUsername,
      phone: cleanPhone,
      passwordHash,
      role: isFirstUser ? 'admin' : 'member',
      status: 'approved',
    });

    return createSession(user);
  }

  const store = await readStore();
  if (
    store.users.some(
      (user) =>
        user.username?.toLowerCase() === cleanUsername.toLowerCase() || user.phone === cleanPhone
    )
  ) {
    throw Object.assign(new Error('Username or phone number is already taken.'), { status: 409 });
  }

  const isFirstUser = store.users.length === 0;
  const now = new Date().toISOString();
  const user = {
    id: createId(),
    username: cleanUsername,
    phone: cleanPhone,
    passwordHash,
    role: isFirstUser ? 'admin' : 'member',
    status: 'approved',
    createdAt: now,
    updatedAt: now,
  };
  store.users.push(user);
  await writeStore(store);

  return createSession(user);
};

const login = async ({ username, password }) => {
  const loginId = sanitizeUsername(username);
  const cleanPhone = normalizePhone(username);
  const cleanPassword = String(password || '');

  const user = usingMongo()
    ? await User.findOne({
        $or: [
          { username: new RegExp(`^${loginId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          { phone: cleanPhone },
        ],
      })
    : (await readStore()).users.find(
        (candidate) =>
          candidate.username?.toLowerCase() === loginId.toLowerCase() ||
          candidate.phone === cleanPhone
      );

  if (!user || !(await bcrypt.compare(cleanPassword, user.passwordHash))) {
    throw Object.assign(new Error('Invalid username or password.'), { status: 401 });
  }

  return createSession(user);
};

const findUserByLookup = async (lookup) => {
  const cleanLookup = sanitizeUsername(lookup);
  const cleanPhone = normalizePhone(lookup);

  if (usingMongo()) {
    const user = await User.findOne({
      $or: [
        { username: new RegExp(`^${cleanLookup.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        { phone: cleanPhone },
      ],
    });
    return user || null;
  }

  const store = await readStore();
  return (
    store.users.find(
      (candidate) =>
        candidate.username?.toLowerCase() === cleanLookup.toLowerCase() || candidate.phone === cleanPhone
    ) || null
  );
};

const findUserById = async (id) => {
  const cleanId = String(id || '').trim();
  if (!cleanId) return null;

  if (usingMongo()) {
    const user = await User.findById(cleanId);
    return user ? toClientUser(user, true) : null;
  }

  const store = await readStore();
  const user = store.users.find((candidate) => String(candidate.id) === cleanId);
  return user ? toClientUser(user, true) : null;
};

const getUserFromToken = async (token) => {
  const cleanToken = normalizeToken(token);
  if (!cleanToken) {
    throw Object.assign(new Error('Login is required.'), { status: 401 });
  }

  const payload = jwt.verify(cleanToken, env.jwtSecret);
  const userId = payload.id || payload.userId || payload._id;
  if (!userId) {
    throw Object.assign(new Error('Invalid session.'), { status: 401 });
  }

  const user = await findUserById(userId);
  if (!user) {
    throw Object.assign(new Error('User no longer exists.'), { status: 401 });
  }

  return user;
};

const listUsers = async () => {
  if (usingMongo()) {
    const users = await User.find({}).sort({ createdAt: 1 });
    return users.map(toClientUser);
  }

  const store = await readStore();
  return store.users.map(toClientUser);
};

module.exports = {
  findUserById,
  findUserByLookup,
  getUserFromToken,
  listUsers,
  login,
  normalizeToken,
  signup,
  toClientUser,
};
