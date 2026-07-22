/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import * as XLSX from "xlsx"; // Import xlsx
const Attendance = () => {
  interface ConsolidatedStudent {
    program_name: string;
    name: string;
    batch: string;
    year: string;
    uid: string;
    totalPresent?: number;
    totalAbsent?: number;
    totalLate?: number;
    [key: string]: any;
  }

  const [_rawData, setRawData] = useState<AttendanceData[]>([]);
  const [_consolidatedData, setConsolidatedData] = useState<
    ConsolidatedStudent[]
  >([]);
  const [branchConsolidatedData, setBranchConsolidatedData] = useState<any[]>(
    []
  );
  const [_sessions, setSessions] = useState(new Set());
  const [programs, setPrograms] = useState<string[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [sessionDates, setSessionDates] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "/api/program_coordinator/attendance/attendance_data/"
        );
        const data = await response.json();
        setRawData(data);

        const uniquePrograms = Array.from(
          new Set(data.map((item: any) => item.program_name))
        );
        // @ts-expect-error: unknow error
        setPrograms(uniquePrograms);

        generateTables(data);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      }
    };

    fetchData();
  }, []);

  interface AttendanceData {
    session: string;
    uid: string;
    name: string;
    program_name: string;
    batch: string;
    year: string;
    present: string;
    late: string;
  }

  const generateTables = (data: AttendanceData[]) => {
    if (data.length === 0) {
      alert("No data available from the database.");
      return;
    }

    const newSessions = new Set();
    data.forEach((item) => newSessions.add(item.session));
    setSessions(newSessions);

    const consolidated = consolidateAttendanceData(data);
    setConsolidatedData(consolidated);

    const batchConsolidated = consolidateAttendanceByBatch(data);
    setBranchConsolidatedData(batchConsolidated);
  };

  const handleProgramChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    const programName = event.target.value as string;
    setSelectedProgram(programName);
    filterDataByProgram(programName);
    setSessionDates(getSessionDatesForProgram(programName));
  };

  const filterDataByProgram = (programName: string) => {
    const filteredData = _rawData.filter(
      (item) => item.program_name === programName
    );
    generateTables(filteredData);
  };

  const getSessionDatesForProgram = (programName: string) => {
    const sessionsForProgram = Array.from(
      new Set(
        _rawData
          .filter((item) => item.program_name === programName)
          .map((item) => item.session)
      )
    );
    return sessionsForProgram;
  };

  const consolidateAttendanceData = (data: any) => {
    const consolidated: any[] = [];
    data.forEach((item: any) => {
      const student = consolidated.find(
        (s) => s.uid === item.uid && s.program_name === item.program_name
      );

      if (student) {
        student[item.session] = item.present;
        if (item.present === "Present") {
          student.totalPresent = (student.totalPresent || 0) + 1;
        } else if (item.present === "Absent") {
          student.totalAbsent = (student.totalAbsent || 0) + 1;
        } else if (item.late === "Late") {
          student.totalLate = (student.totalLate || 0) + 1;
        }
      } else {
        const newStudent = {
          program_name: item.program_name,
          name: item.name,
          batch: item.batch,
          year: item.year,
          uid: item.uid,
          [item.session]: item.present,
          totalPresent: item.present === "Present" ? 1 : 0,
          totalAbsent: item.present === "Absent" ? 1 : 0,
          totalLate: item.late === "Late" ? 1 : 0,
        };
        consolidated.push(newStudent);
      }
    });
    return consolidated;
  };

  const consolidateAttendanceByBatch = (data: any) => {
    const batchConsolidated: any[] = [];

    data.forEach((item: any) => {
      const batch = batchConsolidated.find(
        (b) =>
          b.batch === item.batch &&
          b.program_name === item.program_name &&
          b.year === item.year
      );

      if (batch) {
        batch[item.session] = batch[item.session] || {
          Present: 0,
          Absent: 0,
          Late: 0,
        };

        if (item.present === "Present") {
          batch[item.session].Present += 1;
          batch.totalPresent = (batch.totalPresent || 0) + 1;
        } else if (item.present === "Absent") {
          batch[item.session].Absent += 1;
          batch.totalAbsent = (batch.totalAbsent || 0) + 1;
        }

        if (item.late === "Late") {
          batch[item.session].Late += 1;
          batch.totalLate = (batch.totalLate || 0) + 1;
        }
      } else {
        const newBatch = {
          batch: item.batch,
          program_name: item.program_name,
          year: item.year,
          [item.session]: {
            Present: item.present === "Present" ? 1 : 0,
            Absent: item.present === "Absent" ? 1 : 0,
            Late: item.late === "Late" ? 1 : 0,
          },
          totalPresent: item.present === "Present" ? 1 : 0,
          totalAbsent: item.present === "Absent" ? 1 : 0,
          totalLate: item.late === "Late" ? 1 : 0,
        };
        batchConsolidated.push(newBatch);
      }
    });

    batchConsolidated.forEach((batch) => {
      Object.keys(batch).forEach((session) => {
        if (
          session !== "batch" &&
          session !== "program_name" &&
          session !== "year" &&
          session !== "totalPresent" &&
          session !== "totalAbsent" &&
          session !== "totalLate"
        ) {
          batch.totalStudents =
            (batch[session].Present || 0) + (batch[session].Absent || 0);
        }
      });
    });

    return batchConsolidated;
  };


  // Download Excel file
  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(branchConsolidatedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, "attendance_data.xlsx");
  };

  return (
    <Box
      sx={{
        padding: 4,
        backgroundColor: "#f4f4f4",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        borderRadius: "20px",
      }}
    >
      <Typography
        variant="h4"
        sx={{ mb: 3, fontWeight: "bold", color: "black" }}
      >
        Attendance Table Generator
      </Typography>

      {/* Dropdown for Program Name */}
      <FormControl sx={{ mb: 3, width: 200 }}>
        <InputLabel>Program Name</InputLabel>
        <Select
          value={selectedProgram}
          // @ts-expect-error: this is error
          onChange={handleProgramChange}
          label="Program Name"
        >
          {programs.map((program) => (
            <MenuItem key={program} value={program}>
              {program}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Table for Batch-wise Attendance */}
      <TableContainer
        component={Paper}
        sx={{
          maxWidth: "90%",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          borderRadius: "8px",
        }}
      >
        <Table>
          <TableHead sx={{ backgroundColor: "orange" }}>
            <TableRow>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                Batch
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                Program Name
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                Year
              </TableCell>
              {sessionDates.map((session) => (
                <TableCell
                  key={session}
                  sx={{ color: "#fff", fontWeight: "bold" }}
                >
                  {session}
                </TableCell>
              ))}
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                Total Students
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                Total Present
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                Total Absent
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                Total Late
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {branchConsolidatedData.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.batch}</TableCell>
                <TableCell>{item.program_name}</TableCell>
                <TableCell>{item.year}</TableCell>
                {sessionDates.map((session) => {
                  const sessionData = item[session] || {};
                  return (
                    <TableCell key={session}>
                      {`Present: ${sessionData.Present || 0}, Absent: ${
                        sessionData.Absent || 0
                      }`}
                    </TableCell>
                  );
                })}
                <TableCell>{item.totalStudents}</TableCell>
                <TableCell>{item.totalPresent}</TableCell>
                <TableCell>{item.totalAbsent}</TableCell>
                <TableCell>{item.totalLate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>


      {/* Download Excel Button */}
      <Box sx={{ marginTop: 2, display: "flex", justifyContent: "center" }}>
        <Button
          onClick={downloadExcel}
          variant="contained"
          color="primary"
          sx={{
            padding: "10px 20px",
            fontSize: "16px",
            fontWeight: "bold",
            "&:hover": { backgroundColor: "orange", color: "black" },
          }}
        >
          Download Excel
        </Button>
      </Box>
    </Box>
  );
};

export default Attendance;
