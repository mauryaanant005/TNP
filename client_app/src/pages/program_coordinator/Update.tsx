/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Grid,
} from "@mui/material";

// Mock getCookie function - replace with your actual implementation
const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return '';
};

const Update = () => {
  interface AttendanceRecord {
    uid: number;
    name: string;
    batch: string;
    session: string;
    present: string;
  }

  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter states
  const [selectedSession, setSelectedSession] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  interface LastUpdate {
    uid: number;
    session: string;
    newStatus: string;
  }
  const [lastUpdate, setLastUpdate] = useState<LastUpdate | null>(null);

  // Extract unique sessions and branches for filters
  const uniqueSessions = Array.from(new Set(attendanceData.map(record => record.session))).sort();
  const uniqueBranches = Array.from(new Set(attendanceData.map(record => record.batch))).sort();

  // Fetch attendance data from the API
  useEffect(() => {
    fetch("/api/program_coordinator/attendance/attendance_data/")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setAttendanceData(data);
        setFilteredData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching attendance data:", error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // Apply all filters
  useEffect(() => {
    let filtered = attendanceData;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (record) =>
          record.uid.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.batch.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.present.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply session filter
    if (selectedSession !== "all") {
      filtered = filtered.filter(record => record.session === selectedSession);
    }

    // Apply branch filter
    if (selectedBranch !== "all") {
      filtered = filtered.filter(record => record.batch === selectedBranch);
    }

    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, selectedSession, selectedBranch, attendanceData]);

  // Handle search input
  const handleSearch = (e: any) => {
    setSearchQuery(e.target.value);
  };

  // Handle pagination
  const handlePageChange = (_event: any, value: number) => {
    setCurrentPage(value);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Handle attendance update
  const handleUpdate = (
    uid: number,
    session: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "Present" ? "Absent" : "Present";

    // Update data in the backend
    fetch("/api/program_coordinator/update-attendance/attendance_data/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken") || "",
      },
      body: JSON.stringify({
        uid,
        session,
        new_status: newStatus,
      }),
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log(data.message);

        // Update the local state
        const updatedData = attendanceData.map((record) =>
          record.uid === uid && record.session === session
            ? { ...record, present: newStatus }
            : record
        );

        setAttendanceData(updatedData);

        // Track the last update
        setLastUpdate({ uid, session, newStatus });

        // Show alert with updated information
        alert(
          `Attendance Updated Successfully!\nUID: ${uid}\nSession: ${session}\nNew Status: ${newStatus}`
        );
      })
      .catch((error) => {
        console.error("Error updating attendance:", error);
      });
  };

  return (
    <Box
      sx={{
        padding: 4,
        backgroundColor: "white",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        borderRadius: "20px",
        boxShadow: 3,
        margin: "auto",
        maxWidth: 1200,
      }}
    >
      <Typography
        variant="h4"
        sx={{ textAlign: "center", marginBottom: 3, color: "primary.main" }}
      >
        Update Attendance
      </Typography>
      <Typography variant="body1" align="center" color="textSecondary" sx={{ marginBottom: 3 }}>
        View and manage attendance records below
      </Typography>

      {/* Filters Section */}
      <Grid container spacing={2} sx={{ width: "100%", marginBottom: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            label="Search by UID, Name, Branch, or Attendance"
            variant="outlined"
            value={searchQuery}
            onChange={handleSearch}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Filter by Session</InputLabel>
            <Select
              value={selectedSession}
              label="Filter by Session"
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              <MenuItem value="all">All Sessions</MenuItem>
              {uniqueSessions.map((session) => (
                <MenuItem key={session} value={session}>
                  {session}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Filter by Branch</InputLabel>
            <Select
              value={selectedBranch}
              label="Filter by Branch"
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <MenuItem value="all">All Branches</MenuItem>
              {uniqueBranches.map((branch) => (
                <MenuItem key={branch} value={branch}>
                  {branch}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Results Count */}
      <Typography variant="body2" color="textSecondary" sx={{ marginBottom: 2, alignSelf: "flex-start" }}>
        Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} records
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography sx={{ color: "error.main" }} variant="body1">
          Error: {error}
        </Typography>
      ) : filteredData.length > 0 ? (
        <>
          <TableContainer>
            <Table
              sx={{
                marginBottom: 3,
                border: "1px solid black",
              }}
            >
              <TableHead>
                <TableRow sx={{ backgroundColor: "orange" }}>
                  <TableCell sx={{ border: "1px solid black", fontWeight: "bold" }}>UID</TableCell>
                  <TableCell sx={{ border: "1px solid black", fontWeight: "bold" }}>Name</TableCell>
                  <TableCell sx={{ border: "1px solid black", fontWeight: "bold" }}>
                    Branch
                  </TableCell>
                  <TableCell sx={{ border: "1px solid black", fontWeight: "bold" }}>
                    Session
                  </TableCell>
                  <TableCell sx={{ border: "1px solid black", fontWeight: "bold" }}>
                    Attendance
                  </TableCell>
                  <TableCell sx={{ border: "1px solid black", fontWeight: "bold" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((record, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      "&:hover": {
                        backgroundColor: "#e3f2fd",
                      },
                    }}
                  >
                    <TableCell sx={{ border: "1px solid black" }}>
                      {record.uid}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid black" }}>
                      {record.name}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid black" }}>
                      {record.batch}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid black" }}>
                      {record.session}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid black" }}>
                      {record.present}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid black" }}>
                      <Button
                        variant="contained"
                        onClick={() =>
                          handleUpdate(
                            record.uid,
                            record.session,
                            record.present
                          )
                        }
                        sx={{
                          backgroundColor: "success.main",
                          color: "white",
                          "&:hover": {
                            backgroundColor: "success.dark",
                          },
                        }}
                      >
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", marginTop: 3, marginBottom: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}

          {/* Display last update */}
          {lastUpdate && (
            <Box
              sx={{ marginTop: 2, padding: 2, backgroundColor: "info.light", borderRadius: 2, width: "100%" }}
            >
              <Typography variant="body1">
                <strong>Last Update:</strong> UID: {lastUpdate.uid}, Session:{" "}
                {lastUpdate.session}, New Status: {lastUpdate.newStatus}
              </Typography>
            </Box>
          )}
        </>
      ) : (
        <Typography variant="body1" align="center">
          No attendance records found matching the filters.
        </Typography>
      )}
    </Box>
  );
};

export default Update;