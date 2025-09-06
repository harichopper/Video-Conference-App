const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, gender } = req.body;

    console.log("Signup request body:", req.body);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const seed = name || 'User';
    const avatarParams = gender === 'female'
      ? `facialHairProbability=0&hairStyle=long01,long02,long03,long04,long05&clothesType=blouse,graphic&topChance=100`
      : `facialHairProbability=100&hairStyle=short01,short02,short03,short04,short05&clothesType=shirt,hoodie,blazer&topChance=100`;
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&${avatarParams}`;

    const user = new User({
      name,
      email,
      password: hashedPassword,
      gender: gender || 'male',
      avatar
    });

    await user.save();

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing in environment variables');
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { id: user._id, name, email, gender, avatar } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Error creating user', details: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login request body:', req.body);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing in environment variables');
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { id: user._id, name: user.name, email, gender: user.gender, avatar: user.avatar } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error logging in', details: err.message });
  }
});

// GET /user - Fetch user data
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /user - Update user data
router.put('/user', authMiddleware, async (req, res) => {
  try {
    const { name, gender, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, gender, avatar },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;