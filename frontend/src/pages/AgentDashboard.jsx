import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Package, TrendingUp, Clock, CheckCircle, MapPin } from 'lucide-react'

const AgentDashboard = () => {
  const { user } = useAuth()
  const [pickups, setPickups] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAgentData()
  }, [])

  const fetchAgentData = async () => {
    try {
      const response = await api.get('/agents/pickups')
      const allPickups = response.data.pickups
      
      setPickups(allPickups.filter(p => ['assigned', 'in-progress'].includes(p.status)))
      setStats({
        total: allPickups.length,
        completed: allPickups.filter(p => p.status === 'completed').length,
        pending: allPickups.filter(p => ['assigned', 'in-progress'].includes(p.status)).length
      })
    } catch (error) {
      toast.error('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  const updatePickupStatus = async (pickupId, status, actualWeight = null) => {
    try {
      await api.put(`/agents/pickups/${pickupId}/status`, { status, actualWeight })
      toast.success('Pickup status updated')
      fetchAgentData()
    } catch (error) {
      toast.error('Error updating status')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      assigned: 'bg-purple-100 text-purple-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Agent Dashboard</h1>
        <p className="text-primary-100">Manage your assigned pickups and complete collections</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Pickups</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <Package className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pending</p>
              <p className="text-3xl font-bold mt-1">{stats.pending}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Completed</p>
              <p className="text-3xl font-bold mt-1">{stats.completed}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-200" />
          </div>
        </div>
      </div>

      {/* Active Pickups */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Active Pickups</h2>

        {pickups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-3 text-gray-300" />
            <p>No active pickups assigned</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pickups.map((pickup) => (
              <div key={pickup._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(pickup.status)}`}>
                        {pickup.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(pickup.scheduledDate).toLocaleDateString()} - {pickup.scheduledTimeSlot}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-800 mb-1">{pickup.userId?.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {pickup.pickupAddress?.street}, {pickup.pickupAddress?.city}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Categories: {pickup.wasteCategories.map(c => c.type).join(', ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Phone: {pickup.userId?.phone}
                    </p>
                  </div>

                  <div className="flex flex-col space-y-2 mt-4 md:mt-0">
                    {pickup.status === 'assigned' && (
                      <button
                        onClick={() => updatePickupStatus(pickup._id, 'in-progress')}
                        className="btn-primary text-sm"
                      >
                        Start Pickup
                      </button>
                    )}
                    
                    {pickup.status === 'in-progress' && (
                      <button
                        onClick={() => {
                          const weight = prompt('Enter actual weight (kg):')
                          if (weight) {
                            updatePickupStatus(pickup._id, 'completed', parseFloat(weight))
                          }
                        }}
                        className="btn-primary text-sm bg-green-600 hover:bg-green-700"
                      >
                        Complete Pickup
                      </button>
                    )}
                    
                    <Link
                      to={`/pickups/${pickup._id}`}
                      className="btn-secondary text-sm text-center"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AgentDashboard
