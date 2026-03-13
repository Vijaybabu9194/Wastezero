import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Calendar, MapPin, Trash2 } from 'lucide-react'
import HyderabadMap from '../components/HyderabadMap'

const SchedulePickup = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    scheduledDate: '',
    scheduledTimeSlot: 'morning',
    pickupAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      coordinates: {
        lat: 0,
        lng: 0
      }
    },
    wasteCategories: [
      { type: 'plastic', estimatedWeight: '', description: '' }
    ],
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  const wasteTypes = ['plastic', 'organic', 'e-waste', 'paper', 'glass', 'metal', 'other']

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData({
        ...formData,
        pickupAddress: { ...formData.pickupAddress, [child]: value }
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { coordinates } = formData.pickupAddress
      if (!coordinates || !coordinates.lat || !coordinates.lng) {
        toast.error('Please select a location on the Hyderabad map')
        setLoading(false)
        return
      }

      const pickupData = {
        ...formData,
        pickupAddress: {
          ...formData.pickupAddress,
          coordinates
        },
        wasteCategories: formData.wasteCategories.map(cat => ({
          ...cat,
          estimatedWeight: parseFloat(cat.estimatedWeight)
        }))
      }

      await api.post('/pickups', pickupData)
      toast.success('Pickup scheduled successfully!')
      navigate('/pickups')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error scheduling pickup')
    } finally {
      setLoading(false)
    }
  }

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Schedule Waste Pickup</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Pickup Date
              </label>
              <input
                type="date"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleChange}
                min={today}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Slot
              </label>
              <select
                name="scheduledTimeSlot"
                value={formData.scheduledTimeSlot}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="morning">Morning (8 AM - 12 PM)</option>
                <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                <option value="evening">Evening (4 PM - 8 PM)</option>
              </select>
            </div>
          </div>

          {/* Pickup Address */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Pickup Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  name="pickupAddress.street"
                  value={formData.pickupAddress.street}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Street Address"
                  required
                />
              </div>
              <input
                type="text"
                name="pickupAddress.city"
                value={formData.pickupAddress.city}
                onChange={handleChange}
                className="input-field"
                placeholder="City"
                required
              />
              <input
                type="text"
                name="pickupAddress.state"
                value={formData.pickupAddress.state}
                onChange={handleChange}
                className="input-field"
                placeholder="State"
                required
              />
              <input
                type="text"
                name="pickupAddress.zipCode"
                value={formData.pickupAddress.zipCode}
                onChange={handleChange}
                className="input-field"
                placeholder="ZIP Code"
                required
              />
            </div>

            {/* Hyderabad Map Picker */}
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600">
                Click on the map of Hyderabad to set the exact pickup location.
              </p>
              <HyderabadMap
                marker={formData.pickupAddress.coordinates}
                onSelect={(coords) =>
                  setFormData((prev) => ({
                    ...prev,
                    pickupAddress: {
                      ...prev.pickupAddress,
                      coordinates: coords
                    }
                  }))
                }
              />
            </div>
          </div>

          {/* Waste Categories */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Trash2 className="w-5 h-5 mr-2" />
              Waste Categories
            </h3>
            
            {formData.wasteCategories.map((category, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={category.type}
                      onChange={(e) => handleWasteCategoryChange(index, 'type', e.target.value)}
                      className="input-field"
                      required
                    >
                      {wasteTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={category.estimatedWeight}
                      onChange={(e) => handleWasteCategoryChange(index, 'estimatedWeight', e.target.value)}
                      className="input-field"
                      placeholder="0.0"
                      required
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={category.description}
                      onChange={(e) => handleWasteCategoryChange(index, 'description', e.target.value)}
                      className="input-field"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                {formData.wasteCategories.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeWasteCategory(index)}
                    className="mt-2 text-red-600 hover:text-red-700 text-sm font-semibold"
                  >
                    Remove Category
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addWasteCategory}
              className="btn-secondary w-full"
            >
              + Add Another Category
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="input-field"
              placeholder="Any special instructions or notes for the pickup agent..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Schedule Pickup'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SchedulePickup
