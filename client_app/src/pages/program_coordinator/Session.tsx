import { apiFetch } from "@/lib/api";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  TablePagination,
} from "@mui/material";
import { useAtomValue } from "jotai";
import { authAtom } from "@/authAtom";
import { getCookie } from "@/utils";

interface FormData {
  programName: string;
  year: string;
  numSessions: number;
  numDays: number;
  dates: Array<{ day: string; date: string }>;
  tableData: Array<{
    fileData: any[];
    batch: string;
    sessions: Array<string[]>;
  }>;
  fileHeaders: string[];
  semester: string;
  phase: string;
}

function Session() {
  const auth = useAtomValue(authAtom);
  const [formData, setFormData] = useState<FormData>({
    programName: auth?.program ?? "",
    year: "fe",
    numSessions: 1,
    numDays: 1,
    dates: [],
    tableData: [],
    fileHeaders: [],
    semester: "",
    phase: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const SEM_OPTIONS = [
    "Semester 1",
    "Semester 2",
    "Semester 3",
    "Semester 4",
    "Semester 5",
    "Semester 6",
    "Semester 7",
    "Semester 8",
  ];

  useEffect(() => {
    if (auth?.role === "faculty" && auth.program) {
      setFormData((prevData) => ({
        ...prevData,
        programName: auth?.program || "ACT_TECHNICAL",
      }));
    }
  }, [auth]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getPaginatedData = () => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return formData.tableData.slice(startIndex, endIndex);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target && e.target.files ? e.target.files[0] : null;
    if (!file) return;

    const fileExtension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        if (fileExtension === "csv") {
          const csvData = (event.target as FileReader).result;
          parseCSV(csvData);
        } else if (["xlsx", "xls"].includes(fileExtension)) {
          const binaryStr = (event.target as FileReader).result;
          if (binaryStr instanceof ArrayBuffer) {
            parseExcel(binaryStr);
          } else {
            throw new Error("Failed to read Excel file.");
          }
        } else {
          throw new Error(
            "Invalid file type. Please upload a CSV or Excel file."
          );
        }
      } catch (error: any) {
        setErrorMessage(error.message);
      }
    };

    if (["xlsx", "xls"].includes(fileExtension)) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const parseCSV = (csvData: any) => {
    const rows = csvData
      .split("\n")
      .map((row: any) => row.split(",").map((cell: string) => cell.trim()));
    const cleanedRows = rows.filter((row: string[]) => row.length > 0);

    if (cleanedRows.length === 0) {
      setErrorMessage("The uploaded CSV file is empty.");
      return;
    }

    setFormData((prevData) => ({
      ...prevData,
      fileHeaders: cleanedRows[0],
      tableData: cleanedRows.slice(1).map((row: string[]) => ({
        fileData: row,
        batch: row[2],
        sessions: [],
      })),
    }));
  };

  const parseExcel = (binaryStr: ArrayBuffer) => {
    const workbook = XLSX.read(binaryStr, { type: "binary" });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
    });

    if (sheetData.length === 0) {
      setErrorMessage("The uploaded Excel file is empty.");
      return;
    }

    setFormData((prevData: any) => ({
      ...prevData,
      fileHeaders: sheetData[0],
      tableData: sheetData.slice(1).map((row) => ({
        fileData: row,
        // @ts-expect-error : Type mismatch
        batch: row[2],
        sessions: [],
      })),
    }));
  };

  const generateDateInputs = () => {
    if (formData.numDays <= 0 || formData.numSessions <= 0) {
      setErrorMessage("Please enter valid numbers for days and sessions.");
      return;
    }
    const dateFields = Array.from({ length: formData.numDays }, (_, i) => ({
      day: `Day ${i + 1}`,
      date: "",
    }));
    setFormData((prevData) => ({ ...prevData, dates: dateFields }));
  };

  const handleDateChange = (index: number, value: string) => {
    const updatedDates = [...formData.dates];
    updatedDates[index].date = value;
    setFormData((prevData) => ({ ...prevData, dates: updatedDates }));
  };

  const generateTable = () => {
    if (formData.tableData.length === 0) {
      setErrorMessage("Please upload a file first.");
      return;
    }

    const updatedTableData = formData.tableData.map((row) => ({
      ...row,
      sessions: formData.dates.map(() =>
        Array.from({ length: formData.numSessions }, () => "")
      ),
    }));

    setFormData((prevData) => ({ ...prevData, tableData: updatedTableData }));
    setPage(0); // Reset to first page when generating new table
  };

  const handleAttendanceChange = (
    rowIndex: number,
    dayIndex: number,
    sessionIndex: number,
    value: string
  ) => {
    const actualRowIndex = rowIndex + page * rowsPerPage; // Adjust for pagination
    const updatedTableData = [...formData.tableData];
    updatedTableData[actualRowIndex].sessions[dayIndex][sessionIndex] = value;
    setFormData((prevData) => ({ ...prevData, tableData: updatedTableData }));
  };

  const csrfToken = getCookie("csrftoken");
  const sendDataToApi = async () => {
    const {
      programName,
      year,
      numSessions,
      numDays,
      dates,
      fileHeaders,
      tableData,
      semester,
      phase,
    } = formData;

    if (
      !programName ||
      !year ||
      numSessions <= 0 ||
      numDays <= 0 ||
      tableData.length === 0
    ) {
      setErrorMessage(
        "Please fill in all required fields and upload a valid file."
      );
      return;
    }

    if (dates.some((date) => !date.date)) {
      setErrorMessage("Please enter dates for all days.");
      return;
    }

    const requestData = {
      program_name: programName,
      year: year,
      num_sessions: numSessions,
      num_days: numDays,
      dates: dates.map((date) => date.date),
      semester: semester,
      phase: phase,
      file_headers: fileHeaders,
      attendance_data: tableData.map((row) => ({
        student_data: [row.fileData[0], row.fileData[1], row.batch],
        sessions: row.sessions,
      })),
    };

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await apiFetch(
        "/api/program_coordinator/create-attendance-record/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken || "",
          },
          credentials: "include",
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      await response.json();
      alert("Data successfully sent to API!");
    } catch (error: any) {
      console.error("Error:", error);
      setErrorMessage(`Failed to send data to API. Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 3, md: 5 }, backgroundColor: "white", borderRadius: "12px", boxShadow: "0px 4px 20px rgba(0,0,0,0.05)", mb: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: "#222", mb: 3 }}>
        Generate Session Table
      </Typography>

      <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
        <Button variant="outlined" component="label" sx={{ px: 3, py: 1 }}>
          Upload File
          <input
            type="file"
            hidden
            onChange={handleFileUpload}
            accept=".csv,.xlsx,.xls"
          />
        </Button>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Choose a Year</InputLabel>
          <Select
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            label="Choose a Year"
          >
            <MenuItem value="fe">First Year</MenuItem>
            <MenuItem value="se">Second Year</MenuItem>
            <MenuItem value="te">Third Year</MenuItem>
            <MenuItem value="be">Final Year</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Choose a Phase</InputLabel>
          <Select
            value={formData.phase}
            onChange={(e) =>
              setFormData({ ...formData, phase: e.target.value })
            }
            label="Choose a Phase"
          >
            <MenuItem value="Phase 1">Phase I</MenuItem>
            <MenuItem value="Phase 2">Phase II</MenuItem>
            <MenuItem value="Phase 3">Phase III</MenuItem>
            <MenuItem value="Not Applicable">Not Applicable</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Choose a Semester</InputLabel>
          <Select
            value={formData.semester}
            onChange={(e) =>
              setFormData({ ...formData, semester: e.target.value })
            }
            label="Choose a Semester"
          >
            {SEM_OPTIONS.map((sem) => (
              <MenuItem key={sem} value={sem}>{sem}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Number of Days"
          type="number"
          fullWidth
          value={formData.numDays}
          onChange={(e) =>
            setFormData({
              ...formData,
              numDays: Math.max(Number(e.target.value), 1),
            })
          }
        />

        <TextField
          label="Number of Sessions"
          type="number"
          fullWidth
          value={formData.numSessions}
          onChange={(e) =>
            setFormData({
              ...formData,
              numSessions: Math.max(Number(e.target.value), 1),
            })
          }
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={generateDateInputs} sx={{ px: 3, py: 1 }}>
            Generate Date Inputs
          </Button>
        </Box>
      </Box>

      {formData.dates.length > 0 && (
        <Box sx={{ mb: 3, display: "flex", flexDirection: "column", gap: 2 }}>
          {formData.dates.map((date, index) => (
            <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography sx={{ minWidth: "60px", fontWeight: "medium" }}>Day {index + 1}</Typography>
              <TextField
                label="Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={date.date}
                onChange={(e) => handleDateChange(index, e.target.value)}
              />
            </Box>
          ))}
          
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
            <Button variant="contained" color="primary" onClick={generateTable} sx={{ px: 4, py: 1 }}>
              Generate Table
            </Button>
          </Box>
        </Box>
      )}

      {formData.tableData.length > 0 && (
        <Box sx={{ width: "100%", overflow: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                {["Program", "Name", "Year", "UID", "Batch", "Phase"]
                  .concat(
                    // Format headers as Date - Session X
                    formData.dates
                      .map((date) =>
                        Array.from(
                          { length: formData.numSessions },
                          (_, sessionIndex) =>
                            `${date.date} - Session ${sessionIndex + 1}`
                        )
                      )
                      .flat() // Flatten the array to get a flat list of headers
                  )
                  .map((header, index) => (
                    <TableCell key={index}>{header}</TableCell>
                  ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {getPaginatedData().map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell>{formData.programName}</TableCell>
                  <TableCell>{row.fileData[1]}</TableCell>
                  <TableCell>{formData.year}</TableCell>
                  <TableCell>{row.fileData[0]}</TableCell>
                  <TableCell>{row.batch}</TableCell>
                  <TableCell>{formData.phase}</TableCell>
                  {row.sessions.map((sessionsForDay, dayIndex) =>
                    sessionsForDay.map((session, sessionIndex) => (
                      <TableCell key={`${dayIndex}-${sessionIndex}`}>
                        <TextField
                          value={session}
                          onChange={(e) =>
                            handleAttendanceChange(
                              rowIndex,
                              dayIndex,
                              sessionIndex,
                              e.target.value
                            )
                          }
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    ))
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={formData.tableData.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[50, 100, 200]}
          />
        </Box>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={sendDataToApi}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : "Send Data to API"}
        </Button>
      </Box>
    </Box>
  );
}

export default Session;
