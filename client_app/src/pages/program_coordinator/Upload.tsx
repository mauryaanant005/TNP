/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  TablePagination,
} from "@mui/material";
import { getCookie } from "@/utils";

const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  interface StudentData {
    UID: string;
    Name: string;
    Branch_Div: string;
    semester: string;
    training_attendance: string;
    training_performance: string;
    year: string;
  }
  const [data, setData] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Handle page change
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate pagination indexes
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;
  const paginatedData = data.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  // Handle file upload (CSV/Excel)
  const handleUpload = () => {
    if (!file) {
      setMessage("Please select a file to upload.");
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const fileContent = reader.result;

      // Check file type (CSV or Excel)
      if (file.name.endsWith(".csv")) {
        // Parse CSV
        Papa.parse(fileContent as string, {
          complete: (result) => {
            setData(result.data as StudentData[]); // Store the parsed CSV data
            setMessage("CSV file uploaded successfully.");
            setLoading(false);
            setPage(0); // Reset to first page when new data is loaded

            // Send the data to the backend
            sendToBackend(result.data);
          },
          header: true, // If the first row contains headers
        });
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        // Parse Excel
        const workbook = XLSX.read(fileContent, { type: "binary" });
        const sheetName = workbook.SheetNames[0]; // Get the first sheet
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        setData(jsonData as StudentData[]); // Store the parsed Excel data
        setMessage("Excel file uploaded successfully.");
        setLoading(false);
        setPage(0); // Reset to first page when new data is loaded

        // Send the data to the backend
        sendToBackend(jsonData);
      } else {
        setMessage("Invalid file format. Please upload a CSV or Excel file.");
        setLoading(false);
      }
    };

    reader.onerror = (error: any) => {
      setMessage("Error reading file: " + error.message);
      setLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  // Function to send the parsed data to the Django backend
  const sendToBackend = (data: any) => {
    const formattedData = {
      students: data.map((item: any) => ({
        UID: item["UID"],
        Name: item["Name"],
        Branch_Div: item["Branch_Div"],
        semester: item["semester"],
        training_attendance: item["training_attendance"],
        training_performance: item["training_performance"],
        year: item["Year"] || item["year"],
      })),
    };
    const csrfToken = getCookie("csrftoken");
    fetch("/api/program_coordinator/upload-data/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken || "",
      },
      credentials: "include",
      body: JSON.stringify(formattedData),
    })
      .then((response) => response.json())
      .then((result) => {
        setMessage(result.message);
      })
      .catch((error) => {
        setMessage("Error sending data to backend: " + error.message);
      });
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 4,
        minHeight: "80vh",
        backgroundColor: "background.default",
        justifyContent: "center",
        borderRadius: "20px",
      }}
    >
      <Paper
        sx={{
          padding: 3,
          maxWidth: 800,
          width: "100%",
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography variant="h4" sx={{ textAlign: "center", marginBottom: 3 }}>
          Upload Attendance Data
        </Typography>
        <Typography
          variant="body1"
          sx={{
            textAlign: "center",
            marginBottom: 3,
            color: "text.secondary",
          }}
        >
          Upload CSV or Excel files with student data.
        </Typography>

        <Typography
          variant="body2"
          sx={{
            textAlign: "center",
            marginBottom: 3,
            color: "text.primary",
            fontWeight: "bold",
          }}
        >
          Note: Ensure that the uploaded file contains columns with the exact
          names and structure as expected, including UID, Name, Branch_Div,
          semester, training_attendance, training_performance, and year.
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <input
            type="file"
            onChange={handleFileChange}
            accept=".csv,.xlsx,.xls"
            style={{
              marginBottom: "16px",
              backgroundColor: "white",
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            sx={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Upload"
            )}
          </Button>
        </Box>

        {message && (
          <Snackbar
            open={Boolean(message)}
            autoHideDuration={6000}
            onClose={() => setMessage("")}
          >
            <Alert
              onClose={() => setMessage("")}
              severity={message.includes("Error") ? "error" : "success"}
            >
              {message}
            </Alert>
          </Snackbar>
        )}

        {/* Display table after upload with pagination */}
        {data.length > 0 && (
          <Box sx={{ marginTop: 3 }}>
            <Typography variant="h6" sx={{ marginBottom: 2 }}>
              Data from Uploaded File
            </Typography>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    {Object.keys(data[0]).map((key) => (
                      <TableCell key={key} sx={{ fontWeight: "bold" }}>
                        {key}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((item, index) => (
                    <TableRow key={index}>
                      {Object.values(item).map((value, i) => (
                        <TableCell key={i}>{value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={Object.keys(data[0]).length} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[10, 20, 50, 100]}
                component="div"
                count={data.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableContainer>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Upload;
