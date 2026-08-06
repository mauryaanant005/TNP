/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, startTransition } from "react";
import { api } from "@/lib/api";
import { ErrorBanner } from "./ErrorBanner";
import Select from "react-select";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Typography, Chip } from "@mui/material";
import { sampleCategoryData } from "./fallbackData";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const colors = [
  "rgba(75, 192, 192, 1)",
  "rgba(153, 102, 255, 1)",
  "rgba(255, 159, 64, 1)",
  "rgba(255, 99, 132, 1)",
  "rgba(54, 162, 235, 1)",
  "rgba(255, 206, 86, 1)",
];

const borderColors = [
  "rgba(75, 192, 192, 1)",
  "rgba(153, 102, 255, 1)",
  "rgba(255, 159, 64, 1)",
  "rgba(255, 99, 132, 1)",
  "rgba(54, 162, 235, 1)",
  "rgba(255, 206, 86, 1)",
];

export const CategoryDataStatistics = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [isSampleData, setIsSampleData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  // Fetch departments for the dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get(
          "/api/placement_officer/unique-departments/"
        );
        const formattedDepartments = response.data.unique_departments.map(
          (dept: any) => ({ label: dept, value: dept })
        );
        setDepartments(formattedDepartments);
      } catch (error) {
        console.error("Error fetching unique departments:", error);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch and process data for the selected departments. A request-id guard
  // discards a response that resolves after a newer selection has already
  // started fetching (e.g. rapidly toggling departments), and
  // Promise.allSettled means one department's request failing doesn't wipe
  // out the chart for every other already-successful department.
  const fetchChartData = async (departments: any) => {
    const requestId = ++requestIdRef.current;
    setError(null);
    try {
      const results = await Promise.allSettled(
        departments.map((department: any) =>
          api.get(
            `/api/placement_officer/get_category_data_by_department/${encodeURIComponent(department)}`
          )
        )
      );
      if (requestId !== requestIdRef.current) return;

      let anySampleData = false;
      let anyFailure = false;
      const combinedData = results.map((result, index) => {
        let categoryData;
        if (result.status === "fulfilled") {
          categoryData = result.value.data.category;
        } else {
          anyFailure = true;
          categoryData = null;
        }
        if (!categoryData || categoryData.length === 0) {
          categoryData = sampleCategoryData;
          anySampleData = true;
        }
        return {
          department: departments[index],
          data: categoryData,
        };
      });
      setIsSampleData(anySampleData);
      if (anyFailure) {
        setError("Some departments could not be loaded and are showing sample data.");
      }

      // Transform data for Chart.js
      const labels = [
        ...new Set(
          combinedData.flatMap((item) =>
            item.data.map((d: any) => d.current_category)
          )
        ),
      ];
      const datasets = combinedData.map((item, index) => ({
        label: item.department,
        data: labels.map(
          (label) =>
            item.data.find((d: any) => d.current_category === label)?.count || 0
        ),
        backgroundColor: colors[index % colors.length],
        borderColor: borderColors[index % borderColors.length],
        borderWidth: 1,
      }));

      startTransition(() => {
        setChartData({
          // @ts-expect-error: Chart data type mismatch
          labels: labels,
          datasets: datasets,
        });
      });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error("Error fetching chart data:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    }
  };

  // Handle department selection
  const handleDepartmentChange = (selectedOptions: any) => {
    setSelectedDepartments(selectedOptions);
    if (selectedOptions.length > 0) {
      fetchChartData(selectedOptions.map((option: any) => option.value));
    } else {
      requestIdRef.current++; // invalidate any still-in-flight request
      setError(null);
      startTransition(() => {
        setChartData(null); // Clear chart if no department is selected
      });
    }
  };

  const retry = () => {
    if (selectedDepartments.length > 0) {
      fetchChartData(selectedDepartments.map((option: any) => (option as any).value));
    }
  };

  return (
    <div className="main-content">
      <div className="flex items-center gap-4 mb-4">
        <Typography variant="h4" gutterBottom style={{ margin: 0 }}>
          Comparative Category Statistics
        </Typography>
        {isSampleData && chartData && (
          <Chip label="Viewing Sample Data" color="warning" size="small" variant="outlined" />
        )}
      </div>
      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} onRetry={retry} />
        </div>
      )}
      <Select
        isMulti
        options={departments}
        value={selectedDepartments}
        onChange={handleDepartmentChange}
        closeMenuOnSelect={false}
        placeholder="Select departments..."
        styles={{
          control: (base) => ({ ...base, borderColor: "gray" }),
          option: (base, state) => ({
            ...base,
            color: state.isSelected ? "white" : "black",
            backgroundColor: state.isSelected ? "blue" : "white",
          }),
        }}
      />
      <div style={{ marginTop: "20px", height: "500px" }}>
        {" "}
        {/* Chart container */}
        {chartData ? (
          <Bar
            data={chartData}
            height={400} // Adjust the chart height
            options={{
              responsive: true,
              maintainAspectRatio: false, // Allows height customization
              plugins: {
                legend: {
                  position: "top",
                  labels: {
                    color: "white", // Set legend text color to white
                  },
                },
                title: {
                  display: true,
                  text: "Category Data by Department",
                  color: "white", // Set title text color to white
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: "Categories",
                    color: "white", // Set x-axis title color to white
                  },
                  ticks: {
                    color: "white", // Set x-axis tick labels color to white
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: "Count",
                    color: "white", // Set y-axis title color to white
                  },
                  ticks: {
                    color: "white", // Set y-axis tick labels color to white
                  },
                  beginAtZero: true,
                },
              },
            }}
          />
        ) : (
          <p>Please select departments to view data.</p>
        )}
      </div>
    </div>
  );
};
