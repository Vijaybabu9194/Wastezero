# Messaging System - Integration Examples

## Frontend Usage Examples

### 1. Send a Message

```jsx
import { messageApi } from '../utils/api';

// Send a message to another user
const sendMessage = async () => {
  try {
    const response = await messageApi.sendMessage({
      receiverId: "agent_user_id",
      content: "Hello! Can you pick up the waste tomorrow?"
    });
    
    console.log('Message sent:', response.data.message);
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};
```

### 2. Message About a Specific Pickup

```jsx
// When an agent handles a pickup, they can message the user
const messageUserAboutPickup = async (pickupId, userId, message) => {
  try {
    const response = await messageApi.sendMessage({
      receiverId: userId,
      content: message,
      pickupId: pickupId // Optional: for context
    });
    
    return response.data.message;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 3. Get Conversation History

```jsx
import { messageApi } from '../utils/api';
import { useEffect, useState } from 'react';

function ConversationHistory({ userId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await messageApi.getConversation(userId, 50, 0);
        setMessages(response.data.messages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [userId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {messages.map(msg => (
        <div key={msg._id}>
          <strong>{msg.sender.name}:</strong> {msg.content}
          <small>{new Date(msg.createdAt).toLocaleTimeString()}</small>
        </div>
      ))}
    </div>
  );
}
```

### 4. Get All Conversations (Chat List)

```jsx
import { messageApi } from '../utils/api';
import { useEffect, useState } from 'react';

function ChatList() {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await messageApi.getConversations();
        
        // conversations structure:
        // {
        //   _id: userId,
        //   lastMessage: "...",
        //   lastMessageTime: Date,
        //   unreadCount: Number,
        //   userDetails: { _id, name, role, email, ... }
        // }
        
        setConversations(response.data.conversations);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchConversations();
  }, []);

  return (
    <div>
      {conversations.map(conv => (
        <div key={conv._id} className="conversation-item">
          <h4>{conv.userDetails.name}</h4>
          <p>{conv.lastMessage}</p>
          {conv.unreadCount > 0 && (
            <span className="badge">{conv.unreadCount} unread</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 5. Check Unread Messages

```jsx
import { messageApi } from '../utils/api';

const checkUnreadMessages = async () => {
  try {
    const response = await messageApi.getUnreadCount();
    console.log('Unread messages:', response.data.unreadCount);
    return response.data.unreadCount;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 6. Mark Message as Read

```jsx
const markAsRead = async (messageId) => {
  try {
    await messageApi.markAsRead(messageId);
    console.log('Message marked as read');
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 7. Delete a Message

```jsx
const deleteMessage = async (messageId) => {
  if (window.confirm('Delete this message?')) {
    try {
      await messageApi.deleteMessage(messageId);
      // Refresh conversation
      fetchConversation();
    } catch (error) {
      console.error('Error:', error);
    }
  }
};
```

### 8. Search Messages

```jsx
const searchMessages = async (query) => {
  try {
    const response = await messageApi.searchMessages(query);
    console.log('Search results:', response.data.messages);
    return response.data.messages;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## WebSocket Usage Examples

### 1. Initialize Socket Connection

```jsx
import { connectSocket, disconnectSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

function MyComponent() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Connect to socket when component loads
      connectSocket(user._id);

      return () => {
        // Disconnect when component unmounts
        disconnectSocket(user._id);
      };
    }
  }, [user]);

  return <div>Component</div>;
}
```

### 2. Send Message Via Socket (Real-time)

```jsx
import { sendMessageViaSocket } from '../utils/socket';

const handleSendMessage = (currentUserId, receiverId, content) => {
  // Send via Socket (instant real-time delivery)
  sendMessageViaSocket(currentUserId, receiverId, content);
  
  // Also save via REST API (persistent storage)
  messageApi.sendMessage({
    receiverId,
    content
  });
};
```

### 3. Listen for Incoming Messages

```jsx
import { onReceiveMessage, removeMessageListener } from '../utils/socket';
import { useEffect } from 'react';

function ChatWindow() {
  useEffect(() => {
    // Listen for new messages
    onReceiveMessage((data) => {
      console.log('New message received:', {
        from: data.senderId,
        content: data.content,
        timestamp: data.timestamp
      });
      
      // Update UI with new message
      setMessages(prev => [...prev, data]);
    });

    return () => {
      removeMessageListener(); // Cleanup
    };
  }, []);

  return <div>Chat window</div>;
}
```

### 4. Typing Indicators

```jsx
import { startTyping, stopTyping } from '../utils/socket';
import { useRef } from 'react';

function MessageInput({ currentUserId, receiverId }) {
  const typingTimeoutRef = useRef(null);

  const handleMessageChange = (e) => {
    const message = e.target.value;
    
    // Send typing indicator
    startTyping(currentUserId, receiverId);

    // Clear timeout and reset
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(currentUserId, receiverId);
    }, 3000); // Stop after 3 seconds of inactivity

    setMessage(message);
  };

  return (
    <input
      onChange={handleMessageChange}
      placeholder="Type a message..."
    />
  );
}
```

### 5. Listen for Typing Indicators

```jsx
import { onUserTypingIndicator, removeTypingListener } from '../utils/socket';
import { useEffect, useState } from 'react';

function ChatWindow({ selectedUserId }) {
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    onUserTypingIndicator((data) => {
      if (data.userId === selectedUserId) {
        setIsTyping(data.isTyping);
      }
    });

    return () => removeTypingListener();
  }, [selectedUserId]);

  return (
    <div>
      {isTyping && <div className="typing-indicator">User is typing...</div>}
    </div>
  );
}
```

### 6. User Status (Online/Offline)

```jsx
import { onUserStatusChanged, removeStatusListener } from '../utils/socket';
import { useState, useEffect } from 'react';

function UserList() {
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    onUserStatusChanged((data) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.status === 'online') {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    });

    return () => removeStatusListener();
  }, []);

  const isUserOnline = (userId) => onlineUsers.has(userId);

  return (
    <div>
      {users.map(user => (
        <div key={user._id}>
          <span className={isUserOnline(user._id) ? 'online' : 'offline'}>
            {user.name}
          </span>
        </div>
      ))}
    </div>
  );
}
```

## Integration with Pickup System

### Add Message Button to Pickup Detail

```jsx
// In PickupDetail.jsx
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

