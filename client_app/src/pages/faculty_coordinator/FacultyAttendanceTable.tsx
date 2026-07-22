/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import axios from "axios";
import {
  Box,
  Container,
  Paper,
  Alert,
  SelectChangeEvent,
  Button,
} from "@mui/material";

import { getCookie } from "@/utils";
import Sidebar from "./components/Sidebar";

import { AttendanceHeader } from "./components/AttendanceHeader";
import { AttendanceFilters } from "./components/AttendanceFilters";
import { AttendanceTable } from "./components/AttandanceTable";
import { AttendanceActions } from "./components/AttendanceActions";

interface DataItem {
  program_name: string;
  student_data: string;
  dates: string;
  num_sessions: number;
  year: string;
  semester: string;
  phase: boolean;
}
interface AttendanceRecord {
  UID: string;
  Batch: string;
  Session: string;
  Present: boolean;
  Late: boolean;
}
export interface Student {
  student_data: [string, string, string]; // [UID, Name, Batch]
  year: string;
}

function TablePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { program, dateSession, year } = location.state || {};

  // --- STATE ---
  const [phase, setPhase] = useState(false);
  const [data, setData] = useState<DataItem[]>([]);
  const [attendanceData, setAttendanceData] = useState<
    Record<string, AttendanceRecord>
  >({});
  const [selectedBatch, setSelectedBatch] = useState("");
  const [batches, setBatches] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // --- DATA FETCHING & LOCAL STORAGE ---
  useEffect(() => {
    if (!program) return;
    axios
      .get("/api/faculty_coordinator/data")
      .then((response) => {
        setData(response.data);
        const programData = response.data.filter(
          (item: DataItem) => item.program_name === program
        );
        const uniqueBatches = Array.from(
          new Set(
            programData.flatMap((item: DataItem) =>
              JSON.parse(item.student_data || "[]").map(
                (student: Student) => student.student_data[2]
              )
            )
          )
        ) as string[];
        setPhase(programData[0]?.phase || false);
        setBatches(uniqueBatches);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, [program]);

  useEffect(() => {
    const storedAttendanceData = localStorage.getItem("attendanceData");
    if (storedAttendanceData) {
      setAttendanceData(JSON.parse(storedAttendanceData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("attendanceData", JSON.stringify(attendanceData));
  }, [attendanceData]);

  // --- EVENT HANDLERS ---
  const handleCheckboxChange = (
    studentId: string,
    batch: string,
    checkboxType: "Present" | "Late"
  ) => {
    setAttendanceData((prevState) => {
      const studentKey = `${studentId}-${batch}-${dateSession}`;
      const updatedState = { ...prevState };
      const current = updatedState[studentKey];

      if (checkboxType === "Present") {
        updatedState[studentKey] = {
          ...(current || {
            UID: studentId,
            Batch: batch,
            Session: dateSession,
            Present: false,
            Late: false,
          }),
          Present: !current?.Present,
          Late: current?.Present ? false : current?.Late,
        };
      } else if (checkboxType === "Late") {
        updatedState[studentKey] = {
          ...(current || {
            UID: studentId,
            Batch: batch,
            Session: dateSession,
            Present: false,
            Late: false,
          }),
          Late: !current?.Late,
          Present: true, // If checking Late, force Present to true
        };
      }
      return updatedState;
    });
  };

  const handleSelectAllChange = (action: "select" | "deselect") => {
    setAttendanceData((prevState) => {
      const updatedState = { ...prevState };
      const currentpageStudents = filteredByBatch.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      );

      currentpageStudents.forEach((student) => {
        const studentKey = `${student.student_data[0]}-${student.student_data[2]}-${dateSession}`;
        updatedState[studentKey] = {
          ...(updatedState[studentKey] || {
            UID: student.student_data[0],
            Batch: student.student_data[2],
            Session: dateSession,
          }),
          Present: action === "select",
          Late: action === "select" ? updatedState[studentKey]?.Late || false : false,
        };
      });
      return updatedState;
    });
  };

  const saveData = () => {
    const allStudents = filteredByBatch.map((student) => ({
      UID: student.student_data[0],
      Name: student.student_data[1],
      Year: student.year,
      Batch: student.student_data[2],
    }));

    const attendanceArray = allStudents.map((student) => {
      const studentKey = `${student.UID}-${student.Batch}-${dateSession}`;
      const attendance = attendanceData[studentKey] || {
        Present: false,
        Late: false,
      };
      return {
        ProgramName: program,
        Session: dateSession,
        UID: student.UID,
        Name: student.Name,
        Year: student.Year,
        Batch: student.Batch,
        Present: attendance.Present ? "Present" : "Absent",
        Late: attendance.Late ? "Late" : "Not Late",
        Phase: phase,
        semester: data[0]?.semester,
      };
    });

    axios
      .post(
        "/api/faculty_coordinator/save-attendance",
        { students: attendanceArray },
        {
          headers: { "X-CSRFToken": getCookie("csrftoken") || "" },
          withCredentials: true,
        }
      )
      .then(() => {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      })
      .catch((error) => {
        console.error("Error saving data:", error.response?.data);
        alert("Error saving data.");
      });
  };

  const downloadCSV = () => {
    const csvRows = [
      "Program,Session,UID,Name,Year,Batch,Present,Late",
    ];
    filteredByBatch.forEach((student) => {
      const studentKey = `${student.student_data[0]}-${student.student_data[2]}-${dateSession}`;
      const present = attendanceData[studentKey]?.Present ? "Present" : "Absent";
      const late = attendanceData[studentKey]?.Late ? "Late" : "Not Late";
      const row = [
        program,
        dateSession,
        student.student_data[0],
        `"${student.student_data[1]}"`, // Handle names with commas
        student.year,
        student.student_data[2],
        present,
        late,
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${program}-${dateSession}-attendance.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleBatchChange = (e: SelectChangeEvent) => {
    setSelectedBatch(e.target.value);
    setPage(0);
  };

  // --- DATA DERIVATION / FILTERING ---
  const filteredData = data.filter((item) => item.program_name === program);

  const filteredSessionData = filteredData.flatMap((item) => {
    let dates: string[] = [];
    try {
      dates = JSON.parse(item.dates);
    } catch (error) {
      console.error("Error parsing dates:", error);
    }
    return dates
      .flatMap((date: string) =>
        Array.from({ length: item.num_sessions }, (_, i) => {
          const sessionLabel = `${date} - Session ${i + 1}`;
          return sessionLabel === dateSession ? item : null;
        })
      )
      .filter(Boolean);
  });

  const filteredByBatch: Student[] = (
    selectedBatch
      ? filteredSessionData.flatMap((row) =>
          JSON.parse(row?.student_data || "[]")
            .filter(
              (student: Student) =>
                student.student_data[2] === selectedBatch && row?.year === year
            )
            .map((student: Student) => ({ ...student, year: row?.year || "" }))
        )
      : filteredSessionData.flatMap((row) =>
          JSON.parse(row?.student_data || "[]")
            .filter((_student: Student) => row?.year === year)
            .map((student: Student) => ({ ...student, year: row?.year || "" }))
        )
  ).sort((a, b) => a.student_data[1].localeCompare(b.student_data[1])); // Sort by name

  const paginatedStudents = filteredByBatch.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const presentCount = filteredByBatch.filter((student) => {
    const studentKey = `${student.student_data[0]}-${student.student_data[2]}-${dateSession}`;
    return attendanceData[studentKey]?.Present;
  }).length;

  const lateCount = filteredByBatch.filter((student) => {
    const studentKey = `${student.student_data[0]}-${student.student_data[2]}-${dateSession}`;
    return attendanceData[studentKey]?.Late;
  }).length;

  // --- RENDER ---
  if (!program || !dateSession) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: Missing program or session information.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate("/")}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box
        sx={{
          p: 3,
          bgcolor: "#f5f5f5",
          minHeight: "100vh",
          margin: 'auto'
        }}
      >
        <Container maxWidth="xl">
          {saveSuccess && (
            <Alert
              severity="success"
              sx={{ mb: 3 }}
              onClose={() => setSaveSuccess(false)}
            >
              Attendance data saved successfully!
            </Alert>
          )}

          <AttendanceHeader
            program={program}
            dateSession={dateSession}
            year={year}
            totalStudents={filteredByBatch.length}
            presentCount={presentCount}
            lateCount={lateCount}
            onBackClick={() => navigate("/")}
          />

          <Paper sx={{ p: 3, mb: 3 }}>
            <AttendanceFilters
              selectedBatch={selectedBatch}
              batches={batches}
              onBatchChange={handleBatchChange}
              onSelectAllPresent={handleSelectAllChange}
            />
          </Paper>

          {filteredByBatch.length === 0 ? (
            <Alert severity="info">
              No data available for the selected session and batch.
            </Alert>
          ) : (
            <AttendanceTable
              students={paginatedStudents}
              attendanceData={attendanceData}
              dateSession={dateSession}
              onCheckboxChange={handleCheckboxChange}
              page={page}
              rowsPerPage={rowsPerPage}
              totalCount={filteredByBatch.length}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}

          <AttendanceActions
            onSave={saveData}
            onBack={() => navigate("/")}
            onDownload={downloadCSV}
          />
        </Container>
      </Box>
    </Box>
  );
}

export default TablePage;