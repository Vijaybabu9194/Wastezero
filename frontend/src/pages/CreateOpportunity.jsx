import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const CreateOpportunity = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requiredSkills: "",
    duration: "",
    location: "",
    startDate: "",
    endDate: "",
    status: "active"
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:5000/api/opportunities/create", {
        title: formData.title,
        description: formData.description,
        requiredSkills: formData.requiredSkills
          ? formData.requiredSkills.split(",").map(skill => skill.trim())
          : [],
        duration: formData.duration,
        location: {
          address: formData.location
        },
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status
      });

      toast.success("Opportunity created successfully!");
      navigate("/opportunities");

    } catch (error) {
      console.error("Create opportunity error:", error.response?.data);
      toast.error(
        error.response?.data?.message || "Error creating opportunity"
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow">
      <h1 className="text-3xl font-bold mb-6 text-green-700">
        Create Opportunity
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          type="text"
          name="title"
          placeholder="Title"
          className="w-full border p-3 rounded-lg"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          className="w-full border p-3 rounded-lg"
          rows="4"
          value={formData.description}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="requiredSkills"
          placeholder="Required Skills (comma separated)"
          className="w-full border p-3 rounded-lg"
          value={formData.requiredSkills}
          onChange={handleChange}
        />

        <input
          type="text"
          name="duration"
          placeholder="Duration"
          className="w-full border p-3 rounded-lg"
          value={formData.duration}
          onChange={handleChange}
        />

        <input
          type="text"
          name="location"
          placeholder="Location"
          className="w-full border p-3 rounded-lg"
          value={formData.location}
          onChange={handleChange}
        />

        {/* NEW START DATE FIELD */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            className="w-full border p-3 rounded-lg"
            value={formData.startDate}
            onChange={handleChange}
            required
          />
        </div>

        {/* NEW END DATE FIELD */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            className="w-full border p-3 rounded-lg"
            value={formData.endDate}
            onChange={handleChange}
            required
          />
        </div>

        <select
          name="status"
          className="w-full border p-3 rounded-lg"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="active">Open</option>
          <option value="closed">Closed</option>
        </select>

        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
        >
          Save Opportunity
        </button>

      </form>
    </div>
  );
};

export default CreateOpportunity;
