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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Typography,
  Box,
  Grid,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#ff9800", // Orange theme
    },
    secondary: {
      main: "#ff5722",
    }, 
  },
});

const SessionAttendance: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState("All");
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/student/attendance-data/`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch data");
        }

        const data = await res.json();
        console.log("API Response:", data);

        // Format data correctly
        const formattedData = data.map((entry: any) => {
          const [date, session] = entry.session.split(" - ");

          return {
            date,
            session,
            status: entry.present === "Present" ? "Present" : "Absent",
            remark: entry.late === "Late" ? "Late" : "Not late",
            program_name: entry.program_name,
          };
        });

        setAttendanceData(formattedData);

        const uniquePrograms = Array.from(
          new Set(formattedData.map((entry: any) => entry.program_name))
        );
        setPrograms(uniquePrograms);

        const uniqueSessions = Array.from(
          new Set(formattedData.map((entry: any) => entry.session)) // ✅ Fixed `.map()` typo
        );
        setSessions(uniqueSessions);
      } catch (error: any) {
        console.error("Fetch error:", error);
        setError(error.message);
        toast.error("Failed to fetch attendance data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filtering based on selected program and session
  const filteredData = attendanceData
    .filter((entry) => selectedProgram === "All" || entry.program_name === selectedProgram)
    .filter((entry) => selectedSession === "All" || entry.session === selectedSession);

  return (
    <ThemeProvider theme={theme}>
      <Box p={4} bgcolor="#fff3e0" minHeight="100vh">
        <Box maxWidth={800} mx="auto" p={3} bgcolor="#ffffff" borderRadius={2} boxShadow={3}>
          <Typography variant="h5" fontWeight="bold" color="primary" textAlign="center" mb={3}>
            Attendance Record
          </Typography>

          {/* Filters - Positioned on the left side */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={6} sm={4}>
              {/* Filter by Program */}
              <FormControl fullWidth variant="outlined">
                <InputLabel>Filter by Program</InputLabel>
                <Select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)} label="Filter by Program">
                  <MenuItem value="All">All</MenuItem>
                  {programs.map((program, index) => (
                    <MenuItem key={index} value={program}>
                      {program}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={4}>
              {/* Filter by Session */}
              <FormControl fullWidth variant="outlined">
                <InputLabel>Filter by Session</InputLabel>
                <Select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} label="Filter by Session">
                  <MenuItem value="All">All</MenuItem>
                  {sessions.map((session, index) => (
                    <MenuItem key={index} value={session}>
                      {session}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Status Messages */}
          {loading ? (
            <Box display="flex" justifyContent="center" mt={3}>
              <CircularProgress color="primary" />
            </Box>
          ) : error ? (
            <Typography color="error" textAlign="center">
              {error}
            </Typography>
          ) : filteredData.length === 0 ? (
            <Typography textAlign="center" color="textSecondary">
              No attendance data available
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#ff9800" }}>
                    <TableCell sx={{ color: "black" }}>Date</TableCell>
                    <TableCell sx={{ color: "black" }}>Session</TableCell>
                    <TableCell sx={{ color: "black" }}>Status</TableCell>
                    <TableCell sx={{ color: "black" }}>Remark</TableCell>
                    <TableCell sx={{ color: "black" }}>Program Name</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.session}</TableCell>
                      <TableCell sx={{ color: entry.status === "Absent" ? "#d32f2f" : "#388e3c", fontWeight: "bold" }}>
                        {entry.status}
                      </TableCell>
                      <TableCell>{entry.remark}</TableCell>
                      <TableCell>{entry.program_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default SessionAttendance;
