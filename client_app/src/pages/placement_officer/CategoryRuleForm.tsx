import { useState } from "react";
import axios from "axios";
import { getCookie } from "@/utils";

interface CategoryRuleForm {
  category: string;
  batch: string;
  minimum_academic_attendance: number | null;
  minimum_academic_performance: number | null;
  minimum_training_attendance: number | null;
  minimum_training_performance: number | null;
}

const CategoryRuleForm = () => {
  const [formData, setFormData] = useState<CategoryRuleForm>({
    category: "",
    batch: "",
    minimum_academic_attendance: null,
    minimum_academic_performance: null,
    minimum_training_attendance: null,
    minimum_training_performance: null,
  });

  const categoryOptions = [
    { value: "Category_1", label: "Category 1" },
    { value: "Category_2", label: "Category 2" },
    { value: "Category_3", label: "Category 3" },
    { value: "Category_4", label: "Category 4" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const csrftoken = getCookie("csrftoken");

    try {
      await axios.post("/api/placement_officer/category-rules/create/", formData, {
        headers: { "X-CSRFToken": csrftoken || "" },
        withCredentials: true,
      });
      alert("Category rule created successfully!");
      setFormData({
        category: "",
        batch: "",
        minimum_academic_attendance: null,
        minimum_academic_performance: null,
        minimum_training_attendance: null,
        minimum_training_performance: null,
      });
    } catch (error: any) {
      console.error("Error creating category rule:", error);
      alert(`Failed to create category rule: ${error.response?.data?.error || "Unknown error"}`);
    }
  };

  const handleNumberChange = (field: keyof CategoryRuleForm, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    setFormData({ ...formData, [field]: numValue });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Category</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Category</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2">Batch (e.g., BE_2024)</label>
          <input
            type="text"
            value={formData.batch}
            onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-2">Minimum Academic Attendance (%)</label>
          <input
            type="number"
            step="0.01"
            value={formData.minimum_academic_attendance ?? ""}
            onChange={(e) => handleNumberChange("minimum_academic_attendance", e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">Minimum Academic Performance</label>
          <input
            type="number"
            step="0.01"
            value={formData.minimum_academic_performance ?? ""}
            onChange={(e) => handleNumberChange("minimum_academic_performance", e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">Minimum Training Attendance (%)</label>
          <input
            type="number"
            step="0.01"
            value={formData.minimum_training_attendance ?? ""}
            onChange={(e) => handleNumberChange("minimum_training_attendance", e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">Minimum Training Performance</label>
          <input
            type="number"
            step="0.01"
            value={formData.minimum_training_performance ?? ""}
            onChange={(e) => handleNumberChange("minimum_training_performance", e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Create Category Rule
        </button>
      </form>
    </div>
  );
};

export default CategoryRuleForm;