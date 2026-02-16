import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Calendar, MapPin, Users, Clock, X, Plus } from 'lucide-react';

const ManageOpportunity = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requiredSkills: [],
    duration: '',
    location: {
      address: '',
      city: '',
      state: '',
      coordinates: { lat: 0, lng: 0 }
    },
    startDate: '',
    endDate: '',
    maxVolunteers: 10,
    category: 'other',
    contactEmail: '',
    contactPhone: '',
    imageUrl: '',
    requirements: '',
    status: 'active'
  });

  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'waste-collection', label: 'Waste Collection' },
    { value: 'awareness', label: 'Awareness Campaign' },
    { value: 'recycling', label: 'Recycling Program' },
    { value: 'cleanup-drive', label: 'Cleanup Drive' },
    { value: 'education', label: 'Education & Training' },
    { value: 'other', label: 'Other' }
  ];

  const statuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    if (isEditMode) {
      fetchOpportunity();
    }
  }, [id]);

  const fetchOpportunity = async () => {
    try {
      const response = await api.get(`/opportunities/${id}`);
      const opportunity = response.data.data;
      
      setFormData({
        title: opportunity.title,
        description: opportunity.description,
        requiredSkills: opportunity.requiredSkills || [],
        duration: opportunity.duration,
        location: opportunity.location,
        startDate: new Date(opportunity.startDate).toISOString().split('T')[0],
        endDate: new Date(opportunity.endDate).toISOString().split('T')[0],
        maxVolunteers: opportunity.maxVolunteers,
        category: opportunity.category,
        contactEmail: opportunity.contactEmail || '',
        contactPhone: opportunity.contactPhone || '',
        imageUrl: opportunity.imageUrl || '',
        requirements: opportunity.requirements || '',
        status: opportunity.status
      });
    } catch (error) {
      toast.error('Error loading opportunity');
      navigate('/opportunities');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        location: { ...formData.location, [child]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.requiredSkills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        requiredSkills: [...formData.requiredSkills, skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      requiredSkills: formData.requiredSkills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic validation
      if (!formData.title || !formData.description || !formData.duration) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        toast.error('End date must be after start date');
        setLoading(false);
        return;
      }

      // Simple geocoding - in production, use a real geocoding service
      const lat = 40.7128 + Math.random() * 0.1;
      const lng = -74.0060 + Math.random() * 0.1;

      const opportunityData = {
        ...formData,
        location: {
          ...formData.location,
          coordinates: { lat, lng }
        }
      };

      if (isEditMode) {
        await api.put(`/opportunities/${id}`, opportunityData);
        toast.success('Opportunity updated successfully!');
      } else {
        await api.post('/opportunities/create', opportunityData);
        toast.success('Opportunity created successfully!');
      }
      
      navigate('/opportunities');
    } catch (error) {
      toast.error(error.response?.data?.message || `Error ${isEditMode ? 'updating' : 'creating'} opportunity`);
    } finally {
      setLoading(false);
    }
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          {isEditMode ? 'Edit Opportunity' : 'Create Volunteering Opportunity'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Basic Information</h2>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Community Beach Cleanup Drive"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Provide a detailed description of the volunteering opportunity..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Duration <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., 4 hours, Full day, 2 weeks"
              />
            </div>
          </div>

          {/* Skills and Requirements */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Skills & Requirements</h2>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Required Skills</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Add a skill and press Enter"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.requiredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-green-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Additional Requirements</label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Any other requirements or guidelines for volunteers..."
              />
            </div>
          </div>

          {/* Schedule and Capacity */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Schedule & Capacity</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={today}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate || today}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                <Users className="inline w-4 h-4 mr-1" />
                Maximum Volunteers <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="maxVolunteers"
                value={formData.maxVolunteers}
                onChange={handleChange}
                min="1"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Location</h2>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location.address"
                value={formData.location.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">City</label>
                <input
                  type="text"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">State</label>
                <input
                  type="text"
                  name="location.state"
                  value={formData.location.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Contact Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Contact Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Contact Phone</label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
          </div>

          {/* Optional Image */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Image URL (Optional)</label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Opportunity' : 'Create Opportunity')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/opportunities')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageOpportunity;
