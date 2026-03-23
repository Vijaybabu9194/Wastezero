import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { messageApi } from '../utils/api'
import { getSocket, connectSocket } from '../utils/socket'
import api from '../utils/api'
import toast from 'react-hot-toast'
import PickupMap from '../components/PickupMap'
import {
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  MapPin,
  MessageCircle,
  Phone,
  Mail,
  MapPinIcon,
  AlertCircle,
  CheckIcon,
  Navigation,
  ChevronRight
} from 'lucide-react'

const AgentDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('available') // 'available' or 'assigned'
  const [availablePickups, setAvailablePickups] = useState([])
  const [assignedPickups, setAssignedPickups] = useState([])
  const [stats, setStats] = useState({
    available: 0,
    claimed: 0,
    completed: 0,
    pending: 0
  })
  const [loading, setLoading] = useState(true)
  const [claimingId, setClaimingId] = useState(null)
  const [releasingId, setReleasingId] = useState(null)

  useEffect(() => {
    fetchAgentData()
    
    // Connect to Socket.io for real-time updates
    if (user?._id) {
      connectSocket(user._id)
      const socket = getSocket()

      // Join available pickups feed room
      socket.emit('agent-join-feed')

      // Listen for pickup claimed events (remove from available list)
      socket.on('pickup-claimed', (data) => {
        setAvailablePickups(prev =>
          prev.filter(p => p._id !== data.pickupId)
        )
        // If this agent claimed it, add to assigned list
        if (data.claimedBy === user._id) {
          fetchAgentData()
        }
      })

      // Listen for pickup released events (add back to available list)
      socket.on('pickup-available', (data) => {
        if (activeTab === 'available') {
          setAvailablePickups(prev => {
            // Check if already in list
            if (prev.find(p => p._id === data.pickupId)) {
              return prev
            }
            // Add the released pickup back
            return [data.pickup, ...prev]
          })
        }
      })

      // Listen for pickup assigned notifications (when user's pickup gets assigned)
      socket.on('pickup-assigned', (data) => {
        if (activeTab === 'assigned') {
          fetchAgentData()
        }
      })

      return () => {
        socket.emit('agent-leave-feed')
        socket.off('pickup-claimed')
        socket.off('pickup-available')
        socket.off('pickup-assigned')
      }
    }
  }, [user?._id, activeTab])

  // Polling fallback - refresh every 5 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'available') {
        api.get('/pickups/agent/available').then(res => {
          setAvailablePickups(res.data.pickups || [])
        }).catch(() => {})
      } else {
        api.get('/pickups/agent/my-pickups').then(res => {
          setAssignedPickups(res.data.pickups || [])
        }).catch(() => {})
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [activeTab])

  const fetchAgentData = async () => {
    try {
      const [availableRes, assignedRes] = await Promise.all([
        api.get('/pickups/agent/available'),
        api.get('/pickups/agent/my-pickups')
      ])

      setAvailablePickups(availableRes.data.pickups || [])
      const assigned = assignedRes.data.pickups || []
      setAssignedPickups(assigned)

      setStats({
        available: availableRes.data.total || 0,
        claimed: assigned.filter(p => p.status === 'assigned').length,
        completed: assigned.filter(p => p.status === 'completed').length,
        pending: assigned.filter(p => ['assigned', 'in-progress'].includes(p.status)).length
      })
    } catch (error) {
      toast.error('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  const handleClaimPickup = async (pickupId) => {
    setClaimingId(pickupId)
    try {
      await api.post(`/pickups/${pickupId}/claim`)
      toast.success('Pickup claimed successfully!')
      fetchAgentData()
    } catch (error) {
      if (error.response?.status === 409) {
        fetchAgentData()
      }
      toast.error(error.response?.data?.message || 'Failed to claim pickup')
    } finally {
      setClaimingId(null)
    }
  }

  const handleReleasePickup = async (pickupId) => {
    if (!window.confirm('Are you sure you want to release this pickup?')) return
    
    setReleasingId(pickupId)
    try {
      await api.post(`/pickups/${pickupId}/release`)
      toast.success('Pickup released successfully')
      fetchAgentData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to release pickup')
    } finally {
      setReleasingId(null)
    }
  }

  const handleUpdateStatus = async (pickupId, status) => {
    try {
      let actualWeight = null
      if (status === 'completed') {
        const weight = prompt('Enter actual weight collected (kg):')
        if (!weight) return
        actualWeight = parseFloat(weight)
        if (isNaN(actualWeight)) {
          toast.error('Please enter a valid weight')
          return
        }
      }

      await api.put(`/pickups/${pickupId}/status`, { status, actualWeight })
      toast.success(`Pickup status updated to ${status}`)
      fetchAgentData()
    } catch (error) {
      toast.error('Error updating status')
    }
  }

  const handleMessageUser = (pickup) => {
    if (!pickup?.userId) return
    // Navigate to Messages and pre-select this user, with pickup context for chat
    navigate('/messages', {
      state: {
        initialUser: pickup.userId,
        pickupId: pickup._id,
        pickup: pickup
      }
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: 'bg-blue-100 text-blue-800',
      assigned: 'bg-purple-100 text-purple-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    const icons = {
      scheduled: <Clock className="w-4 h-4" />,
      assigned: <MapPinIcon className="w-4 h-4" />,
      'in-progress': <Navigation className="w-4 h-4" />,
      completed: <CheckCircle className="w-4 h-4" />,
      cancelled: <AlertCircle className="w-4 h-4" />
    }
    return icons[status]
  }

  const PickupCard = ({ pickup, isClaimed = false }) => (
    <div className={`card border-l-4 ${isClaimed ? 'border-purple-600' : 'border-blue-600'} hover:shadow-lg transition-shadow`}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          {/* Status and Date */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusBadge(pickup.status)}`}>
              {getStatusIcon(pickup.status)}
              {pickup.status.charAt(0).toUpperCase() + pickup.status.slice(1)}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Clock size={14} />
              {new Date(pickup.scheduledDate).toLocaleDateString()}
            </span>
          </div>

          {/* User Info */}
          <div className="mb-3">
            <h3 className="font-bold text-gray-800 text-lg">{pickup.userId?.name}</h3>
            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
              <Phone size={14} />
              {pickup.userId?.phone}
            </p>
            {pickup.userId?.email && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Mail size={14} />
                {pickup.userId?.email}
              </p>
            )}
          </div>

          {/* Location */}
          <div className="mb-3 bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
              <MapPin size={16} />
              Pickup Location
            </p>
            <p className="text-sm text-gray-600">
              {pickup.pickupAddress?.street}, {pickup.pickupAddress?.city}
            </p>
            <p className="text-sm text-gray-600">
              {pickup.pickupAddress?.state} {pickup.pickupAddress?.zipCode}
            </p>
          </div>

          {/* Waste Details */}
          <div className="mb-3 bg-green-50 p-3 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 mb-2">Waste Details</p>
            <div className="space-y-1">
              {pickup.wasteCategories?.map((waste, idx) => (
                <p key={idx} className="text-sm text-gray-600">
                  <span className="font-medium">{waste.type.toUpperCase()}:</span> {waste.estimatedWeight} kg
                </p>
              ))}
              <p className="text-sm font-semibold text-gray-700 mt-2">
                Total: {pickup.wasteCategories?.reduce((sum, w) => sum + (Number(w.estimatedWeight) || 0), 0)} kg
              </p>
            </div>
          </div>

          {/* Time Slot */}
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Time Slot:</span> <span className="capitalize">{pickup.scheduledTimeSlot}</span>
          </p>

          {pickup.notes && (
            <div className="mt-2 p-2 bg-yellow-50 rounded border-l-2 border-yellow-400">
              <p className="text-xs text-gray-600"><span className="font-semibold">Notes:</span> {pickup.notes}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 md:min-w-max">
          {!isClaimed ? (
            // Available pickup - Claim button
            <button
              onClick={() => handleClaimPickup(pickup._id)}
              disabled={claimingId === pickup._id}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center gap-2"
            >
              {claimingId === pickup._id ? '...' : '✓ Claim Pickup'}
            </button>
          ) : (
            // Claimed pickup - Status buttons
            <>
              {pickup.status === 'assigned' && (
                <button
                  onClick={() => handleUpdateStatus(pickup._id, 'in-progress')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
                >
                  Start Pickup
                </button>
              )}

              {pickup.status === 'in-progress' && (
                <button
                  onClick={() => handleUpdateStatus(pickup._id, 'completed')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
                >
                  <CheckIcon size={16} />
                  Complete
                </button>
              )}

              {['assigned', 'in-progress'].includes(pickup.status) && (
                <button
                  onClick={() => handleReleasePickup(pickup._id)}
                  disabled={releasingId === pickup._id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
                >
                  {releasingId === pickup._id ? '...' : 'Release'}
                </button>
              )}
            </>
          )}

          {/* Message Button */}
          <button
            onClick={() => handleMessageUser(pickup)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center"
          >
            <MessageCircle size={16} />
            Message User
          </button>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Agent Dashboard</h1>
        <p className="text-green-100">Manage available pickups and complete your assigned collections</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Available</p>
              <p className="text-3xl font-bold mt-1">{stats.available}</p>
            </div>
            <Package className="w-12 h-12 text-blue-200 opacity-80" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">My Claimed</p>
              <p className="text-3xl font-bold mt-1">{stats.claimed}</p>
            </div>
            <Navigation className="w-12 h-12 text-purple-200 opacity-80" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pending</p>
              <p className="text-3xl font-bold mt-1">{stats.pending}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-200 opacity-80" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Completed</p>
              <p className="text-3xl font-bold mt-1">{stats.completed}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* Shared Hyderabad Map for available pickups */}
      <PickupMap mode="agent" />

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'available'
              ? 'text-green-600 border-green-600'
              : 'text-gray-600 border-transparent hover:text-gray-800'
          }`}
        >
          📍 Available Pickups ({stats.available})
        </button>
        <button
          onClick={() => setActiveTab('assigned')}
          className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'assigned'
              ? 'text-green-600 border-green-600'
              : 'text-gray-600 border-transparent hover:text-gray-800'
          }`}
        >
          ✓ My Assignments ({stats.pending})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          {availablePickups.length === 0 ? (
            <div className="card text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No available pickups right now</p>
              <p className="text-gray-400 text-sm mt-2">Check back soon for new opportunities!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availablePickups.map(pickup => (
                <PickupCard key={pickup._id} pickup={pickup} isClaimed={false} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'assigned' && (
        <div className="space-y-4">
          {assignedPickups.length === 0 ? (
            <div className="card text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No pickups assigned yet</p>
              <p className="text-gray-400 text-sm mt-2">Head to "Available Pickups" to claim some!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignedPickups.map(pickup => (
                <PickupCard key={pickup._id} pickup={pickup} isClaimed={true} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AgentDashboard
