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
    primary: { main: "#4169e1" }, // Orange
    secondary: { main: "#4169e1" }, // Deep Orange
    success: { main: "#4caf50" }, // Green
    warning: { main: "#4169e1" }, // Warning Orange
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

  useEffect(() => {
    const fetchPerformance = async () => {
      setLoading(true);

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
        
        if (!data || !data.training_performance || data.training_performance.length === 0) {
          throw new Error("EmptyData");
        }
        (data as any).isDummy = false;
        setPerformance(data);
      } catch (err: any) {
        console.error("Training performance fetch error:", err);
        
        // Dummy data injection
        const dummyPerformance: StudentPerformance = {
          uid: "DUMMY-2026-001",
          training_performance: [
            {
              training_type: "Aptitude",
              semester: "Sem 5",
              date: "2026-08-01",
              categories: [
                { category_name: "Quantitative", marks: 85 },
                { category_name: "Logical Reasoning", marks: 90 },
                { category_name: "Verbal", marks: 80 }
              ]
            },
            {
              training_type: "Technical",
              semester: "Sem 5",
              date: "2026-08-10",
              categories: [
                { category_name: "Python", marks: 95 },
                { category_name: "DBMS", marks: 88 },
                { category_name: "Data Structures", marks: 82 }
              ]
            }
          ]
        };
        (dummyPerformance as any).isDummy = true;
        setPerformance(dummyPerformance);
        toast.error("No training performance records found. Displaying sample data.");
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
      <Box p={4} bgcolor="#f0f4ff" minHeight="100vh">
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

          {(performance as any)?.isDummy && (
            <div className="mb-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-sm" role="alert">
              <p className="font-bold">Displaying Sample Data</p>
              <p>You have no training performance records yet. Showing fallback content for demonstration.</p>
            </div>
          )}
          {loading ? (
            <Box display="flex" justifyContent="center" mt={3}>
              <CircularProgress color="primary" />
            </Box>
          ) : !performance || performance.training_performance.length === 0 ? (
            <Typography textAlign="center" color="textSecondary" mt={2}>
              No data available.
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
                          <TableRow sx={{ backgroundColor: "#4169e1" }}>
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