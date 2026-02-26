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
  AlertCircle,
  Edit,
  Trash2
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
      fetchOpportunity();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error applying');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) return;

    try {
      await api.delete(`/opportunities/${id}`);
      toast.success('Opportunity deleted successfully');
      navigate('/opportunities');
    } catch (error) {
      toast.error('Error deleting opportunity');
    }
  };

  const handleVolunteerAction = async (volunteerId, status) => {
    try {
      await api.put(`/opportunities/${id}/volunteers/${volunteerId}`, { status });
      toast.success(`Volunteer ${status} successfully`);
      fetchOpportunity();
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

  const isOwner =
    user?.role === 'user' &&
    (opportunity?.createdBy?._id === user._id ||
     opportunity?.createdBy === user._id);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
      </div>
    );
  }

  if (!opportunity) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Back Button */}
      <button
        onClick={() => navigate('/opportunities')}
        className="flex items-center gap-2 text-gray-700 hover:text-green-600"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Opportunities
      </button>

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold mb-4">{opportunity.title}</h1>
        <p className="text-gray-600 mb-6">{opportunity.description}</p>

        {/* Info Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-green-600" />
            {formatDate(opportunity.startDate)} - {formatDate(opportunity.endDate)}
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-green-600" />
            {opportunity.duration}
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-green-600" />
            {opportunity.location?.address}
          </div>

          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-green-600" />
            {opportunity.availableSpots} / {opportunity.maxVolunteers} spots
          </div>

        </div>

        {/* OWNER CONTROLS */}
        {isOwner && (
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => navigate(`/opportunities/edit/${id}`)}
              className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>

            <button
              onClick={handleDelete}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}

        {/* APPLY SECTION */}
        {user?.role === 'user' && !isOwner && (
          <div className="mt-6">
            {hasUserApplied() ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p>
                  Your application is{' '}
                  <span className="font-semibold">{getUserApplicationStatus()}</span>
                </p>
              </div>
            ) : (
              <button
                onClick={handleApply}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
              >
                Apply Now
              </button>
            )}
          </div>
        )}

        {/* ADMIN VOLUNTEER MANAGEMENT */}
        {user?.role === 'admin' && opportunity.currentVolunteers?.length > 0 && (
          <div className="border-t pt-6 mt-6">
            <h2 className="text-2xl font-semibold mb-4">Volunteer Applications</h2>

            <div className="space-y-4">
              {opportunity.currentVolunteers.map((volunteer) => (
                <div
                  key={volunteer._id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{volunteer.user?.name}</p>
                    <p className="text-sm text-gray-600">{volunteer.user?.email}</p>
                  </div>

                  <div className="flex gap-2">
                    {volunteer.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleVolunteerAction(volunteer.user._id, 'approved')}
                          className="bg-green-600 text-white px-3 py-1 rounded"
                        >
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          Approve
                        </button>

                        <button
                          onClick={() => handleVolunteerAction(volunteer.user._id, 'rejected')}
                          className="bg-red-600 text-white px-3 py-1 rounded"
                        >
                          <XCircle className="w-4 h-4 inline mr-1" />
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
  );
};

export default OpportunityDetail;