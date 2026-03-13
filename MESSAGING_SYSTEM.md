# Real-Time Messaging System - WasteZero

## Overview
A WhatsApp-like real-time messaging system that enables seamless communication between users, volunteers, and agents handling waste pickups.

## Features

### Core Features
✅ **Real-time Messaging** - Instant message delivery using WebSockets (Socket.io)
✅ **Message History** - Persistent storage of all conversations
✅ **Typing Indicators** - See when someone is typing
✅ **Message Status** - Read/unread status with delivery confirmation
✅ **Online Status** - Know when users are online/offline
✅ **Conversation List** - View all conversations in one place (like WhatsApp)
✅ **Search Messages** - Find messages by keyword
✅ **Delete Messages** - Users can delete their own messages
✅ **Responsive Design** - Works on desktop and mobile

### Special Features for Pickups
- Volunteers/Agents can message users about their scheduled pickups
- Users can communicate with agents handling their pickups

## Architecture

### Backend Components

#### 1. **Message Model** (`backend/models/Message.js`)
```javascript
{
  sender: ObjectId (ref: User),
  receiver: ObjectId (ref: User),
  content: String,
  isRead: Boolean,
  readAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **Message Controller** (`backend/controllers/messageController.js`)
Core functions:
- `sendMessage()` - Send a new message
- `getConversation()` - Get message history between two users
- `getConversations()` - Get all conversations for a user
- `getUnreadCount()` - Get count of unread messages
- `markMessageAsRead()` - Mark message as read
- `deleteMessage()` - Delete a message
- `searchMessages()` - Search messages by content

#### 3. **Message Routes** (`backend/routes/messageRoutes.js`)
All routes are protected (require authentication):
- `POST /api/messages/send` - Send message
- `GET /api/messages/conversation/:userId` - Get conversation
- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/unread-count` - Get unread count
- `PUT /api/messages/:messageId/read` - Mark as read
- `DELETE /api/messages/:messageId` - Delete message
- `GET /api/messages/search/:query` - Search messages

#### 4. **WebSocket Events** (Socket.io)
**Client → Server:**
- `user-online` - User comes online
- `send-message` - Send message via socket
- `user-typing` - User is typing
- `user-stopped-typing` - User stopped typing
- `message-read` - Message was read
- `join-conversation` - Join a conversation room
- `leave-conversation` - Leave a conversation room
- `user-offline` - User goes offline

**Server → Client:**
- `receive-message` - New message received
- `message-read-notification` - Message was read notification
- `user-typing-indicator` - Typing indicator
- `user-status-changed` - User online/offline status
- `message-error` - Error occurred

### Frontend Components

#### 1. **Socket Configuration** (`frontend/src/utils/socket.js`)
Manages all WebSocket connections and emits:
- `connectSocket(userId)` - Connect to WebSocket
- `disconnectSocket(userId)` - Disconnect from WebSocket
- `sendMessageViaSocket()` - Send message via socket
- `startTyping()` - Send typing indicator
- `stopTyping()` - Stop typing indicator
- `markMessageAsRead()` - Mark message as read
- Event listeners for receiving messages, typing, etc.

#### 2. **Messages Page** (`frontend/src/pages/Messages.jsx`)
Main messaging interface that:
- Manages socket connection lifecycle
- Combines ChatList and ChatWindow
- Handles responsive layout (mobile friendly)

#### 3. **ChatList Component** (`frontend/src/components/ChatList.jsx`)
Left sidebar that displays:
- All conversations
- Last message preview
- Unread message count
- User online status
- Search functionality
- User avatar/profile

#### 4. **ChatWindow Component** (`frontend/src/components/ChatWindow.jsx`)
Right panel that shows:
- Full conversation history
- Real-time message updates
- Typing indicators
- Message timestamps
- Read/unread status (✓ / ✓✓)
- Delete message option
- Message input with emoji support

#### 5. **Navbar Updates** (`frontend/src/components/Navbar.jsx`)
- New Messages icon with unread badge
- Link to Messages page
- Unread message counter

