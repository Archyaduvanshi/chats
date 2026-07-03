const fs = require('fs/promises');
const path = require('path');
const env = require('../config/env');

const emptyStore = {
  users: [],
  rooms: [],
};

const ensureAppDataFile = async () => {
  await fs.mkdir(path.dirname(env.appDataFile), { recursive: true });
  try {
    await fs.access(env.appDataFile);
  } catch {
    await fs.writeFile(env.appDataFile, JSON.stringify(emptyStore, null, 2), 'utf8');
  }
};

const readStore = async () => {
  await ensureAppDataFile();
  const raw = await fs.readFile(env.appDataFile, 'utf8');
  return { ...emptyStore, ...JSON.parse(raw || '{}') };
};

const writeStore = async (store) => {
  await ensureAppDataFile();
  await fs.writeFile(env.appDataFile, JSON.stringify(store, null, 2), 'utf8');
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

module.exports = {
  createId,
  readStore,
  writeStore,
};
