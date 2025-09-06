const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  meetingId: { type: String, required: true },
  sender: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isPrivate: { type: Boolean, default: false },
  to: { type: String, default: null }, // userId or username for private messages
  _id: { type: String, required: false } // allow custom message IDs if needed
});

module.exports = mongoose.model('Chat', ChatSchema);
