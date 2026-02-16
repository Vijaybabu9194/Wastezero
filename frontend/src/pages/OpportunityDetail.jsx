import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ArrowLeft,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const OpportunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpportunity();
  }, [id]);

  const fetchOpportunity = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/opportunities/${id}`);
      setOpportunity(response.data.data);
    } catch (error) {
      toast.error('Error loading opportunity');
      navigate('/opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      await api.post(`/opportunities/${id}/apply`);
      toast.success('Application submitted successfully!');
      fetchOpportunity(); // Refresh
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error applying for opportunity');
    }
  };

  const handleVolunteerAction = async (volunteerId, status) => {
    try {
      await api.put(`/opportunities/${id}/volunteers/${volunteerId}`, { status });
      toast.success(`Volunteer ${status} successfully`);
      fetchOpportunity(); // Refresh
    } catch (error) {
      toast.error('Error updating volunteer status');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.pending;
  };

  const hasUserApplied = () => {
    if (!user || !opportunity) return false;
    return opportunity.currentVolunteers?.some(
      v => v.user._id === user._id || v.user === user._id
    );
  };

  const getUserApplicationStatus = () => {
    if (!user || !opportunity) return null;
    const volunteer = opportunity.currentVolunteers?.find(
      v => v.user._id === user._id || v.user === user._id
    );
    return volunteer?.status;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading opportunity details...</p>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Opportunity not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/opportunities')}
        className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Opportunities
      </button>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Image */}
        {opportunity.imageUrl && (
          <img
            src={opportunity.imageUrl}
            alt={opportunity.title}
            className="w-full h-64 object-cover"
          />
        )}

        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`text-sm px-3 py-1 rounded-full ${getCategoryColor(opportunity.category)}`}>
                {opportunity.category.replace('-', ' ')}
              </span>
              <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(opportunity.status)}`}>
                {opportunity.status}
              </span>
            </div>

            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              {opportunity.title}
            </h1>

            <p className="text-gray-600 text-lg leading-relaxed">
              {opportunity.description}
            </p>
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Calendar className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-gray-800">Duration</p>
                <p className="text-gray-600">{formatDate(opportunity.startDate)} - {formatDate(opportunity.endDate)}</p>
                <p className="text-sm text-gray-500 mt-1">{opportunity.duration}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-gray-800">Volunteers</p>
                <p className="text-gray-600">
                  {opportunity.availableSpots} of {opportunity.maxVolunteers} spots available
                </p>
                {opportunity.isFull && (
                  <p className="text-sm text-red-600 mt-1">This opportunity is full</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-gray-800">Location</p>
                <p className="text-gray-600">{opportunity.location.address}</p>
                {opportunity.location.city && (
                  <p className="text-sm text-gray-500">{opportunity.location.city}, {opportunity.location.state}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-gray-800">Time Commitment</p>
                <p className="text-gray-600">{opportunity.duration}</p>
              </div>
            </div>
          </div>

          {/* Required Skills */}
          {opportunity.requiredSkills?.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {opportunity.requiredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional Requirements */}
          {opportunity.requirements && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Additional Requirements</h2>
              <p className="text-gray-600 leading-relaxed">{opportunity.requirements}</p>
            </div>
          )}

          {/* Contact Information */}
          {(opportunity.contactEmail || opportunity.contactPhone) && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact Information</h2>
              <div className="space-y-2">
                {opportunity.contactEmail && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-5 h-5" />
                    <a href={`mailto:${opportunity.contactEmail}`} className="hover:text-green-600 transition">
                      {opportunity.contactEmail}
                    </a>
                  </div>
                )}
                {opportunity.contactPhone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-5 h-5" />
                    <a href={`tel:${opportunity.contactPhone}`} className="hover:text-green-600 transition">
                      {opportunity.contactPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Organizer */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Organized By</h2>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-700 font-semibold text-lg">
                  {opportunity.createdBy?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">{opportunity.createdBy?.name}</p>
                <p className="text-sm text-gray-600">{opportunity.createdBy?.email}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons for Regular Users */}
          {user && user.role !== 'admin' && (
            <div className="border-t pt-6">
              {hasUserApplied() ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-900">Application Status</p>
                      <p className="text-blue-700">
                        Your application is <span className={`px-2 py-1 rounded ${getStatusColor(getUserApplicationStatus())}`}>
                          {getUserApplicationStatus()}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : opportunity.isFull ? (
                <button
                  disabled
                  className="w-full bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold cursor-not-allowed"
                >
                  Opportunity Full
                </button>
              ) : opportunity.status === 'active' ? (
                <button
                  onClick={handleApply}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Apply for this Opportunity
                </button>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-yellow-800">This opportunity is currently not accepting applications.</p>
                </div>
              )}
            </div>
          )}

          {/* Volunteer Management for Admins */}
          {user?.role === 'admin' && opportunity.currentVolunteers?.length > 0 && (
            <div className="border-t pt-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Volunteer Applications</h2>
              <div className="space-y-4">
                {opportunity.currentVolunteers.map((volunteer) => (
                  <div
                    key={volunteer._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-700 font-semibold">
                          {volunteer.user?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{volunteer.user?.name}</p>
                        <p className="text-sm text-gray-600">{volunteer.user?.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Applied: {new Date(volunteer.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(volunteer.status)}`}>
                        {volunteer.status}
                      </span>
                      {volunteer.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleVolunteerAction(volunteer.user._id, 'approved')}
                            className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition text-sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleVolunteerAction(volunteer.user._id, 'rejected')}
                            className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition text-sm"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetail;
