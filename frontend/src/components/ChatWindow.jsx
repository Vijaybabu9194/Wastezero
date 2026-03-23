import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, Trash2, Loader, MapPin, Package, Calendar } from 'lucide-react';
import api, { messageApi } from '../utils/api';
import {
  onReceiveMessage,
  startTyping,
  stopTyping,
  onUserTypingIndicator,
  removeMessageListener,
  removeTypingListener
} from '../utils/socket';

export default function ChatWindow({ selectedUser, currentUser, initialPickup, initialPickupId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [pickupContext, setPickupContext] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversation messages
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        setPickupContext(initialPickup || null);
        const response = await messageApi.getConversation(selectedUser._id);
        const msgs = response.data.messages || [];
        setMessages(msgs);

        // Fetch pickup context if not passed and any message is linked to a pickup
        if (!initialPickup) {
          const msgWithPickup = msgs.find((m) => m.pickupId);
          const pickupId = msgWithPickup?.pickupId?._id || msgWithPickup?.pickupId;
          if (pickupId) {
            try {
              const pickupRes = await api.get(`/pickups/${pickupId}`);
              setPickupContext(pickupRes.data.pickup);
            } catch {
              setPickupContext(null);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedUser, initialPickup]);

  // Socket listeners for real-time messages
  useEffect(() => {
    if (!selectedUser) return;

    // Listen for new messages
    onReceiveMessage((data) => {
      if (
        (data.senderId === selectedUser._id && data.receiverId === currentUser._id) ||
        (data.senderId === currentUser._id && data.receiverId === selectedUser._id)
      ) {
        setMessages((prev) => [
          ...prev,
          {
            _id: data._id || Date.now().toString(),
            sender: { _id: data.senderId },
            receiver: { _id: data.receiverId },
            content: data.content,
            isRead: data.isRead,
            createdAt: data.createdAt || data.timestamp
          }
        ]);
      }
    });

    // Listen for typing indicators
    onUserTypingIndicator((data) => {
      if (data.userId === selectedUser._id) {
        setOtherUserTyping(data.isTyping);
      }
    });

    return () => {
      removeMessageListener();
      removeTypingListener();
    };
  }, [selectedUser, currentUser]);

  // Handle typing
  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      startTyping(currentUser._id, selectedUser._id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(currentUser._id, selectedUser._id);
    }, 3000);
  };

  // User can only reply to NGO (NGO must have sent first message)
  const userCanReplyToNgo = () => {
    if (currentUser?.role !== 'user' || selectedUser?.role !== 'ngo') return true;
    return messages.some(m => (m.sender?._id || m.sender) === selectedUser._id);
  };
  const canSend = userCanReplyToNgo();

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;
    if (!canSend) return;

    try {
      setSending(true);

      const contextualPickupId =
        initialPickupId ||
        initialPickup?._id ||
        null;

      // Send via REST API (persists to DB and backend emits receive-message for real-time)
      await messageApi.sendMessage({
        receiverId: selectedUser._id,
        content: newMessage.trim(),
        ...(contextualPickupId ? { pickupId: contextualPickupId } : {})
      });

      // Add to local state
      setMessages((prev) => [
        ...prev,
        {
          _id: Date.now().toString(),
          sender: currentUser,
          receiver: selectedUser,
          content: newMessage.trim(),
          isRead: false,
          createdAt: new Date().toISOString()
        }
      ]);

      setNewMessage('');
      setIsTyping(false);
      stopTyping(currentUser._id, selectedUser._id);
    } catch (error) {
      console.error('Error sending message:', error);
      const msg = error.response?.data?.message || 'Failed to send message';
      if (typeof alert !== 'undefined') alert(msg);
      else if (window.toast) window.toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await messageApi.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-500 text-lg">Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {selectedUser.name}
            </h2>
            <p className="text-sm text-gray-500">{selectedUser.role}</p>
          </div>
          {otherUserTyping && (
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-500">typing</span>
              <div className="flex space-x-1">
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0s' }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pickup context banner */}
      {pickupContext && (
        <div className="border-b border-gray-200 bg-green-50 px-4 py-3">
          <p className="text-xs font-semibold text-green-800 mb-1">Conversation about pickup</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700">
            <span className="flex items-center gap-1">
              <Package size={14} />
              {pickupContext.wasteCategories?.map((w) => w.type).join(', ') || 'Waste'}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {pickupContext.pickupAddress?.street}, {pickupContext.pickupAddress?.city}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(pickupContext.scheduledDate).toLocaleDateString()} – {pickupContext.scheduledTimeSlot}
            </span>
          </div>
          <Link
            to={`/pickups/${pickupContext._id}`}
            className="inline-block mt-2 text-xs font-semibold text-green-600 hover:text-green-700"
          >
            View pickup details →
          </Link>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="animate-spin text-green-600" size={32} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isSentByCurrentUser = message.sender._id === currentUser._id;

              return (
                <div
                  key={message._id}
                  className={`flex ${isSentByCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg group relative ${
                      isSentByCurrentUser
                        ? 'bg-green-600 text-white rounded-br-none'
                        : 'bg-gray-300 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="break-words text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isSentByCurrentUser
                          ? 'text-green-100'
                          : 'text-gray-600'
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {isSentByCurrentUser && message.isRead && ' ✓✓'}
                      {isSentByCurrentUser && !message.isRead && ' ✓'}
                    </p>

                    {/* Delete button (only for sent messages) */}
                    {isSentByCurrentUser && (
                      <button
                        onClick={() => handleDeleteMessage(message._id)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete message"
                      >
                        <Trash2 size={14} className="text-red-200 hover:text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        {!canSend && currentUser?.role === 'user' && selectedUser?.role === 'ngo' && (
          <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg mb-2">
            You can only reply after the NGO messages you first.
          </p>
        )}
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleMessageChange}
            placeholder={canSend ? 'Type your message...' : 'Reply only (NGO must message first)'}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={sending || !canSend}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || !canSend}
            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            {sending ? (
              <Loader className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
