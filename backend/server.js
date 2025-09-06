const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const meetingRoutes = require('./routes/meetingRoutes');
const authRoutes = require('./routes/authRoutes'); // 👈 added
const { initializeSocket } = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // frontend
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/videoconference',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected');
});

// MongoDB connection error handling - make more robust
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
  console.log('The server will continue running with limited functionality.');
  // We don't exit the process here to allow the app to run with mock data
});

// Routes
app.use('/meeting', meetingRoutes);
app.use('/auth', authRoutes); // 👈 now signup/login will work

// Add an error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    error: 'Server error', 
    message: err.message || 'An unexpected error occurred'
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', message: 'The requested resource does not exist' });
});

// Health check route
app.get('/', (req, res) => {
  res.send('Video Conference API is running 🚀');
});

// Initialize Socket.io
initializeSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
