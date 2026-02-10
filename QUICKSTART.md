# 🚀 Quick Start Guide - WasteZero

Get WasteZero up and running in less than 5 minutes!

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js installed (v16+): `node --version`
- ✅ MongoDB installed and running: `mongod --version`
- ✅ Git (optional): `git --version`

## Step-by-Step Setup

### 1. Install MongoDB (if not installed)

**macOS (Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongod
```

**Windows:**
Download from [MongoDB Downloads](https://www.mongodb.com/try/download/community)

### 2. Setup Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Open .env and set your JWT secret (or use default for testing)
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/wastezero
# JWT_SECRET=your_jwt_secret_change_in_production
# CLIENT_URL=http://localhost:5173

# Seed database with test accounts
npm run seed

# Start backend server
npm run dev
```

✅ Backend should now be running at `http://localhost:5000`

### 3. Setup Frontend

Open a **new terminal window**:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start frontend
npm run dev
```

✅ Frontend should now be running at `http://localhost:5173`

### 4. Access the Application

1. Open your browser to `http://localhost:5173`
2. You'll see the login page

### 5. Create Your Account

1. **Open the app**: Go to http://localhost:5173
2. **Click "Sign up"** on the login page
3. **Fill in your details**:
   - Full Name
   - Email Address
   - Phone Number
   - Role: Choose between:
     - **User**: Schedule waste pickups for your home/business
     - **Pickup Agent**: Collect waste and manage pickups
   - Password (minimum 6 characters)
   - Address Information
4. **Submit** to create your account
5. **Login** with your new credentials

**Note**: Admin accounts can only be created through the database or by another admin.

### 6. Optional: Seed Test Data

If you want to create test accounts for development, edit `backend/seed.js` and uncomment the sample users, then run:
```bash
cd backend
npm run seed
```

## Common Issues & Solutions

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Start MongoDB
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Manual
mongod --dbpath /path/to/data/directory
```

### Port Already in Use
```
Error: Port 5000 is already in use
```
**Solution**: Change port in `backend/.env`
```env
PORT=5001
```

### Cannot find module errors
**Solution**: Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

## Quick Commands Reference

### Backend Commands
```bash
npm run dev       # Start development server with auto-reload
npm start         # Start production server
npm run seed      # Seed database with test data
```

### Frontend Commands
```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
```

## What's Next?

1. **Register**: Create your account via the signup page
2. **As a User**: Schedule your first waste pickup
3. **As an Agent**: Update your status and start accepting pickups
4. **Explore**: Check out notifications, profile settings, and dashboard analytics

## Project Structure

```
WasteZero/
├── backend/
│   ├── controllers/      # Request handlers
│   ├── models/          # Database schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & validation
│   ├── server.js        # Entry point
│   └── seed.js          # Database seeding
│
└── frontend/
    ├── src/
    │   ├── components/  # Reusable components
    │   ├── pages/       # Page components
    │   ├── context/     # React context (Auth)
    │   ├── utils/       # Helper functions
    │   └── App.jsx      # Main app component
    └── package.json

```

## Testing the Application

### 1. Schedule a Pickup (As User)
- Login as user
- Click "Schedule Pickup"
- Fill in pickup details
- Submit

### 2. Assign Agent (As Admin)
- Login as admin
- Go to dashboard
- View pending pickups
- Assign agent to pickup

### 3. Complete Pickup (As Agent)
- Login as agent
- View assigned pickups
- Update status to "In Progress"
- Complete pickup with actual weight

### 4. View Statistics
- Users can see their waste statistics
- Admins can see platform-wide analytics
- Charts show trends and breakdowns

## Need Help?

- 📖 Read full documentation in [README.md](README.md)
- 📧 Contact: support@wastezero.com
- 🐛 Report issues on GitHub

## Development Tips

- **Hot Reload**: Both frontend and backend support hot reload
- **API Testing**: Use Postman or Thunder Client
- **MongoDB GUI**: Use MongoDB Compass to view data
- **React DevTools**: Install browser extension for debugging

---

**Happy Coding! ♻️**
