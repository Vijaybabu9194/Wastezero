import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { getSocket, connectSocket } from '../utils/socket'
import toast from 'react-hot-toast'
import HyderabadMap from './HyderabadMap'

/**
 * Shared pickup map component.
 * - mode: "user" | "agent"
 *   - user: shows only current user's pickups
 *   - agent: shows all available (pending) pickups
 */
const PickupMap = ({ mode = 'user', height = '360px' }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pickups, setPickups] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPickups = async () => {
    try {
      if (mode === 'agent') {
        const res = await api.get('/pickups/agent/available')
        setPickups(res.data.pickups || [])
      } else {
        const res = await api.get('/pickups?limit=100')
        setPickups(res.data.pickups || [])
      }
    } catch (error) {
      console.error('Error fetching pickups for map:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPickups()
  }, [mode])

  // Socket-based refresh for real-time updates
  useEffect(() => {
    if (!user?._id) return

    connectSocket(user._id)
    const socket = getSocket()

    const refresh = () => fetchPickups()

    socket.on('pickup-claimed', refresh)
    socket.on('pickup-available', refresh)
    socket.on('pickup-status-updated', refresh)

    return () => {
      socket.off('pickup-claimed', refresh)
      socket.off('pickup-available', refresh)
      socket.off('pickup-status-updated', refresh)
    }
  }, [user?._id, mode])

  const statusColorEmoji = (status) => {
    if (status === 'scheduled') return '🟡'
    if (status === 'assigned') return '🔵'
    if (status === 'completed') return '✅'
    return '⚫'
  }

  const handleClaimFromMap = async (pickupId) => {
    try {
      await api.post(`/pickups/${pickupId}/claim`)
      toast.success('Pickup claimed successfully!')
      fetchPickups()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to claim pickup')
    }
  }

  const markers = pickups
    // Only show pending / active pickups on the map
    .filter((p) => ['scheduled', 'assigned', 'in-progress'].includes(p.status))
    .filter((p) => p.pickupAddress?.coordinates?.lat && p.pickupAddress?.coordinates?.lng)
    .map((p) => {
      const totalWeight = (p.wasteCategories || []).reduce(
        (sum, w) => sum + (Number(w.estimatedWeight) || 0),
        0
      )

      const statusEmoji = statusColorEmoji(p.status)
      const isAssigned = !!p.agentId

      let popupContent
      if (mode === 'agent') {
        popupContent = (
          <div className="space-y-1 text-sm">
            <div className="font-semibold">
              {statusEmoji} {p.wasteCategories.map((w) => w.type).join(', ')} ({totalWeight} kg)
            </div>
            <div>{p.pickupAddress?.street}, {p.pickupAddress?.city}</div>
            <div>
              {new Date(p.scheduledDate).toLocaleDateString()} – {p.scheduledTimeSlot}
            </div>
            <div className="mt-1 flex gap-1">
              <button
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                onClick={() => navigate(`/pickups/${p._id}`)}
              >
                Details
              </button>
              <button
                className="px-2 py-1 text-xs bg-green-600 text-white rounded"
                onClick={() => handleClaimFromMap(p._id)}
              >
                Claim
              </button>
            </div>
          </div>
        )
      } else {
        popupContent = (
          <div className="space-y-1 text-sm">
            <div className="font-semibold">
              {statusEmoji} {p.wasteCategories.map((w) => w.type).join(', ')} ({totalWeight} kg)
            </div>
            <div>{p.pickupAddress?.street}, {p.pickupAddress?.city}</div>
            <div>
              {new Date(p.scheduledDate).toLocaleDateString()} – {p.scheduledTimeSlot}
            </div>
            {isAssigned && (
              <div>
                Agent: {p.agentId?.userId?.name || p.agentId?.name || 'Assigned'}
              </div>
            )}
            <button
              className="mt-1 px-2 py-1 text-xs bg-blue-600 text-white rounded"
              onClick={() => navigate(`/pickups/${p._id}`)}
            >
              View details
            </button>
          </div>
        )
      }

      return {
        id: p._id,
        lat: p.pickupAddress.coordinates.lat,
        lng: p.pickupAddress.coordinates.lng,
        popupContent
      }
    })

  if (loading) {
    return (
      <div className="card flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
      </div>
    )
  }

  if (!markers.length) {
    return (
      <div className="card text-sm text-gray-500">
        No pickups to show on the map yet.
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        {mode === 'agent' ? 'Available Pickups Map' : 'My Pickups Map'}
      </h2>
      <HyderabadMap markers={markers} height={height} />
    </div>
  )
}

export default PickupMap

