import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Truck, 
  Search, 
  Filter, 
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Activity
} from 'lucide-react';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    verified: '',
    status: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchAgents();
  }, [filters]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.verified) params.append('verified', filters.verified);
      if (filters.status) params.append('status', filters.status);
      params.append('page', filters.page);
      params.append('limit', filters.limit);

      const response = await api.get(`/admin/agents?${params.toString()}`);
      setAgents(response.data.agents);
      setPagination({
        total: response.data.total,
        pages: response.data.pages
      });
    } catch (error) {
      toast.error('Error loading agents');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAgent = async (agentId) => {
    try {
      await api.put(`/admin/agents/${agentId}/verify`);
      toast.success('Agent verified successfully');
      fetchAgents();
    } catch (error) {
      toast.error('Error verifying agent');
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      'available': 'bg-green-100 text-green-800',
      'busy': 'bg-yellow-100 text-yellow-800',
      'offline': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.offline;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Agents Management</h1>
          <p className="text-gray-600 mt-1">Manage and monitor collection agents</p>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg">
          <Truck className="w-5 h-5" />
          <div>
            <p className="text-xs text-green-100">Total Agents</p>
            <p className="text-xl font-bold">{pagination.total}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              <Filter className="inline w-4 h-4 mr-1" />
              Verification Status
            </label>
            <select
              value={filters.verified}
              onChange={(e) => setFilters({ ...filters, verified: e.target.value, page: 1 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              <Activity className="inline w-4 h-4 mr-1" />
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Items per page
            </label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value), page: 1 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agents Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading agents...</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No agents found</h3>
          <p className="text-gray-600">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coverage Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agents.map((agent) => (
                  <tr key={agent._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                          <Truck className="w-5 h-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {agent.userId?.name || agent.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {agent.userId?.email || agent.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {agent.userId?.phone || agent.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900 font-medium">
                          {agent.vehicleType || 'N/A'}
                        </div>
                        <div className="text-gray-500">
                          {agent.vehicleNumber || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="max-w-xs truncate">
                          {agent.serviceArea?.join(', ') || 'Not specified'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(agent.status)}`}>
                        {agent.status || 'offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {agent.isVerified ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">Verified</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span className="text-xs">Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(agent.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!agent.isVerified && (
                        <button
                          onClick={() => handleVerifyAgent(agent._id)}
                          className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition flex items-center gap-1"
                        >
                          <Award className="w-3 h-3" />
                          Verify
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{filters.page}</span> of{' '}
                    <span className="font-medium">{pagination.pages}</span> ({pagination.total} total agents)
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                      disabled={filters.page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-md"
                    >
                      Previous
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      {filters.page}
                    </span>
                    <button
                      onClick={() => setFilters({ ...filters, page: Math.min(pagination.pages, filters.page + 1) })}
                      disabled={filters.page === pagination.pages}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-md"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Agents;
