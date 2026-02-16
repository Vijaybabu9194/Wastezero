import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import UserDashboard from './pages/UserDashboard'
import AgentDashboard from './pages/AgentDashboard'
import AdminDashboard from './pages/AdminDashboard'
import SchedulePickup from './pages/SchedulePickup'
import Pickups from './pages/Pickups'
import PickupDetail from './pages/PickupDetail'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import Opportunities from './pages/Opportunities'
import OpportunityDetail from './pages/OpportunityDetail'
import ManageOpportunity from './pages/ManageOpportunity'
import Users from './pages/Users'
import Agents from './pages/Agents'
import Reports from './pages/Reports'

// Components
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

function App() {
  const { isAuthenticated, user } = useAuth()

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* Dashboard Routes based on Role */}
        <Route path="/dashboard" element={
          user?.role === 'admin' ? <AdminDashboard /> :
          user?.role === 'agent' ? <AgentDashboard /> :
          <UserDashboard />
        } />
        
        {/* User Routes */}
        <Route path="/schedule-pickup" element={<SchedulePickup />} />
        <Route path="/pickups" element={<Pickups />} />
        <Route path="/pickups/:id" element={<PickupDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        
        {/* Opportunity Routes */}
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/opportunities/:id" element={<OpportunityDetail />} />
        <Route path="/opportunities/create" element={<ManageOpportunity />} />
        <Route path="/opportunities/edit/:id" element={<ManageOpportunity />} />
        
        {/* Admin Routes */}
        <Route path="/users" element={<Users />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
      
      {/* Default Route */}
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
