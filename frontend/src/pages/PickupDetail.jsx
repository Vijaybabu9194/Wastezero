import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import {
  Calendar,
  MapPin,
  User,
  Phone,
  Trash2,
  Star,
  XCircle,
  ArrowLeft
} from 'lucide-react'

const PickupDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [pickup, setPickup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState({ score: 5, review: '' })
  const [showRating, setShowRating] = useState(false)

  useEffect(() => {
    fetchPickup()
  }, [id])

  const fetchPickup = async () => {
    try {
      const response = await api.get(`/pickups/${id}`)
      setPickup(response.data.pickup)
    } catch (error) {
      toast.error('Error loading pickup details')
      navigate('/pickups')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this pickup?')) return

    const reason = prompt('Please provide a reason for cancellation:')
    if (!reason) return

    try {
      await api.delete(`/pickups/${id}`, { data: { reason } })
      toast.success('Pickup cancelled successfully')
      fetchPickup()
    } catch (error) {
      toast.error('Error cancelling pickup')
    }
  }

  const handleSubmitRating = async () => {
    try {
      await api.post(`/pickups/${id}/rate`, rating)
      toast.success('Rating submitted successfully')
      setShowRating(false)
      fetchPickup()
    } catch (error) {
      toast.error('Error submitting rating')
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

  if (!pickup) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/pickups')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Pickup Details</h1>
      </div>

      {/* Status and Actions */}
      <div className="card">
        <div className="flex justify-between items-center">
          <div>
            <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusBadge(pickup.status)}`}>
              {pickup.status}
            </span>
            <p className="text-sm text-gray-500 mt-2">
              Request ID: #{pickup._id}
            </p>
          </div>

          <div className="flex space-x-2">
            {pickup.status === 'completed' && !pickup.rating && user?.role === 'user' && (
              <button
                onClick={() => setShowRating(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Star className="w-4 h-4" />
                <span>Rate Service</span>
              </button>
            )}
            
            {['scheduled', 'assigned'].includes(pickup.status) && user?.role === 'user' && (
              <button
                onClick={handleCancel}
                className="btn-secondary flex items-center space-x-2 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pickup Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Schedule Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Schedule
          </h2>
          <div className="space-y-2 text-gray-600">
            <p>
              <strong>Date:</strong> {new Date(pickup.scheduledDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Time Slot:</strong> {pickup.scheduledTimeSlot}
            </p>
            {pickup.completedAt && (
              <p>
                <strong>Completed:</strong> {new Date(pickup.completedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Address Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Pickup Address
          </h2>
          <div className="text-gray-600">
            <p>{pickup.pickupAddress?.street}</p>
            <p>{pickup.pickupAddress?.city}, {pickup.pickupAddress?.state}</p>
            <p>{pickup.pickupAddress?.zipCode}</p>
          </div>
        </div>

        {/* User Info (for agents) */}
        {user?.role === 'agent' && pickup.userId && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Customer Details
            </h2>
            <div className="space-y-2 text-gray-600">
              <p>
                <strong>Name:</strong> {pickup.userId.name}
              </p>
              <p className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                {pickup.userId.phone}
              </p>
              <p>
                <strong>Email:</strong> {pickup.userId.email}
              </p>
            </div>
          </div>
        )}

        {/* Agent Info (for users) */}
        {user?.role === 'user' && pickup.agentId && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Assigned Agent
            </h2>
            <div className="space-y-2 text-gray-600">
              <p>
                <strong>Name:</strong> {pickup.agentId.userId?.name || 'Agent'}
              </p>
              <p className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                {pickup.agentId.userId?.phone || 'N/A'}
              </p>
              <p>
                <strong>Vehicle:</strong> {pickup.agentId.vehicleNumber}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Waste Categories */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Trash2 className="w-5 h-5 mr-2" />
          Waste Categories
        </h2>
        <div className="space-y-3">
          {pickup.wasteCategories.map((category, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-800 capitalize">{category.type}</p>
                {category.description && (
                  <p className="text-sm text-gray-600">{category.description}</p>
                )}
              </div>
              <p className="text-lg font-bold text-primary-600">
                {category.estimatedWeight} kg
              </p>
            </div>
          ))}
        </div>
        
        {pickup.actualWeight && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              <strong>Actual Weight Collected:</strong> {pickup.actualWeight} kg
            </p>
          </div>
        )}
      </div>

      {/* Notes */}
      {pickup.notes && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Notes</h2>
          <p className="text-gray-600">{pickup.notes}</p>
        </div>
      )}

      {/* Rating */}
      {pickup.rating && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Rating</h2>
          <div className="flex items-center space-x-2 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-6 h-6 ${
                  i < pickup.rating.score ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-lg font-semibold">{pickup.rating.score}/5</span>
          </div>
          {pickup.rating.review && (
            <p className="text-gray-600 mt-2">{pickup.rating.review}</p>
          )}
        </div>
      )}

      {/* Rating Modal */}
      {showRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Rate This Pickup</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating({ ...rating, score: star })}
                  >
                    <Star
                      className={`w-8 h-8 cursor-pointer ${
                        star <= rating.score ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review (Optional)
              </label>
              <textarea
                value={rating.review}
                onChange={(e) => setRating({ ...rating, review: e.target.value })}
                className="input-field"
                rows="3"
                placeholder="Share your experience..."
              />
            </div>

            <div className="flex space-x-3">
              <button onClick={handleSubmitRating} className="flex-1 btn-primary">
                Submit Rating
              </button>
              <button onClick={() => setShowRating(false)} className="flex-1 btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PickupDetail
