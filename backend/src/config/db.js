const mongoose = require('mongoose');
const env = require('./env');

const connectDb = async () => {
  if (!env.mongoUri) {
    console.log('MongoDB URI not provided. Using local JSON message store.');
    return false;
  }

  try {
    await mongoose.connect(env.mongoUri);
    console.log('MongoDB connected');
    return true;
  } catch (error) {
    console.warn(`MongoDB connection failed. Using local JSON message store. ${error.message}`);
    return false;
  }
};

module.exports = connectDb;
