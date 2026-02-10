# WasteZero Frontend

React-based frontend application for the WasteZero platform.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Features

- Role-based dashboards (User, Agent, Admin)
- Real-time notifications
- Responsive design
- Interactive charts and analytics
- Toast notifications
- Socket.io integration

## Environment

The frontend connects to the backend API at `http://localhost:5000` via proxy configuration in `vite.config.js`.

## Available Routes

- `/login` - User login
- `/register` - User registration
- `/dashboard` - Role-based dashboard
- `/schedule-pickup` - Schedule new pickup (Users)
- `/pickups` - View all pickups
- `/pickups/:id` - Pickup details
- `/profile` - User profile
- `/notifications` - Notifications center

## Technologies

- React 18
- React Router v6
- Tailwind CSS
- Axios
- Socket.io Client
- Recharts
- Lucide React Icons
- React Hot Toast
