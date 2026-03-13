import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Package, Calendar, MapPin, Filter } from 'lucide-react'
import PickupMap from '../components/PickupMap'

const Pickups = () => {
  const [pickups, setPickups] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchPickups()
  }, [filter])

  const fetchPickups = async () => {
    try {
      const url = filter === 'all' ? '/pickups' : `/pickups?status=${filter}`
      const response = await api.get(url)
      setPickups(response.data.pickups)
    } catch (error) {
      toast.error('Error loading pickups')
    } finally {
      setLoading(false)
    }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">My Pickups</h1>
        <Link to="/schedule-pickup" className="btn-primary">
          Schedule New Pickup
        </Link>
      </div>

      {/* Hyderabad Map with user's pickups */}
      <PickupMap mode="user" height="400px" />

      {/* Filter */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <div className="flex space-x-2">
            {['all', 'scheduled', 'assigned', 'in-progress', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  filter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pickups List */}
      {pickups.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No pickups found</h2>
          <p className="text-gray-500 mb-6">
            {filter === 'all'
              ? "You haven't scheduled any pickups yet."
              : `No ${filter} pickups found.`}
          </p>
          <Link to="/schedule-pickup" className="btn-primary inline-block">
            Schedule Your First Pickup
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {pickups.map((pickup) => (
            <div key={pickup._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(pickup.status)}`}>
                      {pickup.status}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(pickup.scheduledDate).toLocaleDateString()} - {pickup.scheduledTimeSlot}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-800 mb-2">
                    Pickup Request #{pickup._id.slice(-8)}
                  </h3>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {pickup.pickupAddress?.street}, {pickup.pickupAddress?.city}, {pickup.pickupAddress?.state}
                    </p>
                    <p>
                      <strong>Categories:</strong> {pickup.wasteCategories.map(c => c.type).join(', ')}
                    </p>
                    {pickup.actualWeight && (
                      <p>
                        <strong>Weight Collected:</strong> {pickup.actualWeight} kg
                      </p>
                    )}
                    {pickup.agentId && (
                      <p>
                        <strong>Agent:</strong> {pickup.agentId.name || 'Assigned'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 md:mt-0">
                  <Link
                    to={`/pickups/${pickup._id}`}
                    className="btn-primary block text-center"
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
  )
}

export default Pickups
