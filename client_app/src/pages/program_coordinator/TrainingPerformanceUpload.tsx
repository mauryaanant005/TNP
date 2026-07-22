/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  SelectChangeEvent,
  Alert,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField, // NEW: Import TextField for the date input
} from "@mui/material";
import { saveAs } from "file-saver";
import axios from "axios";
import { getCookie } from "@/utils";

const BASE_URL = "/api/program_coordinator/training-performance";
const TRAINING_TYPES = ["Aptitude", "Technical", "Coding"];

// NEW: Define semester options, as the backend now requires this
const SEM_OPTIONS = [
  "Sem 1",
  "Sem 2",
  "Sem 3",
  "Sem 4",
  "Sem 5",
  "Sem 6",
  "Sem 7",
  "Sem 8",
];

const TrainingPerformanceUpload: React.FC = () => {
  const [trainingType, setTrainingType] = useState<string>("");
  const [semester, setSemester] = useState<string>(""); // NEW: State for semester
  const [date, setDate] = useState<string>(""); // NEW: State for date (optional)
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleTypeChange = (e: SelectChangeEvent<string>) => {
    setTrainingType(e.target.value as string);
    setResult(null);
    setError(null);
  };

  // NEW: Handler for semester change
  const handleSemesterChange = (e: SelectChangeEvent<string>) => {
    setSemester(e.target.value as string);
    setResult(null);
    setError(null);
  };

  // NEW: Handler for date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value); // Value will be in 'yyyy-mm-dd' format
    setResult(null);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!trainingType) {
      setError("Please select a training type first.");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(
        `${BASE_URL}/template/${trainingType}/`,
        {
          responseType: "blob",
        }
      );
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `training_template_${trainingType}.xlsx`);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("Failed to download template. Please check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    // NEW: Add semester to validation
    if (!trainingType || !file || !semester) {
      setError("Please select training type, semester, and a file.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("training_type", trainingType);
      formData.append("semester", semester); // NEW: Add semester to form data
      if (date) {
        formData.append("date", date); // NEW: Add optional date to form data
      }
      formData.append("file", file);

      const response = await fetch(
        `/api/program_coordinator/training-performance/upload/${trainingType}/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "X-CSRFToken": getCookie("csrftoken") || "",
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);

      setResult(data);
      setFile(null);
    } catch (err: any) {
      console.error(err);
      if (err.response)
        setError(err.response.data.error || JSON.stringify(err.response.data));
      else setError("Failed to upload file. Check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        py: 5,
      }}
    >
      <Paper
        sx={{
          width: "90%",
          maxWidth: "900px",
          p: 4,
          borderRadius: "15px",
          border: "8px solid #FFA500", // orange border
          backgroundColor: "white",
          boxShadow: "0px 3px 10px rgba(0,0,0,0.1)",
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          textAlign="center"
          gutterBottom
          sx={{ color: "#222" }}
        >
          Training Performance Upload
        </Typography>

        <Typography
          variant="body1"
          textAlign="center"
          color="text.secondary"
          mb={3}
        >
          Upload or download Excel files for training performance evaluation.
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Required Columns:</strong> UID, Full Name, Branch
          <br />
          Subcategory columns vary by training type (e.g., Arithmetic, OS,
          Coding Marks, etc.)
        </Alert>

        {/* Form Section */}
        <Box
          component="form"
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <FormControl fullWidth>
            <InputLabel id="training-type-label">
              Choose Training Type
            </InputLabel>
            <Select
              labelId="training-type-label"
              value={trainingType}
              label="Choose Training Type"
              onChange={handleTypeChange}
            >
              {TRAINING_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* NEW: Semester Dropdown */}
          <FormControl fullWidth>
            <InputLabel id="semester-label">Choose Semester</InputLabel>
            <Select
              labelId="semester-label"
              value={semester}
              label="Choose Semester"
              onChange={handleSemesterChange}
            >
              {SEM_OPTIONS.map((sem) => (
                <MenuItem key={sem} value={sem}>
                  {sem}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* NEW: Optional Date Picker */}
          <TextField
            label="Date (Optional)"
            type="date"
            value={date}
            onChange={handleDateChange}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#007bff",
                "&:hover": { backgroundColor: "#0056b3" },
              }}
              onClick={handleDownloadTemplate}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "UPLOAD TEMPLATE"
              )}
            </Button>

            <Button
              variant="contained"
              component="label"
              sx={{
                backgroundColor: "#007bff",
                "&:hover": { backgroundColor: "#0056b3" },
              }}
            >
              CHOOSE FILE
              <input
                type="file"
                accept=".xlsx"
                hidden
                onChange={handleFileChange}
              />
            </Button>

            {file && (
              <Typography
                variant="body2"
                sx={{
                  color: "green",
                  alignSelf: "center",
                  wordBreak: "break-all",
                }}
              >
                {file.name}
              </Typography>
            )}
          </Box>

          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={loading || !file || !semester} // NEW: Disable if no semester
            sx={{
              backgroundColor: "#FF8C00",
              "&:hover": { backgroundColor: "#e07b00" },
              alignSelf: "center",
              px: 4,
              mt: 1,
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "UPLOAD TO SERVER"
            )}
          </Button>
        </Box>

        {/* Result / Error Display */}
        {error && (
          <Alert severity="error" sx={{ mt: 4 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box sx={{ mt: 4 }}>
            <Alert severity="success">
              <strong>
                {result.training_type} ({result.semester})
              </strong>{" "}
              processed successfully — {result.processed_rows} rows analyzed.
            </Alert>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Upload Summary
              </Typography>
              <Table size="small" sx={{ mb: 2 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    <TableCell>Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* NEW: Display Student stats */}
                  <TableRow>
                    <TableCell>New Students Created</TableCell>
                    <TableCell>{result.created_students}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Existing Students Updated</TableCell>
                    <TableCell>{result.updated_students}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Training Records Created</TableCell>
                    <TableCell>{result.created_training_performance}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Training Records Updated</TableCell>
                    <TableCell>{result.updated_training_performance}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Category Rows Created</TableCell>
                    <TableCell>{result.created_category_rows}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Category Rows Updated</TableCell>
                    <TableCell>{result.updated_category_rows}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Errors Found</TableCell>
                    <TableCell>{result.errors_count}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {result.errors && result.errors.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom color="error">
                    Row Errors
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Row</TableCell>
                        <TableCell>Errors</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.errors.map((err: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{err.row}</TableCell>
                          <TableCell>{err.errors.join(", ")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TrainingPerformanceUpload;
