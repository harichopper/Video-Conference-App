const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Generate a random meeting ID
function generateMeetingId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a new meeting
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const meetingId = generateMeetingId();
    
    // Check if MongoDB is connected before trying to save
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, returning mock response');
      return res.json({ meetingId });
    }
    
    const meeting = new Meeting({
      meetingId,
      owner: req.userId,
      createdAt: new Date(),
      status: 'active',
      participants: []
    });
    
    await meeting.save();
    
    // Add meeting to user's meetings array
    await User.findByIdAndUpdate(req.userId, {
      $push: { meetings: { meetingId, joinedAt: new Date() } }
    });
    
    res.json({ meetingId });
  } catch (err) {
    console.error('Error creating meeting:', err);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// Join a meeting
router.post('/join/:meetingId', authMiddleware, async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, returning mock success response');
      return res.json({ success: true });
    }
    
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    if (meeting.status !== 'active') {
      return res.status(400).json({ error: 'Meeting has ended' });
    }

    // Check if user already a participant
    const isParticipant = meeting.participants?.some(
      (p) => p.userId.toString() === req.userId
    );
    
    if (!isParticipant) {
      meeting.participants.push({ userId: req.userId, joinedAt: new Date() });
      await meeting.save();
      
      await User.findByIdAndUpdate(req.userId, {
        $addToSet: { meetings: { meetingId, joinedAt: new Date() } }
      });
    }
    
    res.json({ success: true, message: 'Joined meeting successfully' });
  } catch (err) {
    console.error('Error joining meeting:', err);
    res.status(500).json({ error: 'Failed to join meeting', details: err.message });
  }
});

// Validate meeting ID
router.get('/validate/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    console.log(`Validating meeting ID: ${meetingId}`);
    
    if (process.env.NODE_ENV === 'development' || !mongoose || mongoose.connection.readyState !== 1) {
      console.log('Development mode or MongoDB not connected: all meeting IDs are valid');
      return res.json({ valid: true, meetingId });
    }
    
    const meeting = await Meeting.findOne({ meetingId });
    
    if (!meeting) {
      return res.json({ valid: false, message: 'Meeting not found', meetingId });
    }
    
    if (meeting.status !== 'active') {
      return res.json({ valid: false, message: 'Meeting has ended', meetingId });
    }
    
    res.json({ valid: true, meetingId, owner: meeting.owner });
  } catch (err) {
    console.error('Error validating meeting:', err);
    res.status(500).json({ valid: false, message: 'Error validating meeting', error: err.message });
  }
});

// End a meeting
router.post('/end/:meetingId', authMiddleware, async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, returning mock success response');
      return res.json({ success: true });
    }
    
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    if (meeting.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to end this meeting' });
    }
    
    meeting.status = 'ended';
    meeting.endedAt = new Date();
    await meeting.save();
    
    res.json({ success: true, message: 'Meeting ended successfully' });
  } catch (err) {
    console.error('Error ending meeting:', err);
    res.status(500).json({ error: 'Failed to end meeting', details: err.message });
  }
});

module.exports = router;
