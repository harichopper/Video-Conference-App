// Create a global connection manager for cross-browser communication
class CrossBrowserManager {
  constructor() {
    this.sockets = new Map();
    this.rooms = new Map();
    this.setupBroadcastChannel();
  }

  setupBroadcastChannel() {
    // Use BroadcastChannel for same-origin cross-tab communication
    this.channel = new BroadcastChannel('video-conference');
    this.channel.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  addSocket(socket) {
    this.sockets.set(socket.id, socket);
    console.log(`Added socket ${socket.id} to global manager`);
  }

  removeSocket(socketId) {
    this.sockets.delete(socketId);
    console.log(`Removed socket ${socketId} from global manager`);
  }

  // Helper function to serialize WebRTC objects for cross-browser communication
  serializeForBroadcast(message) {
    const serialized = { ...message };
    
    // Serialize RTCSessionDescription objects
    if (serialized.offer && typeof serialized.offer === 'object') {
      serialized.offer = {
        type: serialized.offer.type,
        sdp: serialized.offer.sdp
      };
    }
    
    if (serialized.answer && typeof serialized.answer === 'object') {
      serialized.answer = {
        type: serialized.answer.type,
        sdp: serialized.answer.sdp
      };
    }
    
    // Serialize RTCIceCandidate objects
    if (serialized.candidate && typeof serialized.candidate === 'object') {
      serialized.candidate = {
        candidate: serialized.candidate.candidate,
        sdpMid: serialized.candidate.sdpMid,
        sdpMLineIndex: serialized.candidate.sdpMLineIndex,
        usernameFragment: serialized.candidate.usernameFragment
      };
    }
    
    return serialized;
  }

  broadcast(message, excludeSocketId = null) {
    console.log(`Broadcasting message: ${message.type} from ${excludeSocketId}`, message);
    
    // Broadcast to local sockets (same tab)
    this.sockets.forEach((socket, id) => {
      if (id !== excludeSocketId) {
        console.log(`Sending to local socket ${id}`);
        socket.receiveMessage(message);
      }
    });

    // Serialize the message for cross-browser communication
    const serializedMessage = this.serializeForBroadcast({
      ...message,
      excludeSocketId
    });

    // Broadcast to other browser tabs/windows
    try {
      this.channel.postMessage(serializedMessage);
      console.log(`Broadcasted to other tabs:`, serializedMessage);
    } catch (error) {
      console.error('Error broadcasting message:', error);
    }
  }

  handleMessage(data) {
    const { excludeSocketId, ...message } = data;
    console.log(`Received cross-tab message: ${message.type} excluding ${excludeSocketId}`, message);
    
    // Forward to local sockets (excluding the original sender)
    this.sockets.forEach((socket, id) => {
      if (id !== excludeSocketId) {
        console.log(`Forwarding to local socket ${id}`);
        socket.receiveMessage(message);
      }
    });
  }

  joinRoom(roomId, userId, userName, socketId) {
    console.log(`🏠 Socket ${socketId} (${userName}) joining room ${roomId} with userId: ${userId}`);
    
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Map());
      console.log(`📋 Created new room: ${roomId}`);
    }
    
    const room = this.rooms.get(roomId);
    
    // Remove any existing entry for this socketId first
    for (const [existingUserId, participant] of room.entries()) {
      if (participant.socketId === socketId) {
        console.log(`🔄 Removing old entry for socket ${socketId}`);
        room.delete(existingUserId);
        break;
      }
    }
    
    // Store existing participants before adding the new one
    const existingParticipants = Array.from(room.entries());
    
    // Add the new participant using socketId as the key
    room.set(socketId, { userName, socketId, joinTime: Date.now() });
    
    console.log(`📊 Room ${roomId} now has ${room.size} participants:`, Array.from(room.entries()).map(([id, p]) => `${id}(${p.userName})`));
    
    // Notify ALL existing participants about the new user (cross-tab broadcast)
    if (existingParticipants.length > 0) {
      console.log(`📢 Broadcasting new user ${socketId}(${userName}) to ${existingParticipants.length} existing participants`);
      this.broadcast({
        type: 'user-joined',
        roomId,
        userId: socketId,
        userName
      }, socketId);
    }

    // Send existing participants to the new user (direct message)
    const socket = this.sockets.get(socketId);
    if (socket && existingParticipants.length > 0) {
      console.log(`📨 Sending ${existingParticipants.length} existing participants to new user ${socketId}(${userName})`);
      existingParticipants.forEach(([participantId, participant]) => {
        console.log(`📤 Sending existing participant ${participantId}(${participant.userName}) to new user ${socketId}(${userName})`);
        socket.receiveMessage({
          type: 'user-joined',
          roomId,
          userId: participantId,
          userName: participant.userName
        });
      });
    }
  }

  leaveRoom(roomId, userId, socketId) {
    if (this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId);
      room.delete(socketId); // Use socketId as key
      
      this.broadcast({
        type: 'user-left',
        roomId,
        userId: socketId // Send socketId as userId
      }, socketId);
      
      console.log(`User ${socketId} left room ${roomId}`);
      
      // If the room is empty, remove it
      if (room.size === 0) {
        this.rooms.delete(roomId);
        console.log(`Room ${roomId} is empty and has been removed`);
      } else {
        console.log(`Room ${roomId} still has ${room.size} participants`);
      }
    }
  }
}