#### 6. **API Integration** (`frontend/src/utils/api.js`)
Exported `messageApi` object with methods:
```javascript
messageApi.sendMessage(data)
messageApi.getConversation(userId, limit, skip)
messageApi.getConversations()
messageApi.getUnreadCount()
messageApi.markAsRead(messageId)
messageApi.deleteMessage(messageId)
messageApi.searchMessages(query)
```

## Setup Instructions

### Prerequisites
- Node.js 14+
- MongoDB
- npm or yarn

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install socket.io
   ```

2. **Update Server** (`backend/server.js`)
   - Already configured with Socket.io
   - Includes message routes
   - WebSocket event handlers enabled

3. **Start Backend**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```
   (socket.io-client already included in package.json)

2. **Verify Environment**
   - Ensure `VITE_API_URL` environment variable is set (or defaults to localhost:5001)

3. **Start Frontend**
   ```bash
   npm run dev
   ```

## Usage

### For Users
1. Click the Message icon 💬 in the navbar
2. Select a conversation or start a new one
3. Type your message and press Send
4. See real-time updates as messages arrive

### For Agents/Volunteers
1. When a pickup is scheduled, you can message the user who created it
2. User will receive the message in their Messages section
3. Communicate in real-time about pickup details

### Key Features in Use
- **Typing Indicator**: See `typing` status when someone is typing
- **Read Status**: ✓ for sent, ✓✓ for read (only your messages)
- **Online Status**: Green dot next to user name indicates online
- **Unread Badge**: Red badge on Message icon shows unread count
- **Search**: Use search bar to find conversations by user name
- **Delete**: Hover over your message to see delete button

## Technical Details

### Performance Optimizations
- Message pagination (limit: 50, skip for pagination)
- Indexed database queries on sender, receiver, createdAt
- Socket.io reconnection strategy
- Unread message count aggregation

### Security
- JWT authentication on all API endpoints
- Sender verification for delete operations
- User privacy: can only see messages they're involved in
- No broadcast of sensitive data

### Real-time Features
- Automatic reconnection on disconnect
- Typing indicators with 3-second timeout
- Auto-scroll to latest message
- Unread count updates
- Online/offline status tracking

## File Structure
```
backend/
├── models/Message.js
├── controllers/messageController.js
├── routes/messageRoutes.js
└── server.js (updated with socket handlers)

frontend/
├── pages/Messages.jsx
├── components/
│   ├── ChatWindow.jsx
│   ├── ChatList.jsx
│   └── Navbar.jsx (updated)
└── utils/
    ├── socket.js
    └── api.js (updated)
```

## API Response Examples

### Send Message
**Request:**
```json
{
  "receiverId": "user_id",
  "content": "Hello, when can you schedule the pickup?",
  "pickupId": "optional_pickup_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "_id": "msg_id",
    "sender": { "_id": "user_id", "name": "John" },
    "receiver": { "_id": "receiver_id", "name": "Agent" },
    "content": "Hello, when can you schedule the pickup?",
    "isRead": false,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get Conversations
**Response:**
```json
{
  "success": true,
  "conversations": [
    {
      "_id": "user_id",
      "lastMessage": "See you tomorrow!",
      "lastMessageTime": "2024-01-15T10:30:00Z",
      "unreadCount": 2,
      "userDetails": {
        "_id": "user_id",
        "name": "John Doe",
        "role": "agent"
      }
    }
  ]
}
```

## Troubleshooting

### Socket Connection Issues
1. Check if server is running on correct port
2. Verify CORS settings allow frontend URL
3. Check browser console for connection errors
4. Ensure token is valid and stored in localStorage

### Messages Not Appearing
1. Verify both users have active socket connections
2. Check API request in Network tab
3. Ensure database is connected
4. Check message route is protected properly

### Typing Indicators Not Working
1. Ensure Socket.io is connected
2. Check that user is typing in correct chat
3. Verify typing timeout (3 seconds)

## Future Enhancements
- [ ] Message reactions/emoji responses
- [ ] Image/file sharing
- [ ] Message forwarding
- [ ] Group conversations
- [ ] Message backup/archive
- [ ] Read receipts timing details
- [ ] Last seen timestamp
- [ ] Message calls integration
- [ ] Message encryption
- [ ] Auto-translate messages

## Support
For issues or questions about the messaging system, refer to the WebSocket error logs in the browser console and server logs.
