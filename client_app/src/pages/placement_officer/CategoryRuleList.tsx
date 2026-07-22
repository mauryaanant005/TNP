import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import { getCookie } from "@/utils";

interface CategoryRule {
  id: number;
  category: string;
  batch: string;
  minimum_academic_attendance: number | null;
  minimum_academic_performance: number | null;
  minimum_training_attendance: number | null;
  minimum_training_performance: number | null;
}

const CategoryRuleList = () => {
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRules = async () => {
      const csrftoken = getCookie("csrftoken");
      try {
        const response = await axios.get("/api/placement_officer/category-rules/list/", {
          headers: { "X-CSRFToken": csrftoken || "" },
          withCredentials: true,
        });
        setRules(response.data);
        setLoading(false);
      } catch (err: any) {
        setError(`Failed to fetch rules: ${err.response?.data?.error || "Unknown error"}`);
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Category Rules</h1>
      {rules.length === 0 ? (
        <p>No category rules found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Category</th>
                <th className="px-4 py-2 border">Batch</th>
                <th className="px-4 py-2 border">Min. Academic Attendance (%)</th>
                <th className="px-4 py-2 border">Min. Academic Performance</th>
                <th className="px-4 py-2 border">Min. Training Attendance (%)</th>
                <th className="px-4 py-2 border">Min. Training Performance</th>
                <th className="px-4 py-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-t">
                  <td className="px-4 py-2 border">{rule.category.replace("Category_", "Category ")}</td>
                  <td className="px-4 py-2 border">{rule.batch}</td>
                  <td className="px-4 py-2 border">{rule.minimum_academic_attendance ?? "-"}</td>
                  <td className="px-4 py-2 border">{rule.minimum_academic_performance ?? "-"}</td>
                  <td className="px-4 py-2 border">{rule.minimum_training_attendance ?? "-"}</td>
                  <td className="px-4 py-2 border">{rule.minimum_training_performance ?? "-"}</td>
                  <td className="px-4 py-2 border">
                    <Link
                      to={`/category-rules/students/${rule.category}/${rule.batch}`}
                      className="text-blue-500 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CategoryRuleList;