// Global manager instance
const globalManager = new CrossBrowserManager();

export default class MockSocket {
  constructor() {
    this.id = Math.random().toString(36).substr(2, 9);
    this.eventListeners = new Map();
    this.currentRoomId = null;
    this.currentUserId = null;
    this.currentUserName = null;
    
    console.log(`Created MockSocket with ID: ${this.id}`);
    
    // Register with global manager
    globalManager.addSocket(this);
    
    setTimeout(() => {
      this.emit('connect');
    }, 0);
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      if (callback) {
        const listeners = this.eventListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      } else {
        this.eventListeners.delete(event);
      }
    }
  }

  removeAllListeners(event) {
    if (event) {
      this.eventListeners.delete(event);
    } else {
      this.eventListeners.clear();
    }
  }

  emit(event, ...args) {
    // Handle local events first
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => callback(...args));
    }
    
    // Handle specific events that need cross-browser communication
    if (event === 'join-room') {
      const [roomId, socketId, userName] = args;
      this.currentRoomId = roomId;
      this.currentUserId = socketId; // Use the passed socketId
      this.currentUserName = userName;
      
      console.log(`🔗 Socket ${this.id} joining room ${roomId} as user ${socketId} (${userName})`);
      globalManager.joinRoom(roomId, socketId, userName, this.id);
    }
    
    else if (event === 'offer') {
      const { to, offer } = args[0];
      console.log(`📤 Socket ${this.id} sending offer to ${to}`);
      globalManager.broadcast({
        type: 'offer',
        from: this.id,
        to,
        offer
      }, this.id);
    }
    
    else if (event === 'answer') {
      const { to, answer } = args[0];
      console.log(`📤 Socket ${this.id} sending answer to ${to}`);
      globalManager.broadcast({
        type: 'answer',
        from: this.id,
        to,
        answer
      }, this.id);
    }
    
    else if (event === 'ice-candidate') {
      const { to, candidate } = args[0];
      console.log(`🧊 Socket ${this.id} sending ICE candidate to ${to}`);
      globalManager.broadcast({
        type: 'ice-candidate',
        from: this.id,
        to,
        candidate
      }, this.id);
    }
    
    else if (event === 'send-message') {
      const message = args[0];
      console.log(`📤 Broadcasting message from ${this.id}:`, message);
      globalManager.broadcast({
        type: 'chat-message',
        message
      }, this.id);
    }
    
    else if (event === 'owner-toggle-mute' || event === 'owner-toggle-video') {
      const [userId, state] = args;
      console.log(`📤 Owner control: ${event} for ${userId} = ${state}`);
      globalManager.broadcast({
        type: event,
        userId,
        state
      }, this.id);
    }
  }

  // Receive messages from other browser instances
  receiveMessage(message) {
    const { type, ...data } = message;
    console.log(`📨 Socket ${this.id} received message: ${type}`, data);
    
    if (type === 'user-joined') {
      // Filter by socket ID to prevent self-join
      if (data.userId === this.id) {
        console.log(`🚫 Ignoring self-join message for ${data.userId} (my socket ID: ${this.id})`);
        return;
      }
      
      console.log(`👤 User ${data.userId} (${data.userName}) joined the room`);
      this.eventListeners.get('user-joined')?.forEach(callback => 
        callback(data.userId, data.userName)
      );
    }
    
    else if (type === 'user-left') {
      console.log(`👋 User ${data.userId} left the room`);
      this.eventListeners.get('user-left')?.forEach(callback => 
        callback(data.userId)
      );
    }
    
    else if (type === 'offer') {
      if (data.to === this.id) {
        console.log(`📥 Socket ${this.id} processing offer from ${data.from} to ${data.to}`);
        this.eventListeners.get('offer')?.forEach(callback => 
          callback({ from: data.from, offer: data.offer })
        );
      }
    }
    
    else if (type === 'answer') {
      if (data.to === this.id) {
        console.log(`📥 Socket ${this.id} processing answer from ${data.from} to ${data.to}`);
        this.eventListeners.get('answer')?.forEach(callback => 
          callback({ from: data.from, answer: data.answer })
        );
      }
    }
    
    else if (type === 'ice-candidate') {
      if (data.to === this.id) {
        console.log(`🧊📥 Socket ${this.id} processing ICE candidate from ${data.from} to ${data.to}`);
        this.eventListeners.get('ice-candidate')?.forEach(callback => 
          callback({ from: data.from, candidate: data.candidate })
        );
      }
    }
    
    else if (type === 'chat-message') {
      console.log(`📨 Received chat message:`, data.message);
      this.eventListeners.get('chat-message')?.forEach(callback => 
        callback(data.message)
      );
    }
    
    else if (type === 'owner-toggle-mute' || type === 'owner-toggle-video') {
      console.log(`📨 Received owner control: ${type} for ${data.userId} = ${data.state}`);
      this.eventListeners.get(type)?.forEach(callback => 
        callback(data.userId, data.state)
      );
    }
  }

  disconnect() {
    console.log(`MockSocket ${this.id} disconnect called`);
    
    if (this.currentRoomId && this.currentUserId) {
      globalManager.leaveRoom(this.currentRoomId, this.currentUserId, this.id);
    }
    
    globalManager.removeSocket(this.id);
    this.emit('disconnect');
    this.eventListeners.clear();
  }
}