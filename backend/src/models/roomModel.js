const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 48,
    },
    type: {
      type: String,
      enum: ['room', 'direct'],
      default: 'room',
    },
    passwordHash: {
      type: String,
      default: '',
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
    },
    roomCode: {
      type: String,
      required: true,
      unique: true,
    },
    maxMembers: {
      type: Number,
      default: 50,
      min: 2,
      max: 500,
    },
    members: {
      type: [String],
      default: [],
    },
    admins: {
      type: [String],
      default: [],
    },
    hiddenFor: {
      type: [String],
      default: [],
    },
    clearedAtBy: {
      type: Map,
      of: Date,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
