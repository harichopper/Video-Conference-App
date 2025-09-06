const Meeting = require('../models/Meeting');

// Store active meetings and their participants
const meetings = new Map();

// Generate a random meeting ID without external dependencies
function generateMeetingId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Join a room/meeting
    socket.on('join-room', (roomId, userId, userName) => {
      console.log(`📥 User ${userName} (${userId}) wants to join room ${roomId}`);
      
      // Create meeting if it doesn't exist
      if (!meetings.has(roomId)) {
        meetings.set(roomId, new Map());
        console.log(`🏠 Created new meeting room: ${roomId}`);
      }
      
      const meeting = meetings.get(roomId);
      
      // Remove any existing entry for this socket to prevent duplicates
      for (const [participantId, participant] of meeting.entries()) {
        if (participant.socket === socket.id) {
          console.log(`🔄 Removing old entry for socket ${socket.id} (was ${participantId})`);
          meeting.delete(participantId);
          break;
        }
      }
      
      // Get list of existing participants before adding new one
      const existingParticipants = Array.from(meeting.entries());
      
      // Add the new participant
      meeting.set(userId, {
        socket: socket.id,
        userName,
        joinTime: Date.now()
      });
      
      // Join the socket room
      socket.join(roomId);
      console.log(`✅ Socket ${socket.id} joined room ${roomId} as ${userId} (${userName})`);
      
      // Store room info in socket for cleanup
      socket.currentRoom = roomId;
      socket.currentUserId = userId;
      
      // Notify existing participants about the new user
      if (existingParticipants.length > 0) {
        console.log(`📢 Notifying ${existingParticipants.length} existing participants about ${userName}`);
        socket.to(roomId).emit('user-joined', userId, userName);
      }
      
      // Send existing participants to the new user
      existingParticipants.forEach(([participantId, participant]) => {
        if (participantId !== userId) {
          console.log(`📤 Sending existing participant ${participant.userName} (${participantId}) to new user ${userName}`);
          socket.emit('user-joined', participantId, participant.userName);
        }
      });
      
      console.log(`📊 Room ${roomId} now has ${meeting.size} participants`);
    });

    // Handle WebRTC signaling
    socket.on('offer', ({ to, offer }) => {
      console.log(`📤 Forwarding offer from ${socket.id} to ${to}`);
      const targetSocket = io.sockets.sockets.get(to);
      if (targetSocket) {
        targetSocket.emit('offer', { from: socket.id, offer });
      } else {
        console.warn(`⚠️ Target socket ${to} not found for offer`);
      }
    });
    
    socket.on('answer', ({ to, answer }) => {
      console.log(`📤 Forwarding answer from ${socket.id} to ${to}`);
      const targetSocket = io.sockets.sockets.get(to);
      if (targetSocket) {
        targetSocket.emit('answer', { from: socket.id, answer });
      } else {
        console.warn(`⚠️ Target socket ${to} not found for answer`);
      }
    });
    
    socket.on('ice-candidate', ({ to, candidate }) => {
      console.log(`📤 Forwarding ICE candidate from ${socket.id} to ${to}`);
      const targetSocket = io.sockets.sockets.get(to);
      if (targetSocket) {
        targetSocket.emit('ice-candidate', { from: socket.id, candidate });
      } else {
        console.warn(`⚠️ Target socket ${to} not found for ICE candidate`);
      }
    });

    // Handle meeting control events
    socket.on('toggle-mute', (userId, state) => {
      // Find the room this socket is in
      const roomId = findRoomForSocket(socket.id);
      if (roomId) {
        socket.to(roomId).emit('toggle-mute', userId, state);
      }
    });
    
    socket.on('toggle-video', (userId, state) => {
      const roomId = findRoomForSocket(socket.id);
      if (roomId) {
        socket.to(roomId).emit('toggle-video', userId, state);
      }
    });
    
    socket.on('toggle-screen-share', (userId, state) => {
      const roomId = findRoomForSocket(socket.id);
      if (roomId) {
        socket.to(roomId).emit('toggle-screen-share', userId, state);
      }
    });
    
    socket.on('owner-toggle-mute', (userId, state) => {
      const roomId = findRoomForSocket(socket.id);
      if (roomId) {
        io.to(roomId).emit('owner-toggle-mute', userId, state);
      }
    });
    
    socket.on('owner-toggle-video', (userId, state) => {
      const roomId = findRoomForSocket(socket.id);
      if (roomId) {
        io.to(roomId).emit('owner-toggle-video', userId, state);
      }
    });
    
    socket.on('send-message', (message) => {
      const roomId = message.meetingId;
      if (message.isPrivate && message.to) {
        // Send private message only to the recipient
        const recipientSocketId = findSocketId(message.to);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('chat-message', message);
          // Also send back to sender for confirmation
          socket.emit('chat-message', message);
        }
      } else {
        // Broadcast message to EVERYONE in the room (including sender)
        io.to(roomId).emit('chat-message', message);
      }
    });
    
    socket.on('request-reconnect', (data) => {
      if (data.to && data.from) {
        io.to(findSocketId(data.to)).emit('request-reconnect', {
          from: data.from,
          to: data.to
        });
      }
    });

    // Handle disconnection - improved cleanup
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      if (socket.currentRoom && socket.currentUserId) {
        const roomId = socket.currentRoom;
        const userId = socket.currentUserId;
        
        if (meetings.has(roomId)) {
          const meeting = meetings.get(roomId);
          const participant = meeting.get(userId);
          
          if (participant && participant.socket === socket.id) {
            console.log(`Removing ${participant.userName} from room ${roomId}`);
            meeting.delete(userId);
            
            // Notify others that user has left
            socket.to(roomId).emit('user-left', userId);
            
            // Clean up empty meetings
            if (meeting.size === 0) {
              meetings.delete(roomId);
              console.log(`Meeting ${roomId} ended (no participants left)`);
            } else {
              console.log(`Room ${roomId} now has ${meeting.size} participants`);
            }
          }
        }
      }
    });

    // Handle manual leave
    socket.on('leave-room', (roomId) => {
      if (socket.currentRoom && socket.currentUserId) {
        const userId = socket.currentUserId;
        if (meetings.has(roomId)) {
          const meeting = meetings.get(roomId);
          const participant = meeting.get(userId);
          
          if (participant && participant.socket === socket.id) {
            meeting.delete(userId);
            socket.to(roomId).emit('user-left', userId);
            socket.leave(roomId);
            
            // Clear socket room info
            socket.currentRoom = null;
            socket.currentUserId = null;
            
            console.log(`User ${userId} manually left room ${roomId}`);
          }
        }
      }
    });
  });

  // Helper functions
  function findSocketId(userId) {
    for (const [roomId, meeting] of meetings.entries()) {
      const participant = meeting.get(userId);
      if (participant) {
        return participant.socket;
      }
    }
    return null;
  }
  
  function findUserId(socketId) {
    for (const [roomId, meeting] of meetings.entries()) {
      for (const [userId, participant] of meeting.entries()) {
        if (participant.socket === socketId) {
          return userId;
        }
      }
    }
    return null;
  }
  
  function findRoomForSocket(socketId) {
    for (const [roomId, meeting] of meetings.entries()) {
      for (const [userId, participant] of meeting.entries()) {
        if (participant.socket === socketId) {
          return roomId;
        }
      }
    }
    return null;
  }
};

module.exports = { initializeSocket };