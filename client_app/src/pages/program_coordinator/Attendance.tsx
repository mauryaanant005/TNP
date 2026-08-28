import { apiFetch } from "@/lib/api";
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
  CircularProgress,
  Chip,
  Card,
  CardContent,
} from "@mui/material";
import * as XLSX from "xlsx";

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

interface BatchSummary {
  batch: string;
  program_name: string;
  year: string;
  totalStudents: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  averageAttendance: number;
  [key: string]: any;
}

const Attendance = () => {
  const [rawData, setRawData] = useState<AttendanceData[]>([]);
  const [branchConsolidatedData, setBranchConsolidatedData] = useState<BatchSummary[]>([]);
  const [programs, setPrograms] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("ALL");
  const [sessionDates, setSessionDates] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiFetch(
          "/api/program_coordinator/attendance/attendance_data/"
        );
        if (!response.ok) throw new Error("Failed to fetch attendance data");
        const data: AttendanceData[] = await response.json();
        setRawData(data);

        const uniquePrograms = Array.from(
          new Set(data.map((item) => item.program_name).filter(Boolean))
        );
        const uniqueBatches = Array.from(
          new Set(data.map((item) => item.batch).filter(Boolean))
        );

        setPrograms(uniquePrograms);
        setBatches(uniqueBatches);

        if (data.length > 0) {
          const defaultProgram = uniquePrograms[0] || "";
          setSelectedProgram(defaultProgram);
          applyFilters(data, defaultProgram, "ALL");
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const applyFilters = (
    data: AttendanceData[],
    programName: string,
    batchName: string
  ) => {
    let filtered = data;
    if (programName && programName !== "ALL") {
      filtered = filtered.filter((item) => item.program_name === programName);
    }
    if (batchName && batchName !== "ALL") {
      filtered = filtered.filter((item) => item.batch === batchName);
    }

    // Determine unique sessions for the selected program
    const uniqueSessions = Array.from(
      new Set(filtered.map((item) => item.session))
    ).sort((a, b) => {
      // Natural sort by session number if present
      const aNum = parseInt(a.replace(/\D/g, "") || "0", 10);
      const bNum = parseInt(b.replace(/\D/g, "") || "0", 10);
      return aNum - bNum;
    });

    setSessionDates(uniqueSessions);
    const consolidated = consolidateAttendanceByBatch(filtered, uniqueSessions);
    setBranchConsolidatedData(consolidated);
  };

  const handleProgramChange = (event: any) => {
    const programName = event.target.value as string;
    setSelectedProgram(programName);
    applyFilters(rawData, programName, selectedBatch);
  };

  const handleBatchChange = (event: any) => {
    const batchName = event.target.value as string;
    setSelectedBatch(batchName);
    applyFilters(rawData, selectedProgram, batchName);
  };

  const consolidateAttendanceByBatch = (
    data: AttendanceData[]
  ): BatchSummary[] => {
    const batchMap: { [key: string]: BatchSummary } = {};

    data.forEach((item) => {
      const key = `${item.batch}__${item.program_name}__${item.year}`;
      if (!batchMap[key]) {
        batchMap[key] = {
          batch: item.batch,
          program_name: item.program_name,
          year: item.year,
          totalStudents: 0,
          totalPresent: 0,
          totalAbsent: 0,
          totalLate: 0,
          averageAttendance: 0,
        };
      }

      const batchObj = batchMap[key];
      if (!batchObj[item.session]) {
        batchObj[item.session] = { Present: 0, Absent: 0, Late: 0 };
      }

      if (item.present === "Present") {
        batchObj[item.session].Present += 1;
        batchObj.totalPresent += 1;
      } else {
        batchObj[item.session].Absent += 1;
        batchObj.totalAbsent += 1;
      }

      if (item.late === "Late") {
        batchObj[item.session].Late += 1;
        batchObj.totalLate += 1;
      }
    });

    // Compute distinct student counts and percentage
    return Object.values(batchMap).map((batchObj) => {
      const distinctStudents = new Set(
        data
          .filter(
            (d) =>
              d.batch === batchObj.batch &&
              d.program_name === batchObj.program_name
          )
          .map((d) => d.uid)
      ).size;

      batchObj.totalStudents = distinctStudents;
      const totalSessionsAttempted = batchObj.totalPresent + batchObj.totalAbsent;
      batchObj.averageAttendance =
        totalSessionsAttempted > 0
          ? Number(
              ((batchObj.totalPresent / totalSessionsAttempted) * 100).toFixed(1)
            )
          : 0;

      return batchObj;
    });
  };

  const downloadExcel = () => {
    if (branchConsolidatedData.length === 0) {
      alert("No attendance records to export.");
      return;
    }

    const exportRows = branchConsolidatedData.map((item) => {
      const row: any = {
        Batch: item.batch,
        "Program Name": item.program_name,
        Year: item.year,
        "Total Students": item.totalStudents,
        "Total Present Sessions": item.totalPresent,
        "Total Absent Sessions": item.totalAbsent,
        "Total Late Sessions": item.totalLate,
        "Average Attendance (%)": `${item.averageAttendance}%`,
      };

      sessionDates.forEach((session) => {
        const s = item[session] || { Present: 0, Absent: 0, Late: 0 };
        row[session] = `Present: ${s.Present}, Absent: ${s.Absent}, Late: ${s.Late}`;
      });

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance_Summary");
    const fileName = `${selectedProgram || "training"}_attendance_summary.xlsx`.replace(
      /\s+/g,
      "_"
    );
    XLSX.writeFile(wb, fileName);
  };

  return (
    <Box
      sx={{
        padding: { xs: 2, md: 4 },
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Header Container */}
      <Box sx={{ width: "100%", maxWidth: "1200px", mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            color: "#0f172a",
            textAlign: "center",
            mb: 1,
          }}
        >
          Attendance Table Generator
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "#64748b", textAlign: "center", mb: 3 }}
        >
          Aggregated batch-level training session attendance analytics and export
        </Typography>

        {/* Filter Controls Card */}
        <Card
          sx={{
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            p: 2,
            mb: 3,
            backgroundColor: "#ffffff",
          }}
        >
          <CardContent sx={{ p: "12px !important" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", width: "100%" }}>
                {/* Program Selector */}
                <FormControl sx={{ minWidth: 220, flex: 1 }}>
                  <InputLabel id="program-select-label">Training Program</InputLabel>
                  <Select
                    labelId="program-select-label"
                    value={selectedProgram}
                    onChange={handleProgramChange}
                    label="Training Program"
                    size="small"
                  >
                    {programs.map((program) => (
                      <MenuItem key={program} value={program}>
                        {program}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Batch Filter */}
                <FormControl sx={{ minWidth: 180 }}>
                  <InputLabel id="batch-select-label">Batch Filter</InputLabel>
                  <Select
                    labelId="batch-select-label"
                    value={selectedBatch}
                    onChange={handleBatchChange}
                    label="Batch Filter"
                    size="small"
                  >
                    <MenuItem value="ALL">All Batches</MenuItem>
                    {batches.map((b) => (
                      <MenuItem key={b} value={b}>
                        Batch {b}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label={`${branchConsolidatedData.length} Batches Loaded`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Main Content Area */}
      {loading ? (
        <Box sx={{ p: 8, textAlign: "center" }}>
          <CircularProgress size={40} />
          <Typography sx={{ mt: 2, color: "#64748b" }}>
            Loading training attendance records...
          </Typography>
        </Box>
      ) : branchConsolidatedData.length === 0 ? (
        <Box
          sx={{
            p: 6,
            textAlign: "center",
            bgcolor: "#fff",
            borderRadius: 2,
            border: "1px solid #e2e8f0",
            maxWidth: "800px",
            width: "100%",
          }}
        >
          <Typography variant="h6" sx={{ color: "#334155", mb: 1 }}>
            No Attendance Data Found
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            There are no session attendance records matching the selected program and batch criteria.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ width: "100%", maxWidth: "1200px" }}>
          <TableContainer
            component={Paper}
            sx={{
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              overflowX: "auto",
            }}
          >
            <Table size="small">
              <TableHead sx={{ backgroundColor: "#1e293b" }}>
                <TableRow>
                  <TableCell sx={{ color: "#fff", fontWeight: "bold", py: 1.5 }}>
                    Batch
                  </TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: "bold", py: 1.5 }}>
                    Program Name
                  </TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: "bold", py: 1.5 }}>
                    Year
                  </TableCell>
                  {sessionDates.map((session) => (
                    <TableCell
                      key={session}
                      align="center"
                      sx={{ color: "#fff", fontWeight: "bold", py: 1.5, minWidth: 110 }}
                    >
                      {session}
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold", py: 1.5 }}>
                    Total Students
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold", py: 1.5 }}>
                    Total Present
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold", py: 1.5 }}>
                    Total Absent
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold", py: 1.5 }}>
                    Total Late
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold", py: 1.5 }}>
                    Avg. Attendance
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {branchConsolidatedData.map((item, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      "&:nth-of-type(even)": { backgroundColor: "#f8fafc" },
                      "&:hover": { backgroundColor: "#f1f5f9" },
                    }}
                  >
                    <TableCell sx={{ fontWeight: "bold" }}>{item.batch}</TableCell>
                    <TableCell>{item.program_name}</TableCell>
                    <TableCell>{item.year}</TableCell>
                    {sessionDates.map((session) => {
                      const sessionData = item[session] || { Present: 0, Absent: 0, Late: 0 };
                      return (
                        <TableCell key={session} align="center" sx={{ fontSize: "12px" }}>
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.2 }}>
                            <span className="text-emerald-700 font-semibold">
                              P: {sessionData.Present || 0}
                            </span>
                            <span className="text-rose-600 font-medium">
                              A: {sessionData.Absent || 0}
                            </span>
                            {sessionData.Late > 0 && (
                              <span className="text-amber-600 font-medium">
                                L: {sessionData.Late}
                              </span>
                            )}
                          </Box>
                        </TableCell>
                      );
                    })}
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>
                      {item.totalStudents}
                    </TableCell>
                    <TableCell align="center" sx={{ color: "#059669", fontWeight: "bold" }}>
                      {item.totalPresent}
                    </TableCell>
                    <TableCell align="center" sx={{ color: "#dc2626", fontWeight: "bold" }}>
                      {item.totalAbsent}
                    </TableCell>
                    <TableCell align="center" sx={{ color: "#d97706", fontWeight: "bold" }}>
                      {item.totalLate}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${item.averageAttendance}%`}
                        color={
                          item.averageAttendance >= 85
                            ? "success"
                            : item.averageAttendance >= 75
                            ? "primary"
                            : "warning"
                        }
                        size="small"
                        sx={{ fontWeight: "bold" }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Download Excel Button */}
          <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
            <Button
              onClick={downloadExcel}
              variant="contained"
              sx={{
                px: 4,
                py: 1.5,
                fontSize: "15px",
                fontWeight: "bold",
                backgroundColor: "#1e3a8a",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                textTransform: "uppercase",
                "&:hover": { backgroundColor: "#172554" },
              }}
            >
              DOWNLOAD EXCEL
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Attendance;

