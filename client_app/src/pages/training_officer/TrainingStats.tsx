/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";

interface ProgramData {
  Year: number;
  Branch_Div: string;
  Program_name: string;
  avg_attendance: number;
  avg_performance: number;
  [key: string]: string | number;
}
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
const TrainingStats = () => {
  const [avgData, setAvgData] = useState<ProgramData[]>([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branchDiv, setBranchDiv] = useState<string[]>([]); // Holds selected branch/division
  const [year, setYear] = useState<number[]>([]); // Holds selected years
  const [programName, setProgramName] = useState<string[]>([]); // Holds selected program names
  const [uniqueYears, setUniqueYears] = useState<number[]>([]); // Holds unique years
  const [uniqueBranchDiv, setUniqueBranchDiv] = useState<string[]>([]); // Holds unique branch/division
  const [uniqueProgramNames, setUniqueProgramNames] = useState<string[]>([]); // Holds unique program names
  const [filterType, setFilterType] = useState(["avg_attendance"]); // Default to average attendance
  useEffect(() => {
    fetch("/api/training_officer/get-avg-data/program1/")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setAvgData(data);
        const uniqueYears = [
          ...new Set(data.map((item: ProgramData) => item.Year)),
        ] as number[];
        setUniqueYears(uniqueYears);

        const uniqueBranchDiv = [
          ...new Set(data.map((item: ProgramData) => item.Branch_Div)),
        ] as string[];
        setUniqueBranchDiv(uniqueBranchDiv);

        const uniqueProgramNames = [
          ...new Set(data.map((item: ProgramData) => item.Program_name)),
        ];
        // @ts-expect-error: Argument of type 'string[]' is not assignable to parameter of type 'Set<string>'
        setUniqueProgramNames(uniqueProgramNames);

        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  const handleBranchDivChange = (event: any) => {
    setBranchDiv(event.target.value);
  };

  const handleYearChange = (event: any) => {
    setYear(event.target.value);
  };
  const handleProgramNameChange = (event: any) => {
    setProgramName(event.target.value);
  };

  const handleFilterTypeChange = (event: any) => {
    setFilterType(event.target.value);
  };
  const getDropdownLabel = (type: any) => {
    if (type === "Branch Division") {
      return branchDiv.length === 0 ||
        branchDiv.length === uniqueBranchDiv.length
        ? "All Branch Divisions"
        : branchDiv.join(", ");
    } else if (type === "Year") {
      return year.length === 0 || year.length === uniqueYears.length
        ? "All Years"
        : year.join(", ");
    } else if (type === "Program Name") {
      return programName.length === 0 ||
        programName.length === uniqueProgramNames.length
        ? "All Program Names"
        : programName.join(", ");
    }
  };

  // Filtered data based on selected dropdown values
  const filteredData = avgData.filter(
    (item) =>
      (branchDiv.length === 0 || branchDiv.includes(item.Branch_Div)) &&
      (year.length === 0 || year.includes(item.Year)) &&
      (programName.length === 0 || programName.includes(item.Program_name))
  );

  const chartData = {
    labels: filteredData.map((item) => `${item.Branch_Div} (${item.Year})`),
    datasets: filterType.map((type) => ({
      label:
        type === "avg_attendance"
          ? "Average Attendance (%)"
          : "Average Training Performance",

      data: filteredData.map((item) => item[type]),
      backgroundColor:
        type === "avg_attendance"
          ? "rgba(255, 99, 132, 1)" // Apply the desired color for average attendance
          : "rgba(75, 192, 192, 1)", // Apply the color for average training performance
      borderColor:
        type === "avg_attendance"
          ? "rgba(255, 99, 132, 1)" // Border color same as background for avg_attendance
          : "rgba(75, 192, 192, 1)", // Border color for average training performance
      borderWidth: 2,
    })),
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Average Attendance and Performance by Branch Division",
        color: "#fff", // Title color to make it stand out
        font: { size: 20 },
      },
      tooltip: {
        backgroundColor: "#333",
        titleColor: "white",
        bodyColor: "white",
        callbacks: {
          // Custom tooltip callback
          title: (tooltipItem: Array<{ dataIndex: number }>) => {
            // Return custom title, which can include the Branch/Division and Year
            const item = filteredData[tooltipItem[0].dataIndex];
            return `${item.Branch_Div} (${item.Year})`;
          },
          label: function (context: any) {
            // Customize the body of the tooltip to show Program Name
            const item = filteredData[context.dataIndex];
            const value =
              context.dataset.label === "Average Attendance (%)"
                ? item.avg_attendance
                : item.avg_performance;
            return `${context.dataset.label}: ${value}% - Program: ${item.Program_name}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#fff" }, // White ticks for contrast
        grid: { color: "rgba(255, 255, 255, 0.3)" }, // Light grid color
        title: {
          display: true,
          text: "Branch",
          color: "white",
          font: { size: 16 },
        },
      },
      y: {
        ticks: { color: "#fff" }, // White ticks for contrast
        grid: { color: "rgba(255, 255, 255, 0.3)" }, // Light grid color
        title: {
          display: true,
          text: "Percentage",
          color: "white",
          font: { size: 16 },
        },
      },
    },
  };
  return (
    <Box
      component="section"
      sx={{
        backgroundColor: "white",
        color: "black",
        borderRadius: "20px",
        paddingBottom: "20px",
        height: "auto", // Adjust height
        width: "96%",
      }}
    >
      <Container maxWidth="lg">
        <br />
        <Typography variant="h5" color="textSecondary" align="center" paragraph>
          Average Attendance and Performance by Branch Division
        </Typography>
        <Typography
          variant="body1"
          color="textSecondary"
          align="center"
          paragraph
        >
          This graph shows both the average attendance and performance of each
          branch division.
        </Typography>

        {/* Dropdowns for Filtering */}
        <Box sx={{ marginBottom: "2rem", textAlign: "center" }}>
          <FormControl sx={{ marginRight: "2rem", minWidth: 200 }}>
            <InputLabel>Branch Division</InputLabel>
            <Select
              value={branchDiv}
              onChange={handleBranchDivChange}
              label="Branch Division"
              multiple
              sx={{
                bgcolor: "white",
                "& .MuiSelect-select": { padding: "10px 14px" },
                "& .MuiInputBase-root": { borderRadius: "20px" },
              }}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueBranchDiv.map((branch, index) => (
                <MenuItem key={index} value={branch}>
                  {branch}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ marginRight: "2rem", minWidth: 200 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={year}
              onChange={handleYearChange}
              label="Year"
              multiple
              sx={{
                bgcolor: "white",
                "& .MuiSelect-select": { padding: "10px 14px" },
                "& .MuiInputBase-root": { borderRadius: "20px" },
              }}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueYears.map((uniqueYear, index) => (
                <MenuItem key={index} value={uniqueYear}>
                  {uniqueYear}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* New Dropdown for Program Name */}
          <FormControl sx={{ marginRight: "2rem", minWidth: 200 }}>
            <InputLabel>Program Name</InputLabel>
            <Select
              value={programName}
              onChange={handleProgramNameChange}
              label="Program Name"
              multiple
              sx={{
                bgcolor: "white",
                "& .MuiSelect-select": { padding: "10px 14px" },
                "& .MuiInputBase-root": { borderRadius: "20px" },
              }}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueProgramNames.map((program, index) => (
                <MenuItem key={index} value={program}>
                  {program}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter Type</InputLabel>
            <Select
              value={filterType}
              onChange={handleFilterTypeChange}
              label="Filter Type"
              multiple
              sx={{
                bgcolor: "white",
                "& .MuiSelect-select": { padding: "10px 14px" },
                "& .MuiInputBase-root": { borderRadius: "10px" },
              }}
            >
              <MenuItem value="avg_attendance">Average Attendance</MenuItem>
              <MenuItem value="avg_performance">Average Performance</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Typography variant="h6" color="textSecondary" align="center">
            Loading data...
          </Typography>
        ) : error ? (
          <Typography variant="h6" color="error" align="center">
            Error: {error}
          </Typography>
        ) : filteredData.length > 0 ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={12}>
              <Paper
                sx={{ padding: "1.5rem", bgcolor: "#212121", boxShadow: 4 }}
              >
                <Typography
                  variant="h6"
                  color="white"
                  align="center"
                  gutterBottom
                >
                  {getDropdownLabel("Branch Division")}
                </Typography>
                <Bar data={chartData} options={chartOptions} />
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Typography variant="h6" color="textSecondary" align="center">
            No data available to display.
          </Typography>
        )}
      </Container>
    </Box>
  );
};

export default TrainingStats;
