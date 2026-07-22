/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import axios from "axios";
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
import { Typography } from "@mui/material";

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

  // Fetch departments for the dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(
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

  // Fetch and process data for the selected departments
  const fetchChartData = async (departments: any) => {
    try {
      const allData = await Promise.all(
        departments.map((department: any) =>
          axios.get(
            `/api/placement_officer/get_category_data_by_department/${department}`
          )
        )
      );

      const combinedData = allData.map((response, index) => ({
        department: departments[index],
        data: response.data.category,
      }));

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

      setChartData({
        // @ts-expect-error: Chart data type mismatch
        labels: labels,
        datasets: datasets,
      });
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };

  // Handle department selection
  const handleDepartmentChange = (selectedOptions: any) => {
    setSelectedDepartments(selectedOptions);
    if (selectedOptions.length > 0) {
      fetchChartData(selectedOptions.map((option: any) => option.value));
    } else {
      setChartData(null); // Clear chart if no department is selected
    }
  };

  return (
    <div className="main-content">
      <Typography variant="h4" gutterBottom>
        Comparative Category Statistics
      </Typography>
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
