import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
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
  Package2
} from 'lucide-react'

const UserDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentPickups, setRecentPickups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, pickupsRes] = await Promise.all([
        api.get('/users/stats'),
        api.get('/pickups?limit=5')
      ])
      
      setStats(statsRes.data.stats)
      setRecentPickups(pickupsRes.data.pickups)
    } catch (error) {
      toast.error('Error loading dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const wasteCategories = [
    { name: 'Plastic', icon: Droplet, weight: stats?.plasticWeight || 0, color: 'text-blue-600' },
    { name: 'Organic', icon: Leaf, weight: stats?.organicWeight || 0, color: 'text-green-600' },
    { name: 'E-Waste', icon: Monitor, weight: stats?.ewasteWeight || 0, color: 'text-purple-600' },
    { name: 'Paper', icon: FileText, weight: stats?.paperWeight || 0, color: 'text-yellow-600' },
    { name: 'Glass', icon: Wine, weight: stats?.glassWeight || 0, color: 'text-cyan-600' },
    { name: 'Metal', icon: Package2, weight: stats?.metalWeight || 0, color: 'text-gray-600' }
  ]

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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-primary-100">Track your waste management and make a positive impact on the environment.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Pickups</p>
              <p className="text-3xl font-bold mt-1">{stats?.totalPickups || 0}</p>
            </div>
            <Package className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Weight</p>
              <p className="text-3xl font-bold mt-1">{stats?.totalWeight?.toFixed(1) || 0} kg</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Recycled Items</p>
              <p className="text-3xl font-bold mt-1">{(stats?.totalWeight * 0.8)?.toFixed(1) || 0} kg</p>
            </div>
            <Trash2 className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        <Link to="/schedule-pickup" className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Schedule</p>
              <p className="text-xl font-bold mt-1">New Pickup</p>
            </div>
            <Calendar className="w-12 h-12 text-orange-200" />
          </div>
        </Link>
      </div>

      {/* Waste Categories Breakdown */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Waste by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {wasteCategories.map((category) => (
            <div key={category.name} className="text-center p-4 bg-gray-50 rounded-lg">
              <category.icon className={`w-8 h-8 ${category.color} mx-auto mb-2`} />
              <p className="text-sm text-gray-600">{category.name}</p>
              <p className="text-lg font-bold text-gray-800">{category.weight.toFixed(1)} kg</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Pickups */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Recent Pickups</h2>
          <Link to="/pickups" className="text-primary-600 hover:text-primary-700 font-semibold">
            View All
          </Link>
        </div>

        {recentPickups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-3 text-gray-300" />
            <p>No pickup requests yet</p>
            <Link to="/schedule-pickup" className="btn-primary mt-4 inline-block">
              Schedule Your First Pickup
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentPickups.map((pickup) => (
                  <tr key={pickup._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(pickup.scheduledDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {pickup.wasteCategories.map(c => c.type).join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(pickup.status)}`}>
                        {pickup.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link to={`/pickups/${pickup._id}`} className="text-primary-600 hover:text-primary-900">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserDashboard
