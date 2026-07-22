import { useState } from "react";
import { getCookie } from "@/utils";
const BatchCategorizer = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    batch: "",
    cgpa: "",
    academic_attendance: "",
    training_attendance: "",
    training_performance: "",
    category: "Category 1", // Default
  });

  const categoryOptions = [
    "Category 1",
    "Category 2",
    "Category 3",
    "No category",
  ];

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/staff/category_update/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken") || "",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Success! Updated ${data.students_updated} students.`);
      } else {
        setMessage(`Error: ${data.error || "Something went wrong"}`);
      }
    } catch (error) {
      setMessage("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Filter & Categorize Students
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Batch Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Select Batch
          </label>
          <input
            type="text"
            name="batch"
            value={formData.batch}
            onChange={handleChange}
            placeholder="Enter Batch Year"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Threshold Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Min Training Attendance (%)
            </label>
            <input
              type="number"
              name="training_attendance"
              value={formData.training_attendance}
              onChange={handleChange}
              step="0.1"
              min="0"
              max="100"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Min Training Performance (Avg Marks)
            </label>
            <input
              type="number"
              name="training_performance"
              value={formData.training_performance}
              onChange={handleChange}
              step="0.1"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Min CGPA
            </label>
            <input
              type="number"
              name="cgpa"
              value={formData.cgpa}
              onChange={handleChange}
              step="0.01"
              min="0"
              max="10"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Min Academic Attendance (%)
            </label>
            <input
              type="number"
              name="academic_attendance"
              value={formData.academic_attendance}
              onChange={handleChange}
              step="0.1"
              min="0"
              max="100"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
        </div>

        {/* Target Category Selection */}
        <div className="pt-4 border-t">
          <label className="block text-sm font-medium text-gray-700">
            Assign to Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-blue-300 bg-blue-50 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            {categoryOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
            ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            }`}
        >
          {loading ? "Processing..." : "Update Students"}
        </button>

        {/* Feedback Message */}
        {message && (
          <div
            className={`mt-4 p-3 rounded text-sm ${
              message.includes("Success")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default BatchCategorizer;
