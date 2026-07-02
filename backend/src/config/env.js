const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const defaultClientOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const configuredClientOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || '',
  clientOrigins: [...new Set([...defaultClientOrigins, ...configuredClientOrigins])],
  messageSecret: process.env.MESSAGE_SECRET || 'dev-message-secret-change-me',
  dataFile: process.env.DATA_FILE || path.resolve(__dirname, '../../data/messages.json'),
};

module.exports = env;
