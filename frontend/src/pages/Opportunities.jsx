import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  CheckCircle
} from 'lucide-react';

const Opportunities = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'active'
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'waste-collection', label: 'Waste Collection' },
    { value: 'awareness', label: 'Awareness Campaign' },
    { value: 'recycling', label: 'Recycling Program' },
    { value: 'cleanup-drive', label: 'Cleanup Drive' },
    { value: 'education', label: 'Education & Training' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchOpportunities();
  }, [filters, user?.role]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      // Volunteer (agent): only see tasks assigned by NGO
      if (user?.role === 'agent') {
        const response = await api.get('/opportunities/match/recommended');
        setOpportunities(response.data.data || []);
        return;
      }
      // Opportunity poster (user): see only their own opportunities
      if (user?.role === 'user') {
        const response = await api.get('/opportunities/admin/my-opportunities');
        setOpportunities(response.data.data || []);
        return;
      }
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);

      const response = await api.get(`/opportunities?${params.toString()}`);
      setOpportunities(response.data.data || []);
    } catch (error) {
      toast.error('Error loading opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (opportunityId) => {
    try {
      await api.post(`/opportunities/${opportunityId}/complete`);
      toast.success('Marked as completed');
      fetchOpportunities();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error completing opportunity');
    }
  };

  const handleApply = async (opportunityId) => {
    try {
      await api.post(`/opportunities/${opportunityId}/apply`);
      toast.success('Application submitted successfully!');
      fetchOpportunities(); // Refresh the list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error applying for opportunity');
    }
  };

  const handleDelete = async (opportunityId) => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) {
      return;
    }

    try {
      await api.delete(`/opportunities/${opportunityId}`);
      toast.success('Opportunity deleted successfully');
      fetchOpportunities();
    } catch (error) {
      toast.error('Error deleting opportunity');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'waste-collection': 'bg-blue-100 text-blue-800',
      'awareness': 'bg-purple-100 text-purple-800',
      'recycling': 'bg-green-100 text-green-800',
      'cleanup-drive': 'bg-yellow-100 text-yellow-800',
      'education': 'bg-pink-100 text-pink-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending_review': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-emerald-100 text-emerald-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-blue-100 text-blue-800',
      'draft': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const hasUserApplied = (opportunity) => {
    if (!user) return false;
    return opportunity.currentVolunteers?.some(
      v => v.user === user._id || v.user?._id === user._id
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          {user?.role === 'agent' ? 'My Assigned Tasks' : 'Opportunities'}
        </h1>
        {(user?.role === 'admin' || user?.role === 'user') && (
          <button
            onClick={() => navigate('/opportunities/create')}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <Plus className="w-5 h-5" />
            {user?.role === 'user' ? 'Post Opportunity' : 'Create Opportunity'}
          </button>
        )}
      </div>

      {/* Filters - hide for volunteer (they only see assigned) */}
      {user?.role !== 'agent' && (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              <Search className="inline w-4 h-4 mr-1" />
              Search
            </label>
            <input
              type="text"
              placeholder="Search opportunities..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              <Filter className="inline w-4 h-4 mr-1" />
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {user?.role === 'admin' && (
            <div>
              <label className="block text-gray-700 font-medium mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Opportunities List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading opportunities...</p>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No opportunities found</h3>
          <p className="text-gray-600">
            {user?.role === 'admin' 
              ? 'Create your first volunteering opportunity to get started!'
              : user?.role === 'agent'
                ? 'No tasks assigned to you yet. The NGO will assign you opportunities.'
                : 'Check back later for new volunteering opportunities.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opportunity) => (
            <div
              key={opportunity._id}
              className="group bg-white/70 backdrop-blur-md border border-green-100 rounded-2xl shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden"

            >
              {/* Image */}
              {opportunity.imageUrl && (
                <img
                  src={opportunity.imageUrl}
                  alt={opportunity.title}
                  className="w-full h-48 object-cover"
                />
              )}

              <div className="p-6 space-y-4">
                {/* Header */}
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-green-700 transition">

                      {opportunity.title}
                    </h3>
                  </div>
                  
                  <div className="flex gap-2 mb-3">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full shadow-sm ${getCategoryColor(opportunity.category)}`}>

                      {opportunity.category.replace('-', ' ')}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(opportunity.status)}`}>
                      {opportunity.status}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-3">
                    {opportunity.description}
                  </p>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(opportunity.startDate)} - {formatDate(opportunity.endDate)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{opportunity.duration}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">{opportunity.location.address}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>
                      {opportunity.availableSpots} / {opportunity.maxVolunteers} spots available
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
  <div
    className="bg-green-500 h-2 rounded-full transition-all duration-500"
    style={{
      width: `${(opportunity.availableSpots / opportunity.maxVolunteers) * 100}%`
    }}
  ></div>
</div>


                {/* Skills */}
                {opportunity.requiredSkills?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Required Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {opportunity.requiredSkills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {opportunity.requiredSkills.length > 3 && (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          +{opportunity.requiredSkills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t space-y-2">
                  {user?.role === 'admin' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/opportunities/${opportunity._id}`)}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/opportunities/edit/${opportunity._id}`)}
                        className="flex-1 flex items-center justify-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(opportunity._id)}
                        className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : user?.role === 'agent' ? (
                    <div className="space-y-2 text-sm">
                      <p className="text-xs text-gray-500">Assigned by NGO</p>
                      {opportunity.createdBy && (
                        <div className="text-xs text-gray-600">
                          <p className="font-semibold">User: {opportunity.createdBy.name}</p>
                          <p>{opportunity.createdBy.email}</p>
                        </div>
                      )}
                      <button
                        onClick={() => navigate(`/opportunities/${opportunity._id}`)}
                        className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button
                        onClick={() => navigate('/messages', {
                          state: {
                            initialUser: opportunity.createdBy,
                            opportunityId: opportunity._id,
                            opportunity
                          }
                        })}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Message User
                      </button>
                      <button
                        onClick={() => handleComplete(opportunity._id)}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                      >
                        Mark Completed
                      </button>
                    </div>
                  ) : (
                    // Regular users (opportunity posters) just track status and view details
                    <div className="space-y-2">
                      <button
                        onClick={() => navigate(`/opportunities/${opportunity._id}`)}
                        className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Opportunities;
