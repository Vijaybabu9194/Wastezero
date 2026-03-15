require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

console.log("ENV VALUE:", process.env.MONGODB_URI);

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const pickupRoutes = require('./routes/pickupRoutes');
const agentRoutes = require('./routes/agentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const opportunityRoutes = require('./routes/opportunityRoutes');
const messageRoutes = require('./routes/messageRoutes');

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5000/api/opportunities/create',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store online users
const onlineUsers = new Map();

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // User joins their personal room (both events supported for compatibility)
  const joinUserRoom = (userId) => {
    if (userId) {
      socket.join(String(userId));
    }
  };
  socket.on('user-online', (userId) => {
    joinUserRoom(userId);
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} is online`);
    
    // Broadcast user online status
    io.emit('user-status-changed', {
      userId,
      status: 'online'
    });
  });

  // AuthContext uses 'join-room' - ensure user joins their room for receiving messages
  socket.on('join-room', (userId) => {
    joinUserRoom(userId);
  });

  // Handle sending message via socket
  socket.on('send-message', async (data) => {
    try {
      const { senderId, receiverId, content, timestamp } = data;
      console.log(`Message from ${senderId} to ${receiverId}: ${content}`);
      
      // Send message to receiver's room
      io.to(receiverId).emit('receive-message', {
        senderId,
        receiverId,
        content,
        timestamp,
        isRead: false
      });
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message-error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('user-typing', (data) => {
    const { senderId, receiverId } = data;
    io.to(receiverId).emit('user-typing-indicator', {
      userId: senderId,
      isTyping: true
    });
  });

  // Handle stopped typing
  socket.on('user-stopped-typing', (data) => {
    const { senderId, receiverId } = data;
    io.to(receiverId).emit('user-typing-indicator', {
      userId: senderId,
      isTyping: false
    });
  });

  // Handle message read notification
  socket.on('message-read', (data) => {
    const { senderId, receiverId, messageId } = data;
    io.to(senderId).emit('message-read-notification', {
      messageId,
      readBy: receiverId,
      readAt: new Date()
    });
  });

  // Join conversation room (for group-like features)
  socket.on('join-conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  // Leave conversation room
  socket.on('leave-conversation', (conversationId) => {
    socket.leave(conversationId);
    console.log(`Socket ${socket.id} left conversation ${conversationId}`);
  });

  // Pickup-specific events
  // Agent joins available pickups feed
  socket.on('agent-join-feed', (agentId) => {
    socket.join('available-pickups-feed');
    console.log(`Agent ${agentId} joined available pickups feed`);
  });

  // Agent leaves available pickups feed
  socket.on('agent-leave-feed', (agentId) => {
    socket.leave('available-pickups-feed');
    console.log(`Agent ${agentId} left available pickups feed`);
  });

  // Join pickup-specific discussion room
  socket.on('join-pickup-chat', (data) => {
    const pickupId = typeof data === 'string' ? data : data?.pickupId;
    if (!pickupId) return;
    socket.join(`pickup-${pickupId}`);
    console.log(`Socket ${socket.id} joined pickup ${pickupId} discussion`);
  });

  // Leave pickup-specific discussion room
  socket.on('leave-pickup-chat', (data) => {
    const pickupId = typeof data === 'string' ? data : data?.pickupId;
    if (!pickupId) return;
    socket.leave(`pickup-${pickupId}`);
    console.log(`Socket ${socket.id} left pickup ${pickupId} discussion`);
  });

  // Pickup contextual chat messages
  socket.on('send-pickup-message', (data) => {
    const { pickupId, message } = data || {};
    if (!pickupId || !message) return;

    // Broadcast to everyone else in this pickup room
    socket.to(`pickup-${pickupId}`).emit(`message-${pickupId}`, message);
  });

  // User goes offline
  socket.on('user-offline', (userId) => {
    onlineUsers.delete(userId);
    console.log(`User ${userId} is offline`);
    
    // Broadcast user offline status
    io.emit('user-status-changed', {
      userId,
      status: 'offline'
    });
  });
  
  socket.on('disconnect', () => {
    const userId = Array.from(onlineUsers.entries()).find(
      ([, socketId]) => socketId === socket.id
    )?.[0];
    
    if (userId) {
      onlineUsers.delete(userId);
      io.emit('user-status-changed', {
        userId,
        status: 'offline'
      });
    }
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'WasteZero API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Database connection
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI;

console.log("Mongo URI:", MONGODB_URI);


mongoose.connect(MONGODB_URI)

.then(() => {
    console.log('MongoDB connected successfully');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = { app, io };
