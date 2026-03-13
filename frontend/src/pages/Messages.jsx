import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import { connectSocket, disconnectSocket } from '../utils/socket';

export default function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  const [selectedUser, setSelectedUser] = useState(null);

  // Connect to socket when component mounts
  useEffect(() => {
    if (user) {
      connectSocket(user._id);
    }

    return () => {
      if (user) {
        disconnectSocket(user._id);
      }
    };
  }, [user]);

  // If navigated from AgentDashboard with an initial user, pre-select that conversation
  useEffect(() => {
    const initialUser = location.state?.initialUser;
    if (initialUser) {
      setSelectedUser(initialUser);
    }
  }, [location.state]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Chat List Sidebar */}
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col">
        <ChatList
          selectedUser={selectedUser}
          onSelectUser={setSelectedUser}
          currentUser={user}
          initialUser={location.state?.initialUser}
        />
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col hidden md:flex">
        <ChatWindow
          selectedUser={selectedUser}
          currentUser={user}
          initialPickup={location.state?.pickup}
          initialPickupId={location.state?.pickupId}
        />
      </div>

      {/* Mobile view - show only one at a time */}
      <div className="md:hidden flex-1 flex flex-col md:hidden">
        {selectedUser ? (
          <div className="w-full h-full flex flex-col">
            {/* Back button for mobile */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <button
                onClick={() => setSelectedUser(null)}
                className="text-green-600 font-semibold hover:text-green-700 transition-colors"
              >
                ← Back to conversations
              </button>
            </div>
            <ChatWindow
              selectedUser={selectedUser}
              currentUser={user}
              initialPickup={location.state?.pickup}
              initialPickupId={location.state?.pickupId}
            />
          </div>
        ) : (
          <ChatList
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
            currentUser={user}
            initialUser={location.state?.initialUser}
          />
        )}
      </div>
    </div>
  );
}
