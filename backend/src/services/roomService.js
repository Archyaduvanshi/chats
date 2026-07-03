const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Room = require('../models/roomModel');
const { createId, readStore, writeStore } = require('./fileStore');
const authService = require('./authService');

const usingMongo = () => mongoose.connection.readyState === 1;

const sanitizeName = (name) => String(name || '').trim().slice(0, 48);

const createInviteCode = () => crypto.randomBytes(10).toString('hex');
const createRoomCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();
const normalizePhone = (phone) => String(phone || '').replace(/[^\d+]/g, '').slice(0, 20);
const sanitizeMaxMembers = (maxMembers) => {
  const parsed = Number.parseInt(maxMembers, 10);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(Math.max(parsed, 2), 500);
};

const toClientRoom = (room) => {
  const raw = room.toObject ? room.toObject() : room;
  return {
    id: String(raw._id || raw.id),
    name: raw.name,
    type: raw.type,
    hasPassword: Boolean(raw.passwordHash),
    inviteCode: raw.inviteCode,
    roomCode: raw.roomCode || '',
    maxMembers: raw.maxMembers || 50,
    memberCount: raw.members?.length || 0,
    members: raw.members || [],
    admins: raw.admins || [],
    createdAt: raw.createdAt,
  };
};

const addDirectPeerDetails = async (rooms, currentUsername) => {
  const users = await authService.listUsers();
  const usersByUsername = new Map(users.map((user) => [user.username, user]));

  return rooms.map((room) => {
    if (room.type !== 'direct') return room;

    const peerUsername = room.members.find((member) => member !== currentUsername) || '';
    const peer = usersByUsername.get(peerUsername);
    return {
      ...room,
      peerUsername,
      peerPhone: peer?.phone || '',
    };
  });
};

const assignMissingRoomFields = async (room) => {
  let changed = false;
  if (!room.inviteCode) {
    room.inviteCode = createInviteCode();
    changed = true;
  }
  if (!room.roomCode) {
    room.roomCode = createRoomCode();
    changed = true;
  }
  if (!room.maxMembers) {
    room.maxMembers = 50;
    changed = true;
  }
  if (changed) {
    if (room.save) {
      await room.save();
    } else {
      room.updatedAt = new Date().toISOString();
      await saveFileRoom(room);
    }
  }
  return room;
};

const ensureDefaultRoom = async (username) => {
  if (usingMongo()) {
    let room = await Room.findOne({ type: 'room', name: 'Lobby' });
    if (!room) {
      room = await Room.create({
        name: 'Lobby',
        type: 'room',
        inviteCode: createInviteCode(),
        roomCode: createRoomCode(),
        maxMembers: 500,
        members: [username],
        admins: [username],
      });
    } else if (username && !room.members.includes(username)) {
      room.members.push(username);
      await room.save();
    }
    return toClientRoom(room);
  }

  const store = await readStore();
  let room = store.rooms.find((candidate) => candidate.type === 'room' && candidate.name === 'Lobby');
  if (!room) {
    const now = new Date().toISOString();
    room = {
      id: createId(),
      name: 'Lobby',
      type: 'room',
      passwordHash: '',
      inviteCode: createInviteCode(),
      roomCode: createRoomCode(),
      maxMembers: 500,
      members: username ? [username] : [],
      admins: username ? [username] : [],
      createdAt: now,
      updatedAt: now,
    };
    store.rooms.push(room);
  } else if (username && !room.members.includes(username)) {
    room.members.push(username);
    room.updatedAt = new Date().toISOString();
  }
  await writeStore(store);
  return toClientRoom(room);
};

const listRoomsForUser = async (user) => {
  await ensureDefaultRoom(user.username);

  if (usingMongo()) {
    const rooms = await Room.find({ members: user.username }).sort({ createdAt: 1 });
    const clientRooms = await Promise.all(
      rooms.map(async (room) => toClientRoom(await assignMissingRoomFields(room)))
    );
    return addDirectPeerDetails(clientRooms, user.username);
  }

  const store = await readStore();
  let changed = false;
  const rooms = store.rooms
    .filter((room) => room.members.includes(user.username))
    .map((room) => {
      if (!room.inviteCode) {
        room.inviteCode = createInviteCode();
        changed = true;
      }
      if (!room.roomCode) {
        room.roomCode = createRoomCode();
        changed = true;
      }
      if (!room.maxMembers) {
        room.maxMembers = room.type === 'direct' ? 2 : 50;
        changed = true;
      }
      return toClientRoom(room);
    });
  if (changed) {
    await writeStore(store);
  }
  return addDirectPeerDetails(rooms, user.username);
};

