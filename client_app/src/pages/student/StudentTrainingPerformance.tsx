import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Typography,
  Box,
  TableFooter, // Import TableFooter
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#ff9800" }, // Orange
    secondary: { main: "#ff5722" }, // Deep Orange
    success: { main: "#4caf50" }, // Green
    warning: { main: "#f57c00" }, // Warning Orange
  },
});

// --- Interface Updates ---
interface Category {
  category_name: string;
  marks: number;
}

interface TrainingTypeData {
  training_type: string;
  categories: Category[];
  semester: string; // Added semester
  date: string; // Added date
}

interface StudentPerformance {
  uid: string;
  training_performance: TrainingTypeData[];
}

// --- Helper Function for Insights ---
const calculateAverage = (categories: Category[]): number => {
  if (!categories || categories.length === 0) {
    return 0;
  }
  const total = categories.reduce((sum, cat) => sum + cat.marks, 0);
  const average = total / categories.length;
  return parseFloat(average.toFixed(2)); // Round to 2 decimal places
};

const StudentTrainingPerformance: React.FC = () => {
  const [performance, setPerformance] = useState<StudentPerformance | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/student/training-performance/", {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          let errMsg = `Server Error: ${res.status}`;
          try {
            const errData = await res.json();
            errMsg = errData.error || errMsg;
          } catch {}
          throw new Error(errMsg);
        }

        let data: StudentPerformance;
        try {
          data = await res.json();
        } catch {
          throw new Error("Invalid response format from server.");
        }
        console.log("Fetched training performance data:", data);

        // Updated validation to check for the nested array
        if (!data || !data.training_performance) {
          throw new Error("Incomplete data received from the server.");
        }

        setPerformance(data);
      } catch (err: any) {
        let message = "An unexpected error occurred.";
        if (err.name === "TypeError") {
          message = "Network error or server unreachable.";
        } else if (err instanceof Error) {
          message = err.message;
        }

        console.error("Training performance fetch error:", err);
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, []);

  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <Box p={4} bgcolor="#fff3e0" minHeight="100vh">
        <Box
          maxWidth={800}
          mx="auto"
          p={3}
          bgcolor="#ffffff"
          borderRadius={2}
          boxShadow={3}
        >
          <Typography
            variant="h5"
            fontWeight="bold"
            color="primary"
            textAlign="center"
            mb={3}
          >
            Training Performance
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" mt={3}>
              <CircularProgress color="primary" />
            </Box>
          ) : error ? (
            <Typography color="error" textAlign="center" mt={2}>
              {error}
            </Typography>
          ) : !performance ? (
            <Typography textAlign="center" color="textSecondary" mt={2}>
              No data available.
            </Typography>
          ) : performance.training_performance.length === 0 ? (
            <Typography textAlign="center" color="textSecondary" mt={2}>
              No training performance records found.
            </Typography>
          ) : (
            <>
              <Box textAlign="center" mb={3}>
                <Typography variant="h6">
                  UID: <strong>{performance.uid}</strong>
                </Typography>
              </Box>

              {performance.training_performance.map((type, index) => {
                // --- Insight Calculation ---
                const average = calculateAverage(type.categories);
                const averageColor =
                  average >= 75 ? "success.main" : "warning.main";

                return (
                  // --- Replaced Box with Paper for better grouping ---
                  <Paper key={index} sx={{ mb: 4, p: 3 }} elevation={2}>
                    <Typography
                      variant="h6"
                      color="primary"
                      fontWeight="bold"
                      mb={2} // Added more margin
                      textAlign="center"
                      sx={{ textTransform: "uppercase" }}
                    >
                      {type.training_type} Performance
                    </Typography>

                    {/* --- NEW: Insight Summary Box --- */}
                    <Box
                      display="flex"
                      justifyContent="space-around"
                      mb={3}
                      p={2}
                      bgcolor="grey.100"
                      borderRadius={1}
                    >
                      <Box textAlign="center">
                        <Typography variant="caption" color="textSecondary">
                          Semester
                        </Typography>
                        <Typography fontWeight="bold">
                          {type.semester}
                        </Typography>
                      </Box>
                      <Box textAlign="center">
                        <Typography variant="caption" color="textSecondary">
                          Date
                        </Typography>
                        <Typography fontWeight="bold">
                          {formatDate(type.date)}
                        </Typography>
                      </Box>
                      <Box textAlign="center">
                        <Typography variant="caption" color="textSecondary">
                          Average Score
                        </Typography>
                        <Typography fontWeight="bold" color={averageColor}>
                          {average}%
                        </Typography>
                      </Box>
                    </Box>

                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#ff9800" }}>
                            <TableCell
                              sx={{ color: "black", fontWeight: "bold" }}
                            >
                              Category
                            </TableCell>
                            <TableCell
                              sx={{ color: "black", fontWeight: "bold" }}
                              align="center"
                            >
                              Marks
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {type.categories.map((cat, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{cat.category_name}</TableCell>
                              <TableCell align="center">{cat.marks}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        {/* --- NEW: Table Footer for Average --- */}
                        <TableFooter>
                          <TableRow sx={{ backgroundColor: "grey.50" }}>
                            <TableCell sx={{ fontWeight: "bold" }}>
                              Average
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{ fontWeight: "bold", color: averageColor }}
                            >
                              {average}%
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </TableContainer>
                  </Paper>
                );
              })}
            </>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default StudentTrainingPerformance;