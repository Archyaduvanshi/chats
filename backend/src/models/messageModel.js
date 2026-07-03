const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32,
    },
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    cipherText: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
    tag: {
      type: String,
      required: true,
    },
    delivered: {
      type: Boolean,
      default: true,
    },
    readBy: {
      type: [String],
      default: [],
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