const createRoom = async ({ name, password, maxMembers }, user) => {
  const cleanName = sanitizeName(name);
  const cleanMaxMembers = sanitizeMaxMembers(maxMembers);
  if (!cleanName) {
    throw Object.assign(new Error('Room name is required.'), { status: 400 });
  }

  const passwordHash = password ? await bcrypt.hash(String(password), 10) : '';

  if (usingMongo()) {
    const room = await Room.create({
      name: cleanName,
      type: 'room',
      passwordHash,
      inviteCode: createInviteCode(),
      roomCode: createRoomCode(),
      maxMembers: cleanMaxMembers,
      members: [user.username],
      admins: [user.username],
    });
    return toClientRoom(room);
  }

  const store = await readStore();
  const now = new Date().toISOString();
  const room = {
    id: createId(),
    name: cleanName,
    type: 'room',
    passwordHash,
    inviteCode: createInviteCode(),
    roomCode: createRoomCode(),
    maxMembers: cleanMaxMembers,
    members: [user.username],
    admins: [user.username],
    createdAt: now,
    updatedAt: now,
  };
  store.rooms.push(room);
  await writeStore(store);
  return toClientRoom(room);
};

const findRoom = async (id) => {
  if (usingMongo()) {
    const room = await Room.findById(id);
    return room || null;
  }

  const store = await readStore();
  return store.rooms.find((room) => String(room.id) === String(id)) || null;
};

const findRoomByCode = async (code) => {
  const cleanCode = String(code || '').trim().toUpperCase();
  if (!cleanCode) return null;

  if (usingMongo()) {
    const room = await Room.findOne({ roomCode: cleanCode });
    return room || null;
  }

  const store = await readStore();
  return store.rooms.find((room) => String(room.roomCode || '').toUpperCase() === cleanCode) || null;
};

const saveFileRoom = async (room) => {
  const store = await readStore();
  const index = store.rooms.findIndex((candidate) => String(candidate.id) === String(room.id));
  if (index !== -1) {
    store.rooms[index] = room;
    await writeStore(store);
  }
};

const assertRoomMember = async (roomId, user) => {
  const room = await findRoom(roomId);
  if (!room) {
    throw Object.assign(new Error('Room not found.'), { status: 404 });
  }

  if (!room.members.includes(user.username)) {
    throw Object.assign(new Error('You do not have access to this room.'), { status: 403 });
  }

  return toClientRoom(room);
};

const joinRoom = async ({ roomId, roomCode, password, inviteCode }, user) => {
  const room = roomId ? await findRoom(roomId) : await findRoomByCode(roomCode);
  if (!room) {
    throw Object.assign(new Error('Room not found.'), { status: 404 });
  }
  await assignMissingRoomFields(room);

  const inviteMatches = inviteCode && inviteCode === room.inviteCode;
  const roomCodeMatches = roomCode && String(roomCode).trim().toUpperCase() === room.roomCode;
  const passwordMatches =
    !room.passwordHash || (password && (await bcrypt.compare(String(password), room.passwordHash)));

  if (!inviteMatches && !roomCodeMatches && !passwordMatches) {
    throw Object.assign(new Error('Room code, password, or private invite link is required.'), {
      status: 403,
    });
  }

  if (!room.members.includes(user.username)) {
    if (room.members.length >= (room.maxMembers || 50)) {
      throw Object.assign(new Error('This room is full.'), { status: 403 });
    }
    room.members.push(user.username);
  }

  if (room.save) {
    await room.save();
  } else {
    room.updatedAt = new Date().toISOString();
    await saveFileRoom(room);
  }

  return toClientRoom(room);
};

const createDirectRoom = async ({ username }, user) => {
  const lookup = String(username || '').trim();
  const lookupPhone = normalizePhone(lookup);
  const users = await authService.listUsers();
  const otherUser = users.find(
    (candidate) =>
      candidate.status === 'approved' &&
      (candidate.username?.toLowerCase() === lookup.toLowerCase() || candidate.phone === lookupPhone)
  );

  if (!otherUser || otherUser.username === user.username) {
    throw Object.assign(new Error('Choose another approved user for private chat.'), {
      status: 400,
    });
  }

  const members = [user.username, otherUser.username].sort();
  const directName = members.join(' / ');

  if (usingMongo()) {
    let room = await Room.findOne({ type: 'direct', members: { $all: members, $size: 2 } });
    if (!room) {
      room = await Room.create({
        name: directName,
        type: 'direct',
        inviteCode: createInviteCode(),
        roomCode: createRoomCode(),
        maxMembers: 2,
        members,
        admins: members,
      });
    }
    const enrichedRooms = await addDirectPeerDetails(
      [toClientRoom(await assignMissingRoomFields(room))],
      user.username
    );
    return enrichedRooms[0];
  }

  const store = await readStore();
  let room = store.rooms.find(
    (candidate) =>
      candidate.type === 'direct' &&
      candidate.members.length === 2 &&
      members.every((member) => candidate.members.includes(member))
  );
  if (!room) {
    const now = new Date().toISOString();
    room = {
      id: createId(),
      name: directName,
      type: 'direct',
      passwordHash: '',
      inviteCode: createInviteCode(),
      roomCode: createRoomCode(),
      maxMembers: 2,
      members,
      admins: members,
      createdAt: now,
      updatedAt: now,
    };
    store.rooms.push(room);
    await writeStore(store);
  }

  await assignMissingRoomFields(room);
  const enrichedRooms = await addDirectPeerDetails([toClientRoom(room)], user.username);
  return enrichedRooms[0];
};

module.exports = {
  assertRoomMember,
  createDirectRoom,
  createRoom,
  ensureDefaultRoom,
  joinRoom,
  listRoomsForUser,
};
