import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { messageApi } from '../utils/api'
import api from '../utils/api'
import toast from 'react-hot-toast'
import PickupMap from '../components/PickupMap'
import OpportunityMap from '../components/OpportunityMap'
import {
  Calendar,
  Package,
  TrendingUp,
  Leaf,
  Trash2,
  Droplet,
  Monitor,
  FileText,
  Wine,
  Package2,
  MessageCircle,
  Plus,
  MapPin,
  Clock,
  User,
  Phone,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react'

const UserDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [myPickups, setMyPickups] = useState([])
  const [myOpportunities, setMyOpportunities] = useState([])
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [expandedPickup, setExpandedPickup] = useState(null)
  
  const [formData, setFormData] = useState({
    scheduledDate: '',
    scheduledTimeSlot: 'morning',
    pickupAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      coordinates: { lat: 0, lng: 0 }
    },
    wasteCategories: [{ type: 'plastic', estimatedWeight: '', description: '' }],
    notes: ''
  })

  const wasteTypes = ['plastic', 'organic', 'e-waste', 'paper', 'glass', 'metal', 'other']

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, pickupsRes, convsRes, oppRes] = await Promise.all([
        api.get('/users/stats'),
        api.get('/pickups?limit=100'),
        messageApi.getConversations(),
        api.get('/opportunities/admin/my-opportunities')
      ])
      
      setStats(statsRes.data.stats)
      setMyPickups(pickupsRes.data.pickups || [])
      setConversations(convsRes.data.conversations || [])
      setMyOpportunities(oppRes.data.data || [])
    } catch (error) {
      toast.error('Error loading dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData({
        ...formData,
        [parent]: { ...formData[parent], [child]: value }
      })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleWasteCategoryChange = (index, field, value) => {
    const updatedCategories = [...formData.wasteCategories]
    updatedCategories[index][field] = value
    setFormData({ ...formData, wasteCategories: updatedCategories })
  }

  const addWasteCategory = () => {
    setFormData({
      ...formData,
      wasteCategories: [
        ...formData.wasteCategories,
        { type: 'plastic', estimatedWeight: '', description: '' }
      ]
    })
  }

  const removeWasteCategory = (index) => {
    const updatedCategories = formData.wasteCategories.filter((_, i) => i !== index)
    setFormData({ ...formData, wasteCategories: updatedCategories })
  }

  const handleSubmitSchedulePickup = async (e) => {
    e.preventDefault()
    try {
      // Generate coordinates around Hyderabad
      const baseLat = 17.3850
      const baseLng = 78.4867
      const lat = baseLat + (Math.random() - 0.5) * 0.05
      const lng = baseLng + (Math.random() - 0.5) * 0.05

      await api.post('/pickups', {
        ...formData,
        pickupAddress: {
          ...formData.pickupAddress,
          coordinates: { lat, lng }
        }
      })

      toast.success('Pickup scheduled successfully!')
      setShowScheduleForm(false)
      setFormData({
        scheduledDate: '',
        scheduledTimeSlot: 'morning',
        pickupAddress: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          coordinates: { lat: 0, lng: 0 }
        },
        wasteCategories: [{ type: 'plastic', estimatedWeight: '', description: '' }],
        notes: ''
      })
      fetchDashboardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error scheduling pickup')
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

  const getOpportunityStatusLabel = (status) => {
    const labels = {
      pending_review: 'Pending Review',
      accepted: 'Accepted by NGO',
      assigned: 'Assigned to Volunteer',
      in_progress: 'In Progress',
      completed: 'Completed',
      rejected: 'Rejected',
      cancelled: 'Cancelled'
    }
    return labels[status] || status
  }

  const renderOpportunityTimeline = (status) => {
    const steps = [
      { id: 'pending_review', label: 'Pending Review' },
      { id: 'assigned', label: 'Assigned' },
      { id: 'completed', label: 'Completed' }
    ]

    const isRejected = status === 'rejected'

    return (
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          {steps.map(step => {
            const active =
              (!isRejected && (
                (step.id === 'pending_review' && ['pending_review', 'accepted', 'assigned', 'in_progress', 'completed'].includes(status)) ||
                (step.id === 'assigned' && ['assigned', 'in_progress', 'completed'].includes(status)) ||
                (step.id === 'completed' && status === 'completed')
              )) ||
              (isRejected && step.id === 'pending_review')

            return (
              <div key={step.id} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full mb-1 ${
                    active
                      ? isRejected && step.id === 'pending_review'
                        ? 'bg-red-500'
                        : 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
                <span className="text-[10px] text-center">{step.label}</span>
              </div>
            )
          })}
        </div>
        <div className="w-full h-1 rounded-full bg-gray-200">
          <div
            className={`h-1 rounded-full ${
              status === 'completed' ? 'bg-green-500'
              : status === 'rejected' ? 'bg-red-500'
              : 'bg-green-400'
            }`}
            style={{
              width:
                status === 'completed'
                  ? '100%'
                  : status === 'assigned' || status === 'in_progress'
                  ? '66%'
                  : '33%'
            }}
          />
        </div>
      </div>
    )
  }

  const wasteCategories = [
    { name: 'Plastic', icon: Droplet, weight: stats?.plasticWeight || 0, color: 'text-blue-600' },
    { name: 'Organic', icon: Leaf, weight: stats?.organicWeight || 0, color: 'text-green-600' },
    { name: 'E-Waste', icon: Monitor, weight: stats?.ewasteWeight || 0, color: 'text-purple-600' },
    { name: 'Paper', icon: FileText, weight: stats?.paperWeight || 0, color: 'text-yellow-600' },
    { name: 'Glass', icon: Wine, weight: stats?.glassWeight || 0, color: 'text-cyan-600' },
    { name: 'Metal', icon: Package2, weight: stats?.metalWeight || 0, color: 'text-gray-600' }
  ]

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
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-green-100">Track your waste management and make a positive impact on the environment.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Pickups</p>
              <p className="text-3xl font-bold mt-1">{stats?.totalPickups || 0}</p>
            </div>
            <Package className="w-12 h-12 text-blue-200 opacity-80" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Weight</p>
              <p className="text-3xl font-bold mt-1">{stats?.totalWeight?.toFixed(1) || 0}kg</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-200 opacity-80" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Pending Pickups</p>
              <p className="text-3xl font-bold mt-1">{myPickups.filter(p => p.status === 'scheduled').length}</p>
            </div>
            <Clock className="w-12 h-12 text-purple-200 opacity-80" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Messages</p>
              <p className="text-3xl font-bold mt-1">{conversations.filter(c => c.unreadCount > 0).length}</p>
            </div>
            <MessageCircle className="w-12 h-12 text-orange-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setShowScheduleForm(!showScheduleForm)}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
        >
          <Plus size={20} />
          Schedule New Pickup
        </button>
        <button
          onClick={() => navigate('/messages')}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          <MessageCircle size={20} />
          View Messages ({conversations.length})
        </button>
      </div>

      {/* Schedule Pickup Form */}
      {showScheduleForm && (
        <div className="card border-2 border-green-200 bg-green-50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Schedule a Pickup</h2>
            <button onClick={() => setShowScheduleForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmitSchedulePickup} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                <input
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
                <select
                  name="scheduledTimeSlot"
                  value={formData.scheduledTimeSlot}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="morning">Morning (6 AM - 12 PM)</option>
                  <option value="afternoon">Afternoon (12 PM - 6 PM)</option>
                  <option value="evening">Evening (6 PM - 10 PM)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">Pickup Location</h3>
              <input
                type="text"
                name="pickupAddress.street"
                placeholder="Street Address"
                value={formData.pickupAddress.street}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="pickupAddress.city"
                  placeholder="City"
                  value={formData.pickupAddress.city}
                  onChange={handleInputChange}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="text"
                  name="pickupAddress.state"
                  placeholder="State"
                  value={formData.pickupAddress.state}
                  onChange={handleInputChange}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <input
                type="text"
                name="pickupAddress.zipCode"
                placeholder="Zip Code"
                value={formData.pickupAddress.zipCode}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">Waste Categories</h3>
              {formData.wasteCategories.map((category, index) => (
                <div key={index} className="flex gap-2 items-end bg-white p-3 rounded-lg">
                  <select
                    value={category.type}
                    onChange={(e) => handleWasteCategoryChange(index, 'type', e.target.value)}
                    className="px-2 py-2 border border-gray-300 rounded flex-1 focus:ring-2 focus:ring-green-500"
                  >
                    {wasteTypes.map(type => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Weight (kg)"
                    value={category.estimatedWeight}
                    onChange={(e) => handleWasteCategoryChange(index, 'estimatedWeight', e.target.value)}
                    className="px-2 py-2 border border-gray-300 rounded w-32 focus:ring-2 focus:ring-green-500"
                  />
                  {formData.wasteCategories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWasteCategory(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addWasteCategory}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 mt-2"
              >
                + Add Waste Type
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <textarea
                name="notes"
                placeholder="Any special instructions or notes..."
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
            >
              Schedule Pickup
            </button>
          </form>
        </div>
      )}

      {/* My Pickups Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">My Pickups</h2>
        {myPickups.length === 0 ? (
          <div className="card text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No pickups scheduled yet</p>
            <button
              onClick={() => setShowScheduleForm(true)}
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Schedule Your First Pickup
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {myPickups.map(pickup => (
              <div
                key={pickup._id}
                className="card border-l-4 border-green-600 hover:shadow-lg transition-shadow"
              >
                <div
                  onClick={() => setExpandedPickup(expandedPickup === pickup._id ? null : pickup._id)}
                  className="flex items-start justify-between cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(pickup.status)}`}>
                        {pickup.status.charAt(0).toUpperCase() + pickup.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(pickup.scheduledDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                      <div className="text-sm">
                        <p className="text-gray-600">Waste Types</p>
                        <p className="font-semibold">{pickup.wasteCategories.map(w => w.type).join(', ')}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-600">Total Weight</p>
                        <p className="font-semibold">{pickup.wasteCategories.reduce((sum, w) => sum + (Number(w.estimatedWeight) || 0), 0)} kg</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-600">Time Slot</p>
                        <p className="font-semibold capitalize">{pickup.scheduledTimeSlot}</p>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin size={14} />
                      {pickup.pickupAddress.street}, {pickup.pickupAddress.city}
                    </div>

                    {pickup.agentId && (
                      <div className="mt-2 p-2 bg-purple-50 rounded flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-600" />
                        <div>
                          <p className="text-xs text-gray-600">Assigned Agent</p>
                          <p className="font-semibold text-sm">{pickup.agentId.name} - {pickup.agentId.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {pickup.agentId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate('/messages')
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Message agent"
                      >
                        <MessageCircle size={20} />
                      </button>
                    )}
                    {expandedPickup === pickup._id ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>

                {expandedPickup === pickup._id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    <h4 className="font-semibold text-gray-800">Waste Details</h4>
                    {pickup.wasteCategories.map((waste, idx) => (
                      <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                        <p><span className="font-semibold">{waste.type.toUpperCase()}:</span> {waste.estimatedWeight} kg</p>
                        {waste.description && <p className="text-gray-600 text-xs">{waste.description}</p>}
                      </div>
                    ))}
                    {pickup.notes && (
                      <div className="text-sm bg-gray-50 p-2 rounded">
                        <p className="font-semibold">Notes:</p>
                        <p className="text-gray-600">{pickup.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My pickups on Hyderabad map */}
      <PickupMap mode="user" />

      {/* My Opportunities Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">My Opportunities</h2>
        {myOpportunities.length === 0 ? (
          <div className="card text-center py-10">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">You have not posted any opportunities yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myOpportunities.map((opp) => (
              <div key={opp._id} className="card border-l-4 border-emerald-600">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                        {getOpportunityStatusLabel(opp.status)}
                      </span>
                      {opp.assignedTo?.length > 0 && (
                        <span className="text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded-full">
                          Volunteer: {opp.assignedTo.map(a => a.volunteer?.name).filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900">{opp.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{opp.description}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      {opp.location?.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {opp.location.address}
                        </span>
                      )}
                      {opp.startDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(opp.startDate).toLocaleDateString()} - {new Date(opp.endDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {opp.status === 'rejected' && opp.rejectionReason && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded">
                        Rejection reason: {opp.rejectionReason}
                      </div>
                    )}
                    {renderOpportunityTimeline(opp.status)}
                  </div>
                  <div className="md:ml-4 flex flex-col gap-2 md:min-w-[140px]">
                    <button
                      onClick={() => navigate(`/opportunities/${opp._id}`)}
                      className="px-3 py-2 text-xs bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      View details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My opportunities on Hyderabad map */}
      <OpportunityMap opportunities={myOpportunities} />

      {/* Waste Statistics */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Waste Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {wasteCategories.map(({ name, icon: Icon, weight, color }) => (
            <div key={name} className="card text-center">
              <Icon className={`w-8 h-8 mx-auto mb-2 ${color}`} />
              <p className="text-sm text-gray-600">{name}</p>
              <p className="text-xl font-bold text-gray-800">{weight.toFixed(1)}</p>
              <p className="text-xs text-gray-500">kg</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default UserDashboard
