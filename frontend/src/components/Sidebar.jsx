import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Calendar,
  Package,
  BarChart3,
  Users,
  Truck,
  Settings,
  Heart
} from 'lucide-react'

const Sidebar = () => {
  const { user } = useAuth()

  const userLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/schedule-pickup', icon: Calendar, label: 'Schedule Pickup' },
    { to: '/pickups', icon: Package, label: 'My Pickups' },
    { to: '/opportunities', icon: Heart, label: 'Volunteer' },
    { to: '/profile', icon: Settings, label: 'Settings' }
  ]

  const agentLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/pickups', icon: Truck, label: 'Assigned Pickups' },
    { to: '/opportunities', icon: Heart, label: 'Volunteer' },
    { to: '/profile', icon: Settings, label: 'Settings' }
  ]

  const adminLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/pickups', icon: Package, label: 'All Pickups' },
    { to: '/opportunities', icon: Heart, label: 'Opportunities' },
    { to: '/users', icon: Users, label: 'Users' },
    { to: '/agents', icon: Truck, label: 'Agents' },
    { to: '/reports', icon: BarChart3, label: 'Reports' }
  ]

  const links =
    user?.role === 'admin' ? adminLinks :
    user?.role === 'agent' ? agentLinks :
    userLinks

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-md overflow-y-auto hidden lg:block">
      <nav className="p-4 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <link.icon className="w-5 h-5" />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
