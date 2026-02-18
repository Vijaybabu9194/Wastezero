import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";

const ManageOpportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const response = await api.get("/opportunities");
      setOpportunities(response.data.data);
    } catch {
      toast.error("Error loading opportunities");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this opportunity?"))
      return;

    try {
      await api.delete(`/opportunities/${id}`);
      toast.success("Deleted successfully");
      fetchOpportunities();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow">
      <h1 className="text-3xl font-bold mb-6 text-green-700">
        Manage Opportunities
      </h1>

      <button
        onClick={() => navigate("/create-opportunity")}
        className="mb-6 bg-green-600 text-white px-5 py-2 rounded-lg"
      >
        + Create New
      </button>

      {opportunities.map((op) => (
        <div
          key={op._id}
          className="flex justify-between items-center border p-4 rounded-lg mb-3"
        >
          <div>
            <h3 className="font-semibold">{op.title}</h3>
            <p className="text-sm text-gray-500">{op.status}</p>
          </div>

          <div className="space-x-3">
            <button
              onClick={() => navigate(`/edit-opportunity/${op._id}`)}
              className="bg-yellow-500 text-white px-3 py-1 rounded"
            >
              Edit
            </button>

            <button
              onClick={() => handleDelete(op._id)}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ManageOpportunities;
