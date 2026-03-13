# Quick Start Guide - Real-Time Messaging

## 1. Backend Configuration

### Verify Dependencies
The backend already has `socket.io` in package.json. Ensure it's installed:
```bash
cd backend
npm install
```

### Check Server Configuration
The `server.js` has been updated with:
- Socket.io initialization
- WebSocket event handlers
- Message routes imported and configured
- Online user tracking

### Test Backend
```bash
npm run dev
# Should see: "Server running on port 5001"
```

---

## 2. Frontend Setup

### Verify Dependencies (Already Installed)
- `socket.io-client` ✅ in package.json
- Other dependencies ✅ all present

### Start Frontend
```bash
cd frontend
npm run dev
```

---

## 3. First Time Usage

### Step 1: Register/Login
1. Create two test accounts or use existing ones
2. One account for user (e.g., "John - user")
3. One account for volunteer/agent (e.g., "Mike - agent")

### Step 2: Open Messages
1. Click the **Messages** icon (💬) in the top navbar
2. You should see "No conversations yet" initially

### Step 3: Send First Message
1. You need to start a conversation from the Messages page
2. Current implementation allows messaging from:
   - Direct Messages page
   - Messages sent when handling a pickup

### Step 4: Test Features
- **Real-time**: Open Messages in two browsers (different users)
- **Typing**: Type in message box and see "typing..." on other user
- **Read Status**: Send message and watch for ✓ and ✓✓
- **Online Status**: You'll see green dot next to online users

---

## 4. Integration with Pickups

### How to Message About a Pickup
1. User schedules a pickup
2. Agent is assigned to that pickup
3. Agent can message the pickup user
4. User can message back in the Messages page

### Enable Messaging During Pickup Actions
Add message button in `PickupDetail.jsx`:
```jsx
<button onClick={() => navigate(`/messages?userId=${pickup.userId}`)}>
  Message User
</button>
```

---

## 5. Troubleshooting

### Socket Not Connecting
```
Check: 
- Backend running on port 5001
- CORS settings allow your frontend URL
- Browser console for errors
```

### Messages Not Sending
```
Check:
- User is authenticated (token in localStorage)
- Receiver ID is correct
- MongoDB is connected
- Check Network tab in DevTools
```

### Typing Indicator Not Showing
```
Check:
- Socket is connected (see in Network tab)
- User is typing in correct conversation
- Browser has no console errors
```

---

## 6. Key URLs and Routes

### Backend API
- **Base**: `http://localhost:5001/api`
- **WebSocket**: `http://localhost:5001`

### Frontend Routes
- **Messages Page**: `/messages`
- **Individual Chat**: `/messages?userId=<userId>` (when implemented)

---

## 7. Database Collections

The system creates/uses:
- `messages` - All messages (new collection)
- `users` - Existing user records

### Message Document Example
```javascript
{
  _id: ObjectId,
  sender: ObjectId, // User ID
  receiver: ObjectId, // User ID
  content: "Hello!",
  isRead: false,
  readAt: null,
  createdAt: 2024-01-15T10:30:00Z,
  updatedAt: 2024-01-15T10:30:00Z
}
```

---

## 8. Feature Checklist

- [ ] Both users can see each other in conversations list
- [ ] Messages send and appear in real-time
- [ ] Typing indicator shows on recipient
- [ ] Read status updates (✓ and ✓✓)
- [ ] Online status shows as green dot
- [ ] Can search conversations by user name
- [ ] Can delete own messages
- [ ] Unread badge appears on Messages icon
- [ ] Mobile responsive layout works
- [ ] Works on multiple concurrent connections

---

## 9. Testing Script

### Test Real-Time Messaging
```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend
cd frontend && npm run dev

# Terminal 3: Open browser, login as User 1, go to /messages
# Terminal 4: Open another browser, login as User 2, go to /messages

# In User 1 browser: Type message -> appears instantly in User 2
# In User 2 browser: See typing indicator -> see message appear
# Check read status updates
```

---

## 10. Next Steps

### Optional Enhancements
1. Add message button to Pickup Detail page
2. Add messaging notification system
3. Implement message reactions
4. Add file/image sharing
5. Auto-start conversation when viewing a user

### Integration Points
- Link from pickup detail to message agent
- Link from user profile to message user
- Quick message button in dashboard

---

## Important Notes

⚠️ **WebSocket Connection**: 
- Socket connects automatically when Messages page loads
- Disconnects when component unmounts
- Handles reconnection automatically

⚠️ **Message Persistence**:
- All messages saved to MongoDB
- Can fetch chat history anytime
- No message loss on disconnect

⚠️ **Authentication**:
- All API calls require valid JWT token
- Socket listens to user-online event
- Auto-logout on 401 response

---

For detailed information, see `MESSAGING_SYSTEM.md`