function PickupDetail() {
  const navigate = useNavigate();
  const { pickup } = usePickupData();

  const handleMessageUser = () => {
    // Navigate to messages and pass userId
    navigate(`/messages?userId=${pickup.userId}`);
  };

  const handleMessageAgent = () => {
    if (pickup.agentId) {
      navigate(`/messages?userId=${pickup.agentId}`);
    }
  };

  return (
    <div>
      <h1>{pickup.title}</h1>
      
      <button onClick={handleMessageUser} className="btn-primary">
        <MessageCircle size={20} />
        Message User
      </button>

      {pickup.agentId && (
        <button onClick={handleMessageAgent} className="btn-primary">
          <MessageCircle size={20} />
          Message Agent
        </button>
      )}
    </div>
  );
}
```

### Message from User Profile

```jsx
// In UserProfile.jsx
import { useNavigate } from 'react-router-dom';

function UserProfile({ userId }) {
  const navigate = useNavigate();

  const handleMessage = () => {
    navigate(`/messages?userId=${userId}`);
  };

  return (
    <button onClick={handleMessage} className="btn-primary">
      Send Message
    </button>
  );
}
```

## Error Handling

```jsx
import { messageApi } from '../utils/api';
import { useState } from 'react';

function MessageComponent() {
  const [error, setError] = useState(null);

  const sendMessageSafely = async (receiverId, content) => {
    try {
      setError(null);
      
      const response = await messageApi.sendMessage({
        receiverId,
        content
      });
      
      return response.data.message;
    } catch (err) {
      if (err.response?.status === 401) {
        setError('You need to be logged in');
      } else if (err.response?.status === 404) {
        setError('User not found');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to message this user');
      } else {
        setError('Failed to send message. Please try again.');
      }
      console.error('Messaging error:', err);
      return null;
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {/* Rest of component */}
    </div>
  );
}
```

## Pagination Example

```jsx
import { messageApi } from '../utils/api';
import { useState } from 'react';

function ConversationWithPagination({ userId }) {
  const [messages, setMessages] = useState([]);
  const [skip, setSkip] = useState(0);
  const limit = 50;

  const loadMoreMessages = async () => {
    try {
      const response = await messageApi.getConversation(
        userId,
        limit,
        skip
      );
      
      // Prepend older messages
      setMessages(prev => [...response.data.messages, ...prev]);
      setSkip(prev => prev + limit);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <button onClick={loadMoreMessages}>Load Older Messages</button>
      {messages.map(msg => (
        <div key={msg._id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

---

## Summary

The messaging system provides:
- ✅ REST APIs for persistent message storage
- ✅ WebSocket support for real-time delivery
- ✅ Easy-to-use helper functions
- ✅ Built-in error handling
- ✅ Typing indicators and status updates
- ✅ Full conversation history
- ✅ Search and filtering capabilities

Use these examples to integrate messaging throughout your WasteZero application!
