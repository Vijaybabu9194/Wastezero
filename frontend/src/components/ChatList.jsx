import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader, MessageCircle } from 'lucide-react';
import { messageApi } from '../utils/api';
import { onUserStatusChanged, removeStatusListener, onReceiveMessage, removeMessageListener } from '../utils/socket';

export default function ChatList({ selectedUser, onSelectUser, currentUser, initialUser }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const hasAutoSelectedUnread = useRef(false);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await messageApi.getConversations();
        const convs = response.data.conversations || [];
        setConversations(convs);

        // Auto-select first unread when user opens Messages from chat notification (skip if came with specific user e.g. AgentDashboard)
        if (!hasAutoSelectedUnread.current && convs.length > 0 && !selectedUser && !initialUser) {
          const firstUnread = convs.find((c) => c.unreadCount > 0);
          if (firstUnread?.userDetails) {
            hasAutoSelectedUnread.current = true;
            onSelectUser(firstUnread.userDetails);
          }
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Refresh conversations every 10 seconds
    const interval = setInterval(fetchConversations, 10000);

    return () => clearInterval(interval);
  }, []);

  // Refresh sidebar in real time when a message arrives
  useEffect(() => {
    const refresh = () => {
      // avoid showing loader spinner on every incoming message
      messageApi.getConversations()
        .then((response) => setConversations(response.data.conversations || []))
        .catch(() => {});
    };

    onReceiveMessage(refresh);
    return () => {
      removeMessageListener();
    };
  }, []);

  // Listen for user status changes
  useEffect(() => {
    onUserStatusChanged((data) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        if (data.status === 'online') {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    });

    return () => {
      removeStatusListener();
    };
  }, []);

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv) =>
    conv.userDetails.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Messages</h1>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="animate-spin text-green-600" size={32} />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
            <MessageCircle size={48} className="mb-2 opacity-50" />
            <p className="text-center">
              {conversations.length === 0
                ? 'No conversations yet'
                : 'No matching conversations'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => {
              const isSelected = selectedUser?._id === conversation._id;
              const isOnline = onlineUsers.has(conversation._id);

              return (
                <div
                  key={conversation._id}
                  onClick={() => onSelectUser(conversation.userDetails)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                    isSelected ? 'bg-green-50 border-l-4 border-green-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {conversation.userDetails.name}
                        </h3>
                        {isOnline && (
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        {conversation.userDetails.role}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>

                    <div className="ml-2 flex flex-col items-end">
                      <p className="text-xs text-gray-400">
                        {new Date(conversation.lastMessageTime).toLocaleDateString(
                          [],
                          {
                            hour: 'numeric',
                            minute: '2-digit',
                            month: 'short',
                            day: 'numeric'
                          }
                        )}
                      </p>

                      {conversation.unreadCount > 0 && (
                        <div className="mt-1 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 bg-gray-50 text-xs text-gray-500">
        <p>Logged in as: {currentUser?.name}</p>
      </div>
    </div>
  );
}
