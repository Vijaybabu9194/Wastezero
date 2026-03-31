import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Bell, User, LogOut, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import api, { messageApi } from '../utils/api'

const Navbar = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    fetchUnreadCount()
    fetchUnreadMessages()
  }, [])

  // Refresh unread counts when user navigates to messages/notifications
  useEffect(() => {
    if (location.pathname === '/messages' || location.pathname === '/notifications') {
      fetchUnreadCount()
      fetchUnreadMessages()
    }
  }, [location.pathname])

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications?unread=true')
      setUnreadCount(response.data.unreadCount)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const fetchUnreadMessages = async () => {
    try {
      const response = await messageApi.getUnreadCount()
      setUnreadMessages(response.data.unreadCount)
    } catch (error) {
      console.error('Error fetching unread messages:', error)
    }
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-primary-600">♻️ WasteZero</div>
            </Link>
          </div>



          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                const isDark = document.documentElement.classList.toggle('dark');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
              }}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
            >
              🌙
            </button>
            <Link
              to="/notifications"
              className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>

            <Link
              to="/messages"
              className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <MessageCircle className="w-6 h-6" />
              {unreadMessages > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-green-600 rounded-full">
                  {unreadMessages}
                </span>
              )}
            </Link>

            <Link
              to="/profile"
              className="flex items-center space-x-2 p-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <User className="w-6 h-6" />
              <span className="hidden md:inline">{user?.name}</span>
            </Link>

            <button
              onClick={logout}
              className="flex items-center space-x-2 p-2 text-gray-700 dark:text-gray-200 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <LogOut className="w-6 h-6" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
