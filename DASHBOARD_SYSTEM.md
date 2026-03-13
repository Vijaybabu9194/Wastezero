# Role-Based Dashboards Implementation Guide

## Overview

This document outlines the complete implementation of the dual role-based dashboards system for WasteZero, featuring real-time pickup claiming, status management, and contextual messaging.

## System Architecture

### Technology Stack

**Backend:**
- Node.js/Express with MVC pattern
- MongoDB with Mongoose ODM
- Socket.io 4.6.0 for real-time WebSocket communication
- JWT authentication via middleware

**Frontend:**
- React 18 with Hooks
- Tailwind CSS for styling
- Socket.io-client for real-time updates
- Axios for HTTP requests
- React Router for navigation
- React Hot Toast for notifications

### Core Design Patterns

1. **Atomic Database Operations** - Prevents race conditions in concurrent pickup claiming
   ```javascript
   // Only succeeds if nobody else claimed it first
   findByIdAndUpdate(pickupId, {
     $set: { agentId: userId, status: 'assigned', claimedAt: Date.now() }
   }, { new: true })
   ```

2. **Socket.io Room-Based Broadcasting** - Efficient real-time synchronization
   - `available-pickups-feed` - For all connected agents viewing available pickups
   - `pickup-{pickupId}` - For contextual pickup chat
   - User-specific direct messaging via `io.to(userId)`

3. **Dual Data Fetching** - Socket.io + Polling fallback
   - Primary: Real-time Socket.io events for instant updates
   - Fallback: 5-second polling interval for reliability

## Backend Implementation

### 1. Database Model Updates

**File:** `backend/models/Pickup.js`

New fields added:
```javascript
interestedAgents: [mongoose.Schema.Types.ObjectId],  // Agents viewing/interested
claimedAt: Date,                                    // When agent claimed it
```

Index for efficient queries:
```javascript
schema.index({ status: 1, createdAt: -1 })  // For available pickups query
```

### 2. Agent Pickup Controller

**File:** `backend/controllers/agentPickupController.js`

Six main endpoints:

#### `getAvailablePickups()` - GET /api/pickups/agent/available
Returns unclaimed pickups (status='scheduled') with pagination and location filtering
- Query params: `page`, `limit`, `city`, `state`
- Response includes user info and full pickup details
- Index optimized for fast retrieval

#### `claimPickup()` - POST /api/pickups/:id/claim
**CRITICAL:** Uses atomic MongoDB update to prevent double-booking
```javascript
// Race-safe claiming
const claimed = await Pickup.findByIdAndUpdate(
  pickupId,
  { $set: { agentId: userId, status: 'assigned', claimedAt: new Date() } },
  { new: true }
)
if (!claimed.agentId.equals(userId)) {
  throw new Error('Pickup was claimed by another agent')
}
```
- Broadcasts `pickup-claimed` to all agents
- Removes claimed pickup from available feed
- Returns updated pickup

#### `releasePickup()` - POST /api/pickups/:id/release
Allows agent to unclaim a pickup (return to scheduled status)
- Validation: Only claimed agent can release
- Status: assigned/in-progress → scheduled
- Broadcasts `pickup-available` event

#### `getAgentPickups()` - GET /api/pickups/agent/my-pickups
Fetches all pickups claimed by current agent
- Includes status filtering
- Sorted by claimedAt timestamp
- Populated with user details

#### `updatePickupStatus()` - PUT /api/pickups/:id/status
Updates pickup status through workflow
- assigned → in-progress (start pickup)
- in-progress → completed (finish with actual weight)
- Broadcasts `pickup-status-updated` event
- Updates notification for user

#### `getPickupDetails()` - GET /api/pickups/details/:id
Returns detailed view of single pickup with all populated data
- Full user information
- Assigned agent details
- Message history (if implemented)

### 3. Socket.io Server Events

**File:** `backend/server.js`

#### Agent Feed Management
```javascript
socket.on('agent-join-feed', () => {
  socket.join('available-pickups-feed')
})

socket.on('agent-leave-feed', () => {
  socket.leave('available-pickups-feed')
})
```

#### Pickup Chat Rooms
```javascript
socket.on('join-pickup-chat', ({ pickupId, userId }) => {
  socket.join(`pickup-${pickupId}`)
  io.to(`pickup-${pickupId}`).emit('user-joined', { userId })
})

socket.on('leave-pickup-chat', ({ pickupId }) => {
  socket.leave(`pickup-${pickupId}`)
})
```

#### Real-Time Broadcast Events

| Event | Triggered By | Recipients | Data |
|-------|-------------|-----------|------|
| `pickup-claimed` | claimPickup() | All agents in feed, user | `{ pickupId, agentId, agentName }` |
| `pickup-available` | releasePickup() | All agents in feed | `{ pickupId, pickup }` |
| `pickup-released` | releasePickup() | User (notification) | `{ pickupId }` |
| `pickup-assigned` | claimPickup() | User (notification) | `{ pickupId, agentName, agentPhone }` |
| `pickup-status-updated` | updateStatus() | Both parties | `{ pickupId, status, agentId }` |

## Frontend Implementation

### 1. User Dashboard

**File:** `frontend/src/pages/UserDashboard.jsx`

#### State Management
```javascript
const [stats, setStats] = useState(...)           // API: /api/users/stats
const [myPickups, setMyPickups] = useState([])   // API: /api/pickups
const [conversations, setConversations] = useState([]) // messageApi
const [showScheduleForm, setShowScheduleForm] = useState(false)
const [expandedPickup, setExpandedPickup] = useState(null)
```

#### Features

**1. Statistics Cards** (Real-time)
- Total pickups scheduled
- Total weight collected
- Pending pickups (scheduled + assigned)
- Unread messages from agents

**2. Inline Schedule Pickup Form**
- Toggle show/hide button
- Date and time slot selection
- Full address fields (street, city, state, zip)
- Dynamic waste category management (add/remove)
- Notes textarea
- Real-time weight calculation

**3. My Pickups Section**
- Collapsible cards with status badges
  - Scheduled (blue)
  - Assigned (purple)
  - In-Progress (yellow)
  - Completed (green)
  - Cancelled (red)
- Assigned agent information card
  - Agent name and phone number
  - Only visible when agentId exists
- Message button links to `/messages` (only when assigned)
- Waste breakdown details in expanded view
- Location, time slot, and notes display

**4. Waste Breakdown Chart**
- 6 waste categories with icons
- Current weight per category
- Total weight collected

#### Data Fetching
```javascript
useEffect(() => {
  Promise.all([
    api.get('/users/stats'),
    api.get('/pickups?limit=100'),
    messageApi.getConversations()
  ]).then(([statsRes, pickupsRes, convRes]) => {
    // Update state
  })
}, [])
```

### 2. Agent Dashboard

**File:** `frontend/src/pages/AgentDashboard.jsx`

#### State Management
```javascript
const [activeTab, setActiveTab] = useState('available')  // 'available' or 'assigned'
const [availablePickups, setAvailablePickups] = useState([])
const [assignedPickups, setAssignedPickups] = useState([])
const [stats, setStats] = useState({
  available: 0,
  claimed: 0,
  completed: 0,
  pending: 0
})
const [claimingId, setClaimingId] = useState(null)  // Loading state
const [releasingId, setReleasingId] = useState(null)
```

#### Socket.io Integration
```javascript
useEffect(() => {
  connectSocket(user._id)
  const socket = getSocket()
  
  socket.emit('agent-join-feed')  // Join available pickups room
  
  // Listen for real-time updates
  socket.on('pickup-claimed', (data) => {
    setAvailablePickups(prev => 
      prev.filter(p => p._id !== data.pickupId)
    )
  })
  
  socket.on('pickup-available', (data) => {
    setAvailablePickups(prev => [data.pickup, ...prev])
  })
  
  return () => socket.emit('agent-leave-feed')
}, [user?._id, activeTab])
```

#### Tab 1: Available Pickups Feed
- Live list of unclaimed pickups
- Auto-updates when pickups claimed by any agent
- Removed instantly when claimed

**Pickup Card Shows:**
- User name and contact (phone, email)
- Pickup location (street, city, state, zip)
- Waste categories with estimated weights
- Scheduled date and time slot
- Notes if provided
- **Claim Pickup** button - Triggers atomic claim
- **Message User** button - Opens messaging

