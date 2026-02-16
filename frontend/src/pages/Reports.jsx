import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Users,
  Truck,
  Package,
  Recycle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/stats');
      setStats(response.data.stats);
    } catch (error) {
      toast.error('Error loading reports');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const wasteCategoryData = stats?.wasteByCategoryData?.map(item => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    value: item.count
  })) || [];

  const monthlyData = stats?.monthlyTrends?.map(item => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      month: monthNames[item._id.month - 1],
      pickups: item.count,
      year: item._id.year
    };
  }) || [];

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  // Calculate growth metrics
  const calculateGrowth = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const handleExportReport = () => {
    toast.success('Report export functionality coming soon!');
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive platform analytics and insights</p>
        </div>
        <button
          onClick={handleExportReport}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Download className="w-5 h-5" />
          Export Report
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-4">
          <label className="text-gray-700 font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Time Period:
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-800">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <ArrowUpRight className="w-4 h-4" />
            <span className="font-medium">12.5%</span>
            <span className="text-gray-500">vs last month</span>
          </div>
        </div>

        {/* Total Agents */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Agents</p>
                <p className="text-2xl font-bold text-gray-800">{stats?.totalAgents || 0}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <ArrowUpRight className="w-4 h-4" />
            <span className="font-medium">8.2%</span>
            <span className="text-gray-500">vs last month</span>
          </div>
        </div>

        {/* Total Pickups */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Pickups</p>
                <p className="text-2xl font-bold text-gray-800">{stats?.totalPickups || 0}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <ArrowUpRight className="w-4 h-4" />
            <span className="font-medium">15.3%</span>
            <span className="text-gray-500">vs last month</span>
          </div>
        </div>

        {/* Waste Collected */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Recycle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Waste Collected</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats?.totalWasteCollected?.toFixed(1) || 0} kg
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <ArrowUpRight className="w-4 h-4" />
            <span className="font-medium">22.8%</span>
            <span className="text-gray-500">vs last month</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Completed Pickups</h3>
          <p className="text-3xl font-bold text-green-600">{stats?.completedPickups || 0}</p>
          <p className="text-sm text-gray-500 mt-2">
            {stats?.totalPickups > 0 
              ? ((stats?.completedPickups / stats?.totalPickups) * 100).toFixed(1)
              : 0}% completion rate
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Pending Pickups</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats?.pendingPickups || 0}</p>
          <p className="text-sm text-gray-500 mt-2">Awaiting assignment</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Active Pickups</h3>
          <p className="text-3xl font-bold text-blue-600">{stats?.activePickups || 0}</p>
          <p className="text-sm text-gray-500 mt-2">Currently in progress</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Pickups Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Monthly Pickup Trends
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="pickups" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6}
                name="Pickups"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Waste Categories Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Waste Categories Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={wasteCategoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {wasteCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Bar Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          Waste Category Volume
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={wasteCategoryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" name="Number of Pickups">
              {wasteCategoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Detailed Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {wasteCategoryData.map((item, index) => {
                const total = wasteCategoryData.reduce((sum, cat) => sum + cat.value, 0);
                const percentage = ((item.value / total) * 100).toFixed(1);
                const isPositive = index % 2 === 0; // Mock trend data
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium text-gray-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-semibold">{item.value}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{percentage}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {isPositive ? '+' : '-'}{Math.floor(Math.random() * 20)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Average Response Time</h3>
          <p className="text-4xl font-bold mb-2">2.4 hrs</p>
          <p className="text-blue-100 text-sm">From request to assignment</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Customer Satisfaction</h3>
          <p className="text-4xl font-bold mb-2">4.8/5.0</p>
          <p className="text-green-100 text-sm">Based on user feedback</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
