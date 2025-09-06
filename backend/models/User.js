const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female'], default: 'male' }, // Added gender field
  avatar: { type: String, default: '' },
  joinedAt: { type: Date, default: Date.now },
  meetings: [{
    meetingId: String,
    joinedAt: Date
  }]
});

module.exports = mongoose.model('User', UserSchema);