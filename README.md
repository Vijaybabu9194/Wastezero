# WasteZero - Smart Waste Management Platform

WasteZero is a comprehensive digital platform designed to help users schedule waste pickups, categorize recyclables, and promote responsible waste management. The platform intelligently assigns pickup agents based on location and provides real-time notifications and statistics tracking.

## 🌟 Features

### Module A: User Management
- User registration and authentication (JWT-based)
- Role-based access control (User, Agent, Admin)
- Profile management
- Secure password handling with bcrypt

### Module B: Opportunity Management
- Schedule waste pickups with date and time slots
- Categorize waste (plastic, organic, e-waste, paper, glass, metal)
- Track pickup status (scheduled, assigned, in-progress, completed, cancelled)
- Estimated and actual weight tracking
- Rate completed pickups

### Module C: Matching & Communication
- Intelligent agent assignment based on location
- Real-time notifications using Socket.IO
- Agent availability tracking
- Live pickup status updates
- Agent rating system

### Module D: Administration & Reporting
- Admin dashboard with comprehensive statistics
- User and agent management
- Pickup monitoring and reporting
- Waste collection analytics
- Monthly pickup trends
- Category-wise waste breakdown

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time updates
- **Recharts** - Data visualization
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

## 📁 Project Structure

```
Wastezero/
├── backend/
│   ├── controllers/       # Business logic
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Auth & validation
│   ├── server.js         # Entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/   # Reusable components
    │   ├── context/      # React context (Auth)
    │   ├── pages/        # Page components
    │   ├── utils/        # Utility functions
    │   ├── App.jsx       # Main app component
    │   └── main.jsx      # Entry point
    ├── index.html
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Wastezero
```

2. **Backend Setup**
```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Update .env with your configuration
# Then start MongoDB and run:
npm run dev
```

3. **Frontend Setup**
```bash
cd ../frontend
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Environment Variables

#### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/wastezero
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

## 📱 User Roles & Features

### Regular User
- Register and login
- Schedule waste pickups
- Track pickup status
- View waste statistics
- Rate completed pickups
- Receive notifications

### Pickup Agent
- View assigned pickups
- Update location
- Start/complete pickups
- View customer details
- Track completed collections

### Administrator
- View platform statistics
- Manage all users
- Verify agents
- Monitor pickups
- View analytics and reports
- Assign agents to pickups

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Pickups
- `POST /api/pickups` - Create pickup request
- `GET /api/pickups` - Get user pickups
- `GET /api/pickups/:id` - Get pickup details
- `PUT /api/pickups/:id` - Update pickup
- `DELETE /api/pickups/:id` - Cancel pickup
- `POST /api/pickups/:id/rate` - Rate pickup

### Agents
- `POST /api/agents/find-available` - Find available agents
- `POST /api/agents/assign` - Assign agent to pickup
- `GET /api/agents/pickups` - Get agent's pickups
- `PUT /api/agents/pickups/:id/status` - Update pickup status
- `PUT /api/agents/location` - Update agent location
- `PUT /api/agents/status` - Update agent status

### Admin
- `GET /api/admin/stats` - Get dashboard statistics
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

## 🎯 Key Features Explained

### Real-time Notifications
The platform uses Socket.IO for real-time communication:
- Users receive instant updates when agents are assigned
- Agents get notified of new pickup requests
- Status changes trigger immediate notifications

### Intelligent Agent Matching
The system automatically finds the best available agent based on:
- Geographic proximity to pickup location
- Agent availability status
- Agent rating and performance history

### Waste Statistics Tracking
Users can view their environmental impact:
- Total pickups completed
- Total weight of waste collected
- Category-wise breakdown
- Recycling statistics

## 📊 Database Models

### User Model
- Personal information (name, email, phone)
- Address with coordinates
- Role (user/agent/admin)
- Waste statistics
- Active status

### Agent Model
- User reference
- Vehicle information
- Service areas
- Current location
- Rating and statistics
- Verification status

### Pickup Model
- User and agent references
- Waste categories with weights
- Scheduled date and time slot
- Pickup address with coordinates
- Status tracking
- Rating and review

### Notification Model
- User reference
- Notification type and content
- Related pickup reference
- Read status

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected routes with middleware
- Role-based access control
- Input validation
- CORS configuration

## 🌐 Deployment

### Backend
1. Set up MongoDB database (MongoDB Atlas recommended)
2. Configure environment variables
3. Deploy to platforms like Heroku, Railway, or DigitalOcean
4. Ensure Socket.IO is properly configured for production

### Frontend
1. Build the production bundle: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or AWS S3
3. Update API base URL for production

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

Developed as part of the WasteZero initiative to promote sustainable waste management practices.

## 📞 Support

For support, please open an issue in the repository or contact the development team.

---

**Happy Waste Management! ♻️**
