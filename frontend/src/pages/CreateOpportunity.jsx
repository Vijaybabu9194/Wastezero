import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";

const CreateOpportunity = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requiredSkills: "",
    duration: "",
    location: "",
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
      await api.post("/opportunities", {
        ...formData,
        requiredSkills: formData.requiredSkills.split(",")
      });

      toast.success("Opportunity created successfully!");
      navigate("/manage-opportunities");
    } catch (error) {
      toast.error("Error creating opportunity");
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
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          className="w-full border p-3 rounded-lg"
          rows="4"
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="requiredSkills"
          placeholder="Required Skills (comma separated)"
          className="w-full border p-3 rounded-lg"
          onChange={handleChange}
        />

        <input
          type="text"
          name="duration"
          placeholder="Duration"
          className="w-full border p-3 rounded-lg"
          onChange={handleChange}
        />

        <input
          type="text"
          name="location"
          placeholder="Location"
          className="w-full border p-3 rounded-lg"
          onChange={handleChange}
        />

        <select
          name="status"
          className="w-full border p-3 rounded-lg"
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
