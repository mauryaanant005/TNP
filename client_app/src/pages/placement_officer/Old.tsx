import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./components/old/old.css";
import { data2025 } from "./components/old/Year2025/data";
import { data2024 } from "./components/old/Year2024/data";
import { data2023 } from "./components/old/Year2023/data";
import { data2022 } from "./components/old/Year2022/data";

// Define the data structure type for better type checking
interface PlacementData {
  "Placement Statistics ": string;
  "Total Offers "?: number;
  "Total Single Offers (On Campus)"?: number;
  "Off-Campus Offers"?: number;
  "Students Interested in Placement"?: number;
  "Maximum Salary( INR- LPA)"?: number;
  "Average Salary ( INR- LPA)"?: number;
  "Minimum Salary ( INR- LPA)"?: number;
  "No of Super Dream/Dream"?: number;
  "Students Opted for Higher Studies"?: number;
  "Students Opted for Entrepreneur"?: number;
  "No of Companies Visited"?: number;
}

type YearType = "2022" | "2023" | "2024" | "2025";

function App() {
  const [selectedYear, setSelectedYear] = useState<YearType>("2025");
  const [displayData, setDisplayData] = useState<PlacementData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Map year selection to corresponding data set
  const yearDataMap: Record<YearType, PlacementData[]> = {
    "2025": data2025["2025"],
    "2024": data2024["2024"],
    "2023": data2023["2023"],
    "2022": data2022["2022"],
  };

  // Update data when year changes
  useEffect(() => {
    setError(null); // Clear any previous errors

    const data = yearDataMap[selectedYear];
    if (data && Array.isArray(data) && data.length > 0) {
      setDisplayData(data);
    } else {
      console.error(`No data available for year ${selectedYear}`);
      setError(`No data available for year ${selectedYear}`);
      setDisplayData([]);
    }
  }, [selectedYear]);

  // Show error message if error exists
  if (error) {
    return (
      <div className="dashboard">
        <header className="header">
          <h1>Placement Dashboard - {selectedYear}</h1>
          <div className="year-selector">
            <label htmlFor="year-select">Select Year: </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as YearType)}
              className="year-dropdown"
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>
        </header>
        <div className="error-container">
          <div className="error">{error}</div>
          <p>Please select a different year or check your data files.</p>
        </div>
      </div>
    );
  }

  // Wait for data to be loaded
  if (!displayData || displayData.length === 0) {
    return <div className="loading">Loading data...</div>;
  }

  // Find Total data - check for either 'Total' or 'Total ' (with space)
  let totalData = displayData.find(
    (item) =>
      item["Placement Statistics "] === "Total " ||
      item["Placement Statistics "] === "Total"
  );

  // If no Total entry is found, create a synthetic one by aggregating all entries
  if (!totalData) {
    console.warn(
      `No 'Total' entry found for ${selectedYear}, creating synthetic total`
    );

    // Create a properly initialized total data object with safe default values
    totalData = {
      "Placement Statistics ": "Total ",
      "Students Interested in Placement": 0,
      "Total Single Offers (On Campus)": 0,
      "No of Companies Visited": 0,
      "No of Super Dream/Dream": 0,
      "Average Salary ( INR- LPA)": 0,
      "Maximum Salary( INR- LPA)": 0,
      "Minimum Salary ( INR- LPA)": Infinity, // Start with Infinity for proper min calculation
      "Students Opted for Higher Studies": 0,
      "Students Opted for Entrepreneur": 0,
    };

    // Sum up values from all entries
    displayData.forEach((branch) => {
      // Students Interested in Placement
      if (!totalData) return;
      totalData["Students Interested in Placement"] =
        (totalData["Students Interested in Placement"] || 0) +
        Number(branch["Students Interested in Placement"] || 0);

      // Total Single Offers
      totalData["Total Single Offers (On Campus)"] =
        (totalData["Total Single Offers (On Campus)"] || 0) +
        Number(branch["Total Single Offers (On Campus)"] || 0);

      // Super Dream/Dream Companies
      totalData["No of Super Dream/Dream"] =
        (totalData["No of Super Dream/Dream"] || 0) +
        Number(branch["No of Super Dream/Dream"] || 0);

      // Maximum Salary - take the highest value
      const branchMaxSalary = Number(branch["Maximum Salary( INR- LPA)"] || 0);
      if (branchMaxSalary > (totalData["Maximum Salary( INR- LPA)"] || 0)) {
        totalData["Maximum Salary( INR- LPA)"] = branchMaxSalary;
      }

      // Minimum Salary - take the lowest non-zero value
      const branchMinSalary = Number(branch["Minimum Salary ( INR- LPA)"] || 0);
      if (
        branchMinSalary > 0 &&
        branchMinSalary < (totalData["Minimum Salary ( INR- LPA)"] || Infinity)
      ) {
        totalData["Minimum Salary ( INR- LPA)"] = branchMinSalary;
      }

      // Higher studies and entrepreneurs
      totalData["Students Opted for Higher Studies"] =
        (totalData["Students Opted for Higher Studies"] || 0) +
        Number(branch["Students Opted for Higher Studies"] || 0);

      totalData["Students Opted for Entrepreneur"] =
        (totalData["Students Opted for Entrepreneur"] || 0) +
        Number(branch["Students Opted for Entrepreneur"] || 0);
    });

    // Reset minimum salary if it's still Infinity (no valid minimum found)
    if (totalData["Minimum Salary ( INR- LPA)"] === Infinity) {
      totalData["Minimum Salary ( INR- LPA)"] = 0;
    }

    // Calculate average salary as weighted average
    let totalSalarySum = 0;
    let totalPlacedStudents = 0;

    displayData.forEach((branch) => {
      const placedStudents = Number(
        branch["Total Single Offers (On Campus)"] || 0
      );
      const avgSalary = Number(branch["Average Salary ( INR- LPA)"] || 0);

      if (placedStudents > 0 && avgSalary > 0) {
        totalPlacedStudents += placedStudents;
        totalSalarySum += placedStudents * avgSalary;
      }
    });

    if (totalPlacedStudents > 0) {
      totalData["Average Salary ( INR- LPA)"] =
        totalSalarySum / totalPlacedStudents;
    }

    // Estimate number of companies visited (this will be approximate)
    totalData["No of Companies Visited"] = Math.max(
      ...displayData.map((branch) =>
        Number(branch["No of Companies Visited"] || 0)
      )
    );
  }

  // Filter out the 'Total' entry for branch-specific charts
  const branchData = displayData.filter(
    (item) =>
      item["Placement Statistics "] !== "Total" &&
      item["Placement Statistics "] !== "Total "
  );

  // Data for branch-wise placement statistics
  const branchPlacementData = branchData.map((branch) => ({
    name: branch["Placement Statistics "] || "",
    interested: Number(branch["Students Interested in Placement"] || 0),
    placed: Number(branch["Total Single Offers (On Campus)"] || 0),
  }));

  // Data for pie chart - student distribution
  const studentDistributionData = [
    {
      name: "Higher Studies",
      value: Number(totalData["Students Opted for Higher Studies"] || 0),
    },
    {
      name: "Entrepreneur",
      value: Number(totalData["Students Opted for Entrepreneur"] || 0),
    },
    {
      name: "Placement",
      value: Number(totalData["Students Interested in Placement"] || 0),
    },
  ].filter((item) => item.value > 0); // Filter out zero values to avoid empty slices

  // Data for Super Dream / Dream companies by branch
  const dreamCompanyData = branchData
    .map((branch) => ({
      name: branch["Placement Statistics "] || "",
      count: Number(branch["No of Super Dream/Dream"] || 0),
    }))
    .sort((a, b) => b.count - a.count);

  // Colors for the pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

  // Format percentage for the pie chart
  const RADIAN = Math.PI / 180;

  // Extended interface for label props
  interface LabelProps {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    index: number;
    name?: string;
    value?: number;
    // Add any other properties that recharts might provide
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: LabelProps) => {
    // Protect against undefined values
    if (
      typeof cx !== "number" ||
      typeof cy !== "number" ||
      typeof midAngle !== "number" ||
      typeof percent !== "number" ||
      typeof innerRadius !== "number" ||
      typeof outerRadius !== "number"
    ) {
      return null;
    }

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  // Data for salary comparison
  const salaryComparisonData = branchData
    .map((branch) => ({
      name: branch["Placement Statistics "] || "",
      maximum: Number(branch["Maximum Salary( INR- LPA)"] || 0),
      average: Number(branch["Average Salary ( INR- LPA)"] || 0),
      minimum: Number(branch["Minimum Salary ( INR- LPA)"] || 0),
    }))
    .sort((a, b) => b.average - a.average);

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Placement Dashboard - {selectedYear}</h1>
        <div className="year-selector">
          <label htmlFor="year-select">Select Year: </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value as YearType)}
            className="year-dropdown"
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
        </div>
      </header>

      <div className="stats-highlights">
        <div className="stat-card">
          <h3 className="text-orange-500">Students Placed</h3>
          <p className="stat-value">
            {totalData["Total Single Offers (On Campus)"] || 0}
          </p>
        </div>
        <div className="stat-card">
          <h3 className="text-orange-500">Companies Visited</h3>
          <p className="stat-value">
            {totalData["No of Companies Visited"] || 0}
          </p>
        </div>
        <div className="stat-card">
          <h3 className="text-orange-500">Super Dream/Dream</h3>
          <p className="stat-value">
            {totalData["No of Super Dream/Dream"] || 0}
          </p>
        </div>
        <div className="stat-card">
          <h3 className="text-orange-500">Avg. Salary (LPA)</h3>
          <p className="stat-value">
            ₹{Number(totalData["Average Salary ( INR- LPA)"] || 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-card">
          <h2>Students Admitted vs Placed by Branch ({selectedYear})</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={branchPlacementData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="interested"
                name="Students Admitted for Placement"
                fill="#8884d8"
              />
              <Bar dataKey="placed" name="Students Placed" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Student Distribution ({selectedYear})</h2>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={studentDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {studentDistributionData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, ""]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-card">
          <h2>Super Dream/Dream Companies by Branch ({selectedYear})</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={dreamCompanyData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="count"
                name="Number of Super Dream/Dream Companies"
                fill="#FF8042"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Salary Comparison by Branch (LPA) - {selectedYear}</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={salaryComparisonData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value} LPA`, ""]} />
              <Legend />
              <Bar dataKey="maximum" name="Maximum Salary" fill="#8884d8" />
              <Bar dataKey="average" name="Average Salary" fill="#82ca9d" />
              <Bar dataKey="minimum" name="Minimum Salary" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="data-table-section">
        <h2>Branch-wise Placement Summary for {selectedYear}</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Students Interested</th>
                <th>Students Placed</th>
                <th>Placement %</th>
                <th>Max Salary (LPA)</th>
                <th>Avg Salary (LPA)</th>
              </tr>
            </thead>
            <tbody>
              {branchData.map((branch, index) => {
                const interested = Number(
                  branch["Students Interested in Placement"] || 0
                );
                const placed = Number(
                  branch["Total Single Offers (On Campus)"] || 0
                );
                const placementPercent =
                  interested > 0 ? (placed / interested) * 100 : 0;

                return (
                  <tr key={index}>
                    <td>{branch["Placement Statistics "]}</td>
                    <td>{interested}</td>
                    <td>{placed}</td>
                    <td>{placementPercent.toFixed(2)}%</td>
                    <td>
                      ₹
                      {Number(branch["Maximum Salary( INR- LPA)"] || 0).toFixed(
                        2
                      )}
                    </td>
                    <td>
                      ₹
                      {Number(
                        branch["Average Salary ( INR- LPA)"] || 0
                      ).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
