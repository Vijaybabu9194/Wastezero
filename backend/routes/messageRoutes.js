const express = require('express');
const {
  sendMessage,
  getConversation,
  getConversations,
  getUnreadCount,
  markMessageAsRead,
  deleteMessage,
  searchMessages,
  getPickupMessages
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Middleware to protect all message routes
router.use(protect);

// Send a message
router.post('/send', sendMessage);

// Get conversation between two users
router.get('/conversation/:userId', getConversation);

// Get messages for a specific pickup (contextual chat)
router.get('/pickup/:pickupId', getPickupMessages);

// Get all conversations for current user
router.get('/conversations', getConversations);

// Get unread message count
router.get('/unread-count', getUnreadCount);

// Mark message as read
router.put('/:messageId/read', markMessageAsRead);

// Delete a message
router.delete('/:messageId', deleteMessage);

// Search messages
router.get('/search/:query', searchMessages);

module.exports = router;
