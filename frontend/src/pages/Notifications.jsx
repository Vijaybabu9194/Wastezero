import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Bell, Check, CheckCheck, Trash2, Filter } from 'lucide-react'

const Notifications = () => {
  const { socket } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()

    // Listen for real-time notifications
    if (socket) {
      socket.on('notification', (data) => {
        fetchNotifications()
        toast.success('New notification received')
      })
    }

    return () => {
      if (socket) {
        socket.off('notification')
      }
    }
  }, [socket, filter])

  const fetchNotifications = async () => {
    try {
      const url = filter === 'unread' ? '/notifications?unread=true' : '/notifications'
      const response = await api.get(url)
      setNotifications(response.data.notifications)
    } catch (error) {
      toast.error('Error loading notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      fetchNotifications()
    } catch (error) {
      toast.error('Error marking notification as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all')
      toast.success('All notifications marked as read')
      fetchNotifications()
    } catch (error) {
      toast.error('Error marking all as read')
    }
  }

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`)
      toast.success('Notification deleted')
      fetchNotifications()
    } catch (error) {
      toast.error('Error deleting notification')
    }
  }

  const getNotificationIcon = (type) => {
    const icons = {
      pickup_scheduled: '📅',
      agent_assigned: '👤',
      pickup_started: '🚛',
      pickup_completed: '✅',
      pickup_cancelled: '❌',
      system_alert: '🔔'
    }
    return icons[type] || '📢'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Bell className="w-8 h-8 mr-3" />
          Notifications
        </h1>
        {notifications.some(n => !n.isRead) && (
          <button onClick={markAllAsRead} className="btn-secondary flex items-center space-x-2">
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <div className="flex space-x-2">
            {['all', 'unread'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  filter === f
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No notifications</h2>
          <p className="text-gray-500">
            {filter === 'unread'
              ? 'You have no unread notifications'
              : "You don't have any notifications yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`card hover:shadow-md transition-shadow ${
                !notification.isRead ? 'bg-primary-50 border-l-4 border-primary-600' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{getNotificationIcon(notification.type)}</div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                    <div className="flex items-center space-x-2">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification._id)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-2">{notification.message}</p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                    
                    {notification.relatedPickup && (
                      <Link
                        to={`/pickups/${notification.relatedPickup._id || notification.relatedPickup}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-semibold"
                      >
                        View Pickup →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notifications
