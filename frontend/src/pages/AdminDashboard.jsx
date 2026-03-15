import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Users, Package, Truck, TrendingUp, BarChart3 } from 'lucide-react'
import { LineChart, Line, BarChart as ReBarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats')
      setStats(response.data.stats)
    } catch (error) {
      toast.error('Error loading statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const wasteCategoryData = stats?.wasteByCategoryData?.map(item => ({
    name: item._id,
    count: item.count
  })) || []

  const monthlyData = stats?.monthlyTrends?.map(item => ({
    month: item.label,
    pickups: item.pickups,
    opportunities: item.opportunities,
    volunteerResponses: item.volunteerResponses
  })) || []

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-primary-100">Monitor and manage the WasteZero platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Users</p>
              <p className="text-3xl font-bold mt-1">{stats?.totalUsers || 0}</p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Agents</p>
              <p className="text-3xl font-bold mt-1">{stats?.totalAgents || 0}</p>
            </div>
            <Truck className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Pickups</p>
              <p className="text-3xl font-bold mt-1">{stats?.totalPickups || 0}</p>
            </div>
            <Package className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Waste Collected</p>
              <p className="text-3xl font-bold mt-1">{stats?.totalWasteCollected?.toFixed(1) || 0} kg</p>
            </div>
            <TrendingUp className="w-12 h-12 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Completed Pickups</h3>
          <p className="text-2xl font-bold text-green-600">{stats?.completedPickups || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Pending Pickups</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats?.pendingPickups || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Active Pickups</h3>
          <p className="text-2xl font-bold text-blue-600">{stats?.activePickups || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Posted Opportunities</h3>
          <p className="text-2xl font-bold text-indigo-600">{stats?.totalOpportunities || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Volunteer Responses</h3>
          <p className="text-2xl font-bold text-rose-600">{stats?.totalVolunteerResponses || 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waste by Category */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Waste by Category</h2>
          {wasteCategoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={wasteCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {wasteCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>

        {/* Monthly Trends */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Monthly Engagement Trends</h2>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pickups" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="opportunities" stroke="#6366f1" strokeWidth={2} />
                <Line type="monotone" dataKey="volunteerResponses" stroke="#f43f5e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/users" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-800">Manage Users</h3>
            <p className="text-sm text-gray-600">View and manage all users</p>
          </a>
          <a href="/agents" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <Truck className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-800">Manage Agents</h3>
            <p className="text-sm text-gray-600">View and verify agents</p>
          </a>
          <a href="/pickups" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <Package className="w-8 h-8 text-purple-600 mb-2" />
            <h3 className="font-semibold text-gray-800">View Pickups</h3>
            <p className="text-sm text-gray-600">Monitor all pickup requests</p>
          </a>
          <a href="/reports" className="p-4 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors">
            <BarChart3 className="w-8 h-8 text-rose-600 mb-2" />
            <h3 className="font-semibold text-gray-800">Engagement Reports</h3>
            <p className="text-sm text-gray-600">View user activity and volunteering trends</p>
          </a>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