**Claim Workflow:**
1. Agent clicks "Claim Pickup"
2. API sends `POST /api/pickups/:id/claim`
3. Atomic MongoDB operation prevents double-booking
4. Success → Pickup removed from available feed globally
5. Toast notification shows success
6. Pickup moves to "My Assignments" tab
7. User receives notification about assignment

#### Tab 2: My Assigned Pickups
Shows all pickups claimed by current agent

**Pickup Card Shows:** (Same as available but with status buttons)
- Same user/location/waste details as available
- Status badge: assigned/in-progress/completed
- **Start Pickup** button (assigned → in-progress)
- **Complete** button (in-progress → completed)
  - Prompts for actual weight collected
- **Release** button (return to scheduled)
- **Message User** button

**Status Workflow:**
```
available → (claim) → assigned
                          ↓
                    (start) in-progress
                          ↓
                     (complete) completed
                     
(release accessible anytime)
```

#### Stats Cards
- Available: Count of unclaimed pickups
- My Claimed: Count of assigned pickups
- Pending: assigned + in-progress count
- Completed: Total completed by this agent

### 3. PickupChat Component

**File:** `frontend/src/components/PickupChat.jsx`

Real-time chat tied to specific pickup with context-aware features

#### Features
- Message history fetch and display
- Real-time message sending via Socket.io
- Read-only mode for assigned pickups (when agent isn't the assigned one)
- Typing indicators (infrastructure ready)
- Auto-scroll to latest message
- Timestamps on each message
- User/Agent message differentiation (bubble styling)

#### Socket.io Integration
```javascript
socket.emit('join-pickup-chat', { pickupId, userId })

socket.on(`message-${pickupId}`, (message) => {
  setMessages(prev => [...prev, message])
})

// Send message
socket.emit('send-pickup-message', {
  pickupId,
  message: response.data,
  recipientId: response.data.recipientId
})
```

#### Lock Behavior
```
Status: scheduled → Everyone can chat
        ↓
       assigned → Only assigned agent + user can chat
        ↓
   in-progress → Only assigned agent + user can chat
        ↓
    completed → Read-only for both
```

### 4. Route-Based Access Control

**File:** `frontend/src/App.jsx`

```javascript
// Dynamic routing based on role
<Route path="/dashboard" element={
  user?.role === 'admin' ? <AdminDashboard /> :
  user?.role === 'agent' ? <AgentDashboard /> :
  <UserDashboard />
} />

// Explicit role-specific routes
<Route path="/dashboard/user" element={
  user?.role === 'user' ? <UserDashboard /> : 
  <Navigate to="/dashboard" />
} />

<Route path="/dashboard/agent" element={
  user?.role === 'agent' ? <AgentDashboard /> : 
  <Navigate to="/dashboard" />
} />
```

Role-based routing ensures:
- Users see UserDashboard
- Agents see AgentDashboard
- Admins see AdminDashboard
- Cross-role access denied with redirect

## Real-Time Data Flow

### Pickup Claiming Sequence

```
Agent A                    Database              Agent B
   │                          │                     │
   ├─ Click Claim ────────┐   │                     │
   │                      │   │                     │
   │  POST /claim  ────→ │   │                     │
   │  (atomic update)  ─→│   │ ←─ Socket: pickup-claimed
   │                      │   │
   │  Refresh state ←──── │   │
   │  Remove from feed    │   │  Remove from feed ←┤
   │                      │   │
   └─ Success toast       │   │
                          │   │
              Socket.io broadcasts to
              all connected agents
```

### Message Sending Sequence

```
User                Socket.io Server        Agent
  │                      │                    │
  ├─ Type message        │                    │
  │                      │                    │
  ├─ Click Send ──────→  │                    │
  │                      │ ─ pickup-{id} ─→ │
  │  Save in DB          │                    │
  │  ←─ Confirmation     │  Receive in chat   │
  │                      │                    │
  └─ Display message     │                    │
                         │                    │
         Real-time delivery via Socket.io
         Stored in database for history
```

## API Endpoint Reference

### Agent Endpoints

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/api/pickups/agent/available` | List unclaimed pickups | `{ pickups: [], total, pages }` |
| GET | `/api/pickups/agent/my-pickups` | List claimed pickups | `{ pickups: [] }` |
| POST | `/api/pickups/:id/claim` | Claim pickup (atomic) | `{ pickup: { ...claimed } }` |
| POST | `/api/pickups/:id/release` | Release pickup | `{ pickup: { status: 'scheduled' } }` |
| PUT | `/api/pickups/:id/status` | Update status | `{ pickup: { status, ...} }` |
| GET | `/api/pickups/details/:id` | Get pickup details | `{ pickup: { ...fullData } }` |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pickups` | Schedule new pickup |
| GET | `/api/pickups` | List user's pickups |
| GET | `/api/pickups/:id` | Get pickup details |
| PUT | `/api/pickups/:id` | Update pickup |
| DELETE | `/api/pickups/:id` | Cancel pickup |
| POST | `/api/pickups/:id/rate` | Rate completed pickup |

## Error Handling

### Common Error Scenarios

**Double-Booking Prevention:**
```
Error: "Pickup already claimed by another agent"
Root: Atomic update check failed
Solution: Refresh list, select different pickup
```

**Chat Lock Violation:**
```
Error: "Chat is locked for this pickup"
Root: Attempting to message on assigned pickup where not assigned agent
Solution: Show read-only UI or deny message input
```

**Pickup No Longer Available:**
```
Error: "Pickup not found or already claimed"
Root: Another agent claimed between view and claim
Solution: Show toast, remove from client-side list, refresh
```

## Testing Checklist

### Backend Testing
- [ ] Claim pickup atomically succeeds once
- [ ] Second claim on same pickup fails with proper error
- [ ] Release pickup returns to scheduled
- [ ] Status transitions follow workflow
- [ ] Socket events broadcast correctly
- [ ] User receives notifications

### Frontend Testing
- [ ] User Dashboard loads stats correctly
- [ ] Agent Dashboard available pickups feed auto-updates
- [ ] Claiming pickup removes instantly from available
- [ ] Multiple agents see same claimed pickup disappear
- [ ] Status updates propagate in real-time
- [ ] Chat messages send and receive in real-time
- [ ] Role-based routing prevents unauthorized access
- [ ] Responsive layout on mobile

### Integration Testing
- [ ] End-to-end pickup claiming flow
- [ ] Multi-user claiming simulation
- [ ] Chat between user and agent
- [ ] Notification delivery
- [ ] Socket.io reconnection handling
- [ ] Polling fallback works when Socket disabled

## Performance Optimizations

1. **Database Indexing** - Efficient pickup queries
2. **Atomic Operations** - No race conditions
3. **Socket.io Rooms** - Targeted event broadcasting
4. **Pagination** - Large pickup list handling
5. **Lazy Loading** - Expandable pickup cards
6. **Connection Pooling** - MongoDB connection management

## Future Enhancements

1. **Typing Indicators** - Show when agent is typing
2. **Message Reactions** - Like, acknowledge messages
3. **Pickup Rating System** - Rate completed pickups
4. **Batch Claiming** - Claim multiple pickups at once
5. **Advanced Filtering** - By waste type, weight range
6. **Agent Preferences** - Set service areas, waste types
7. **SMS Notifications** - For non-app users
8. **Map Integration** - Show pickup locations
9. **Photo Upload** - Before/after pickup photos
10. **Payment Integration** - Incentive rewards for agents

## Deployment Considerations

1. **Environment Variables** - Set correct API URL
2. **CORS** - Allow frontend domain in server
3. **HTTPS** - Required for production Socket.io
4. **Database** - Ensure indexes are created
5. **Scaling** - Use Socket.io adapters for multiple servers
6. **Monitoring** - Track claiming success rates
7. **Backup** - Regular database backups

## Troubleshooting

### Socket.io Not Connecting
- Check browser console for errors
- Verify server is running on correct port
- Check VITE_API_URL environment variable
- Ensure CORS is properly configured

### Claims Not Broadcasting
- Verify Socket.io events in server logs
- Check if client joined correct room
- Ensure client has proper JWT token
- Check network tab for event payloads

### Modal Chat Not Showing
- Verify PickupChat component imported
- Check if pickupId prop is passed correctly
- Verify Socket.io connected
- Check browser console for errors

## Support
For issues or questions, refer to the project README.md and MESSAGING_SYSTEM.md for related features.
