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

const toClientUser = (user) => {
  const raw = user.toObject ? user.toObject() : user;
  return {
    id: String(raw._id || raw.id),
    username: raw.username,
    phone: raw.phone || '',
    role: raw.role,
    status: raw.status,
  };
};

const signToken = (user) =>
  jwt.sign({ id: user.id, username: user.username, role: user.role }, env.jwtSecret, {
    expiresIn: '7d',
  });

const createSession = (user) => ({
  user: toClientUser(user),
  token: signToken(toClientUser(user)),
});

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
      status: isFirstUser ? 'approved' : 'pending',
    });

    return user.status === 'approved'
      ? createSession(user)
      : { user: toClientUser(user), token: '' };
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
    status: isFirstUser ? 'approved' : 'pending',
    createdAt: now,
    updatedAt: now,
  };
  store.users.push(user);
  await writeStore(store);

  return user.status === 'approved' ? createSession(user) : { user: toClientUser(user), token: '' };
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
  if (user.status !== 'approved') {
    throw Object.assign(new Error('Waiting for admin approval.'), { status: 403 });
  }

  return createSession(user);
};

const findApprovedUserById = async (id) => {
  if (usingMongo()) {
    const user = await User.findById(id);
    return user?.status === 'approved' ? toClientUser(user) : null;
  }

  const store = await readStore();
  const user = store.users.find((candidate) => String(candidate.id) === String(id));
  return user?.status === 'approved' ? toClientUser(user) : null;
};

const listUsers = async () => {
  if (usingMongo()) {
    const users = await User.find({}).sort({ createdAt: 1 });
    return users.map(toClientUser);
  }

  const store = await readStore();
  return store.users.map(toClientUser);
};

const approveUser = async (id) => {
  if (usingMongo()) {
    const user = await User.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    );
    if (!user) {
      throw Object.assign(new Error('User not found.'), { status: 404 });
    }
    return toClientUser(user);
  }

  const store = await readStore();
  const user = store.users.find((candidate) => String(candidate.id) === String(id));
  if (!user) {
    throw Object.assign(new Error('User not found.'), { status: 404 });
  }
  user.status = 'approved';
  user.updatedAt = new Date().toISOString();
  await writeStore(store);
  return toClientUser(user);
};

module.exports = {
  approveUser,
  findApprovedUserById,
  listUsers,
  login,
  signup,
  toClientUser,
};
