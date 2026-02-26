import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  Calendar,
  MapPin,
  Users,
  Plus,
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

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/opportunities');
      setOpportunities(response.data.data);
    } catch (error) {
      toast.error('Error loading opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (opportunityId) => {
    try {
      await api.post(`/opportunities/${opportunityId}/apply`);
      toast.success('Application submitted successfully!');
      fetchOpportunities();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error applying');
    }
  };

  const handleDelete = async (opportunityId) => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) return;

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

  const hasUserApplied = (opportunity) => {
    if (!user) return false;
    return opportunity.currentVolunteers?.some(
      v =>
        v.user?._id?.toString() === user._id?.toString() ||
        v.user?.toString() === user._id?.toString()
    );
  };

  const isOwner = (opportunity) => {
    if (!user) return false;

    return (
      opportunity.createdBy?._id?.toString() === user._id?.toString() ||
      opportunity.createdBy?.toString() === user._id?.toString()
    );
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Opportunities</h1>

        {/* Create Button (User Only) */}
        {user?.role === 'user' && (
          <button
            onClick={() => navigate('/opportunities/create')}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <Plus className="w-5 h-5" />
            Create Opportunity
          </button>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading opportunities...</p>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No opportunities found
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {opportunities.map((opportunity) => (
            <div
              key={opportunity._id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {opportunity.title}
              </h3>

              <p className="text-gray-600 text-sm line-clamp-2">
                {opportunity.description}
              </p>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(opportunity.startDate)} - {formatDate(opportunity.endDate)}
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {opportunity.location?.address}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-2">

                {/* Owner → Edit/Delete */}
                {user?.role === 'user' && isOwner(opportunity) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/opportunities/edit/${opportunity._id}`)}
                      className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600"
                    >
                      <Edit className="w-4 h-4 inline mr-1" />
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(opportunity._id)}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 inline mr-1" />
                      Delete
                    </button>
                  </div>
                )}

                {/* Not Owner → Apply */}
                {user?.role === 'agent' && !isOwner(opportunity) && (
                  <>
                    {hasUserApplied(opportunity) ? (
                      <button
                        disabled
                        className="w-full bg-green-100 text-green-700 py-2 rounded-lg"
                      >
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Applied
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApply(opportunity._id)}
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                      >
                        Apply Now
                      </button>
                    )}
                  </>
                )}

                {/* View Details */}
                <button
                  onClick={() => navigate(`/opportunities/${opportunity._id}`)}
                  className="w-full border py-2 rounded-lg hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  View Details
                </button>

              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
};

export default Opportunities;