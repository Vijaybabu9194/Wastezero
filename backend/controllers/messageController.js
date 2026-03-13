const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const Pickup = require('../models/Pickup');
const Agent = require('../models/Agent');

// @desc    Send a message (generic or pickup-contextual)
// @route   POST /api/messages/send
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId: rawReceiverId, recipientId, content, pickupId } = req.body;
    const senderUserId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Support both receiverId (existing chat) and recipientId (PickupChat)
    let targetId = rawReceiverId || recipientId;
    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: 'Receiver/recipient is required'
      });
    }

    // Resolve receiver user: targetId may be a User _id or an Agent _id
    let receiverUser = await User.findById(targetId).select('_id role');
    if (!receiverUser) {
      const agent = await Agent.findById(targetId).populate('userId');
      if (!agent || !agent.userId) {
        return res.status(404).json({
          success: false,
          message: 'Receiver not found'
        });
      }
      receiverUser = await User.findById(agent.userId).select('_id role');
    }
    const receiverUserId = receiverUser._id.toString();
    const senderRole = req.user.role;
    const receiverRole = receiverUser.role;

    // Three-role communication rules: User ↔ NGO (NGO initiates); NGO ↔ Volunteer; no User–Volunteer
    if (senderRole === 'user' && receiverRole === 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Users cannot message volunteers directly. All coordination goes through the NGO.'
      });
    }
    if (senderRole === 'agent' && receiverRole !== 'ngo') {
      return res.status(403).json({
        success: false,
        message: 'Volunteers can only communicate with the NGO.'
      });
    }
    if (senderRole === 'user' && receiverRole === 'ngo') {
      const ngoStartedConversation = await Message.exists({
        sender: receiverUserId,
        receiver: senderUserId
      });
      if (!ngoStartedConversation) {
        return res.status(403).json({
          success: false,
          message: 'You can only reply to messages from the NGO. The NGO must message you first.'
        });
      }
    }

    // If pickupId is provided, enforce contextual chat rules
    if (pickupId) {
      const pickup = await Pickup.findById(pickupId)
        .populate('userId', '_id')
        .populate('agentId', 'userId');

      if (!pickup) {
        return res.status(404).json({
          success: false,
          message: 'Pickup not found'
        });
      }

      // Determine the agent's underlying user id (if assigned)
      let pickupAgentUserId = null;
      if (pickup.agentId && pickup.agentId.userId) {
        pickupAgentUserId = pickup.agentId.userId.toString();
      }

      const isSenderPickupUser = pickup.userId._id.toString() === senderUserId;
      const isSenderPickupAgent = pickupAgentUserId === senderUserId;

      if (!isSenderPickupUser && !isSenderPickupAgent) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to message about this pickup'
        });
      }

      // Chat is only allowed while pickup is pending/scheduled
      if (pickup.status !== 'scheduled') {
        return res.status(403).json({
          success: false,
          message: 'Chat is locked for this pickup'
        });
      }
    }

    const message = await Message.create({
      sender: senderUserId,
      receiver: receiverUserId,
      pickupId: pickupId || null,
      content: content.trim()
    });

    // Emit via Socket.io so receiver gets real-time message (same event as socket send-message path)
    const io = req.app.get('io');
    if (io) {
      io.to(String(receiverUserId)).emit('receive-message', {
        _id: message._id,
        senderId: senderUserId,
        receiverId: receiverUserId,
        content: message.content,
        pickupId: message.pickupId,
        isRead: message.isRead,
        timestamp: message.createdAt,
        createdAt: message.createdAt
      });
    }

    // For API callers (including PickupChat), return a flat message shape
    res.status(201).json({
      _id: message._id,
      senderId: senderUserId,
      receiverId: receiverUserId,
      content: message.content,
      pickupId: message.pickupId,
      isRead: message.isRead,
      createdAt: message.createdAt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get messages between two users (conversation)
// @route   GET /api/messages/conversation/:userId
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const limit = req.query.limit || 50;
    const skip = req.query.skip || 0;

    // Get messages between current user and specified user (all, regardless of pickup)
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
      .populate('sender', 'name email profileImage role')
      .populate('receiver', 'name email profileImage role')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip, 10))
      .limit(parseInt(limit, 10));

    // Mark messages as read
    await Message.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      messages: messages.reverse()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all conversations for current user (chat list)
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);
    const role = req.user.role;
    const roleFilter = role === 'user' || role === 'agent'
      ? { 'userDetails.role': 'ngo' }
      : role === 'ngo'
        ? { 'userDetails.role': { $in: ['user', 'agent'] } }
        : {}; // admin sees all

    // Get all unique users the current user has conversations with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUserObjectId },
            { receiver: currentUserObjectId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', currentUserObjectId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$content' },
          lastMessageTime: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', currentUserObjectId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      { $match: roleFilter }
    ]);

    res.status(200).json({
      success: true,
      conversations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get messages for a specific pickup (contextual chat)
// @route   GET /api/messages/pickup/:pickupId
// @access  Private
exports.getPickupMessages = async (req, res) => {
  try {
    const { pickupId } = req.params;
    const currentUserId = req.user.id;

    const pickup = await Pickup.findById(pickupId)
      .populate('userId', '_id')
      .populate('agentId', 'userId');

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }

    let pickupAgentUserId = null;
    if (pickup.agentId && pickup.agentId.userId) {
      pickupAgentUserId = pickup.agentId.userId.toString();
    }

    const isPickupUser = pickup.userId._id.toString() === currentUserId;
    const isPickupAgent = pickupAgentUserId === currentUserId;

    if (!isPickupUser && !isPickupAgent) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view messages for this pickup'
      });
    }

    const messages = await Message.find({
      pickupId,
      $or: [{ sender: currentUserId }, { receiver: currentUserId }]
    })
      .sort({ createdAt: 1 });

    const mapped = messages.map((m) => ({
      _id: m._id,
      senderId: m.sender.toString(),
      receiverId: m.receiver.toString(),
      content: m.content,
      pickupId: m.pickupId,
      createdAt: m.createdAt,
      isRead: m.isRead
    }));

    res.status(200).json({
      success: true,
      messages: mapped
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const unreadCount = await Message.countDocuments({
      receiver: currentUserId,
      isRead: false
    });

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:messageId/read
// @access  Private
exports.markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id;

    const message = await Message.findByIdAndUpdate(
      messageId,
      {
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    ).populate('sender receiver', 'name email profileImage');

    res.status(200).json({
      success: true,
      message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:messageId
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id;

    const message = await Message.findById(messageId);

    // Only sender can delete their own message
    if (message.sender.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Search messages
// @route   GET /api/messages/search/:query
// @access  Private
exports.searchMessages = async (req, res) => {
  try {
    const { query } = req.params;
    const currentUserId = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId },
        { receiver: currentUserId }
      ],
      content: { $regex: query, $options: 'i' }
    })
      .populate('sender', 'name email profileImage')
      .populate('receiver', 'name email profileImage')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
