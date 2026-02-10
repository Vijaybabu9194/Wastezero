# WasteZero Backend API

Express.js backend API for the WasteZero platform.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration

# Seed the database with test data
node seed.js

# Start development server
npm run dev

# Start production server
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Pickups
- `GET /api/pickups` - Get user's pickups
- `POST /api/pickups` - Create pickup
- `GET /api/pickups/:id` - Get pickup details
- `PUT /api/pickups/:id` - Update pickup
- `DELETE /api/pickups/:id` - Cancel pickup
- `POST /api/pickups/:id/rate` - Rate pickup

### Agents
- `POST /api/agents/find-available` - Find available agents (Admin)
- `POST /api/agents/assign` - Assign agent to pickup (Admin)
- `GET /api/agents/pickups` - Get agent's pickups (Agent)
- `PUT /api/agents/pickups/:id/status` - Update pickup status (Agent)
- `PUT /api/agents/location` - Update agent location (Agent)
- `PUT /api/agents/status` - Update agent status (Agent)

### Admin
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/pickups` - Get all pickups
- `GET /api/admin/agents` - Get all agents
- `PUT /api/admin/agents/:id/verify` - Verify agent
- `PUT /api/admin/users/:id/toggle-status` - Toggle user status

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## Database Models

- **User** - User accounts and profiles
- **Agent** - Agent profiles and information
- **Pickup** - Waste pickup requests
- **Notification** - User notifications

## Environment Variables

Required environment variables in `.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/wastezero
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

## Socket.io Events

- `connection` - Client connected
- `join-room` - Join user's room for notifications
- `notification` - Real-time notification to user
- `disconnect` - Client disconnected
