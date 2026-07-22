/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Pagination,
  IconButton,
  Collapse
} from "@mui/material";
import { ChevronDown, ChevronRight, CheckCircle, X } from "lucide-react";
import { DeptStudentFormData } from "./types";
import { getCookie } from "../../utils";

// Helper Components
function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" component="span">
        {label}:{" "}
      </Typography>
      <Typography variant="body2" component="span" fontWeight="medium">
        {value ?? "N/A"}
      </Typography>
    </Box>
  );
}

function MetricCard({ label, value, max, unit = "" }: { label: string; value?: number | null; max: number; unit?: string }) {
  const percentage = value ? (value / max) * 100 : 0;
  const color: "success" | "warning" | "error" =
    percentage >= 75 ? "success" : percentage >= 50 ? "warning" : "error";

  return (
    <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
      <Typography variant="h4" color={`${color}.main`} fontWeight="bold">
        {value ?? "N/A"}{unit}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}

function StatusChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <Chip
      icon={active ? <CheckCircle size={16} /> : <X size={16} />}
      label={label}
      color={active ? "success" : "error"}
      variant="outlined"
      size="small"
    />
  );
}

function ProgressItem({ label, completed }: { label: string; completed?: boolean }) {
  return (
    <Grid item xs={6} sm={4}>
      <Stack direction="row" spacing={1} alignItems="center">
        {completed ? <CheckCircle size={16} /> : <X size={16} />}
        <Typography variant="body2">{label}</Typography>
      </Stack>
    </Grid>
  );
}

const getCardColor = (card: string) => {
  const colors: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
    Green: "success",
    Yellow: "warning",
    Red: "error",
    Blue: "info",
  };
  return colors[card] || "default";
};

const getStatusColor = (status: string) => {
  const colors: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
    joined: "success",
    accepted: "info",
    pending: "warning",
    rejected: "error",
  };
  return colors[status?.toLowerCase()] || "default";
};

function StudentRow({ studentData }: { studentData: DeptStudentFormData }) {
  const [open, setOpen] = useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </IconButton>
        </TableCell>
        <TableCell>{studentData.uid}</TableCell>
        <TableCell>{studentData.user?.full_name ?? "N/A"}</TableCell>
        <TableCell>{studentData.batch}</TableCell>
        <TableCell>{studentData.division}</TableCell>
        <TableCell>{studentData.user?.email}</TableCell>
        <TableCell>
            <Chip
                label={studentData.card ?? "No Card"}
                color={getCardColor(studentData.card ?? "")}
                size="small"
            />
        </TableCell>
        <TableCell>{parseFloat(studentData.cgpa?.toFixed(2) ?? "0")}</TableCell>
        <TableCell>{studentData.attendance}%</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Stack spacing={3}>
                {/* Basic Information */}
                <Card elevation={1}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" fontWeight="bold">
                        Basic Information
                      </Typography>
                    </Stack>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Stack spacing={1}>
                          <InfoRow label="UID" value={studentData.uid} />
                          <InfoRow label="Email" value={studentData.user?.email} />
                          <InfoRow label="Personal Email" value={studentData.personal_email} />
                          <InfoRow label="Contact" value={studentData.contact} />
                          <InfoRow label="Date of Birth" value={studentData.dob} />
                          <InfoRow label="Gender" value={studentData.gender} />
                        </Stack>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Stack spacing={1}>
                          <InfoRow label="Department" value={studentData.department} />
                          <InfoRow label="Division" value={studentData.division} />
                          <InfoRow label="Academic Year" value={studentData.academic_year} />
                          <InfoRow label="Batch" value={studentData.batch} />
                          <InfoRow label="Category" value={studentData.current_category} />
                          <InfoRow label="Consent" value={studentData.consent} />
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Academic Performance */}
                <Card elevation={1}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" mb={2}>
                      Academic Performance
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={6} sm={3}>
                        <MetricCard label="CGPA" value={parseFloat(studentData.cgpa?.toFixed(2) ?? "0")} max={10} />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <MetricCard label="Attendance" value={studentData.attendance} max={100} unit="%" />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <MetricCard label="10th Grade" value={studentData.tenth_grade} max={100} unit="%" />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <MetricCard label="12th Grade" value={studentData.higher_secondary_grade} max={100} unit="%" />
                      </Grid>
                    </Grid>

                    <Stack direction="row" spacing={2} mt={3} flexWrap="wrap">
                      <StatusChip label={studentData.is_kt ? "Has KT" : "No KT"} active={!studentData.is_kt} />
                      <StatusChip label={studentData.is_blacklisted ? "Blacklisted" : "Not Blacklisted"} active={!studentData.is_blacklisted} />
                      <StatusChip label={studentData.joined_company ? "Joined Company" : "Not Joined"} active={studentData.joined_company} />
                      <StatusChip label={studentData.is_dse_student ? "DSE Student" : "Regular Student"} active={studentData.is_dse_student} />
                    </Stack>

                    {/* Semester-wise Data */}
                    <Grid container spacing={3} mt={1}>
                      {studentData.academic_performance && studentData.academic_performance.length > 0 && (
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                            Semester-wise Performance
                          </Typography>
                          <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                              <TableHead sx={{ bgcolor: "background.default" }}>
                                <TableRow>
                                  <TableCell><strong>Semester</strong></TableCell>
                                  <TableCell align="right"><strong>SGPI</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {studentData.academic_performance.map((perf, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{perf.semester}</TableCell>
                                    <TableCell align="right">{perf.performance}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                      )}
                      
                      {studentData.academic_attendance && studentData.academic_attendance.length > 0 && (
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                            Semester-wise Attendance
                          </Typography>
                          <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                              <TableHead sx={{ bgcolor: "background.default" }}>
                                <TableRow>
                                  <TableCell><strong>Semester</strong></TableCell>
                                  <TableCell align="right"><strong>Attendance (%)</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {studentData.academic_attendance.map((att, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{att.semester}</TableCell>
                                    <TableCell align="right">{att.attendance}%</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>

                {/* Offers */}
                {studentData.offers && studentData.offers.length > 0 && (
                  <Card elevation={1}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" mb={2}>
                        Job Offers ({studentData.offers.length})
                      </Typography>
                      <Stack spacing={2}>
                        {studentData.offers.map((offer: any, index: number) => (
                          <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {offer.company_name}
                              </Typography>
                              <Chip label={offer.status} color={getStatusColor(offer.status)} size="small" />
                            </Stack>
                            <Typography variant="body2" color="text.secondary" mb={1}>
                              {offer.job_offer_info}
                            </Typography>
                            <Stack direction="row" spacing={2}>
                              <Chip label={`₹${(offer.salary / 100000).toFixed(1)}L`} size="small" variant="outlined" />
                              <Chip label={offer.offer_type} size="small" variant="outlined" />
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                {/* Applications */}
                {studentData.applications && studentData.applications.length > 0 && (
                  <Card elevation={1}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" mb={2}>
                        Applications ({studentData.applications.length})
                      </Typography>
                      {studentData.applications.map((app: any, index: number) => (
                        <Accordion key={index} defaultExpanded={index === 0}>
                          <AccordionSummary expandIcon={<ChevronDown />}>
                            <Stack direction="row" spacing={2} alignItems="center" width="100%">
                              <Typography fontWeight="bold">{app.company_name}</Typography>
                              {app.progress?.final_result && (
                                <Chip
                                  label={app.progress.final_result}
                                  size="small"
                                  color={app.progress.final_result === "Selected" ? "success" : "default"}
                                />
                              )}
                            </Stack>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Stack spacing={2}>
                              <Typography variant="body2" color="text.secondary">
                                {app.job_offer_info}
                              </Typography>
                              <Typography variant="body2">Applied: {app.application_date}</Typography>
                              {app.progress && (
                                <Box>
                                  <Typography variant="subtitle2" mb={1}>
                                    Progress:
                                  </Typography>
                                  <Grid container spacing={1}>
                                    <ProgressItem label="Registered" completed={app.progress.registered} />
                                    <ProgressItem label="Aptitude Test" completed={app.progress.aptitude_test} />
                                    <ProgressItem label="Coding Test" completed={app.progress.coding_test} />
                                    <ProgressItem label="Technical Interview" completed={app.progress.technical_interview} />
                                    <ProgressItem label="HR Interview" completed={app.progress.hr_interview} />
                                    <ProgressItem label="GD" completed={app.progress.gd} />
                                  </Grid>
                                </Box>
                              )}
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Training Performance */}
                {studentData.training_performance && studentData.training_performance.length > 0 && (
                  <Card elevation={1}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" mb={2}>
                        Training Performance
                      </Typography>
                      <Stack spacing={2}>
                        {studentData.training_performance.map((training: any, index: number) => (
                          <Accordion key={index}>
                            <AccordionSummary expandIcon={<ChevronDown />}>
                              <Stack direction="row" spacing={2} alignItems="center" width="100%">
                                <Typography fontWeight="bold">{training.training_type}</Typography>
                                <Chip label={training.semester} size="small" />
                                <Typography variant="body2" color="text.secondary">
                                  Avg: {training.average_marks}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" ml="auto">
                                  {training.date}
                                </Typography>
                              </Stack>
                            </AccordionSummary>
                            <AccordionDetails>
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell><strong>Category</strong></TableCell>
                                      <TableCell align="right"><strong>Marks</strong></TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {training.categories.map((cat: any, idx: number) => (
                                      <TableRow key={idx}>
                                        <TableCell>{cat.category_name}</TableCell>
                                        <TableCell align="right">{cat.marks}</TableCell>
                                      </TableRow>
                                    ))}
                                    <TableRow>
                                      <TableCell><strong>Total</strong></TableCell>
                                      <TableCell align="right"><strong>{training.total_marks}</strong></TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

function DepartmentStudentData() {
  const csrfToken = getCookie("csrftoken");
  const [students, setStudents] = useState<DeptStudentFormData[]>([]);
  const [uidInput, setUidInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchStudents = async (currentPage = 1, searchQuery = "") => {
    setError("");
    setLoading(true);
    try {
      let url = `/api/department_coordinator/student-data/?page=${currentPage}`;
      if (searchQuery) {
        url += `&uid=${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          "X-CSRFToken": csrfToken || "",
        },
        withCredentials: true,
      });
      
      if (response.data && response.data.results) {
        setStudents(response.data.results);
        setTotalCount(response.data.count);
        setTotalPages(Math.ceil(response.data.count / 10)); // Assuming page_size=10
      } else {
        setStudents([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (err: any) {
      setStudents([]);
      setError(err?.response?.data?.error || "Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(page, uidInput);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (event?: React.FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    if (page === 1) {
      fetchStudents(1, uidInput);
    } else {
      setPage(1);
    }
  };

  const handleClear = () => {
    setUidInput("");
    if (page === 1) {
      fetchStudents(1, "");
    } else {
      setPage(1);
    }
  };

  return (
    <Box maxWidth="1200px" mx="auto" p={4}>
      <Typography variant="h4" mb={3} fontWeight="bold" textAlign="center">
        Department Students
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSearch}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              fullWidth
              label="Advanced Search: Enter Student UID"
              variant="outlined"
              value={uidInput}
              onChange={(e) => setUidInput(e.target.value)}
              placeholder="e.g., 22-ITA50-26"
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ minWidth: 120, height: 56 }}
            >
              Search
            </Button>
            {uidInput && (
              <Button
                type="button"
                variant="outlined"
                onClick={handleClear}
                disabled={loading}
                sx={{ minWidth: 120, height: 56 }}
              >
                Clear
              </Button>
            )}
          </Stack>
        </form>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && students.length === 0 ? (
        <Box textAlign="center" my={5}>
          <CircularProgress size={60} />
          <Typography mt={2} color="text.secondary">
            Loading student data...
          </Typography>
        </Box>
      ) : (
        <React.Fragment>
          {students.length > 0 ? (
            <TableContainer component={Paper} elevation={3}>
              <Table aria-label="collapsible table">
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell />
                    <TableCell sx={{ fontWeight: "bold" }}>UID</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Batch</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Division</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Card</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>CGPA</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Attendance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => (
                    <StudentRow key={student.uid} studentData={student} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box textAlign="center" my={5} p={5} component={Paper} elevation={1}>
              <Typography variant="h6" color="text.secondary">
                No students found.
              </Typography>
            </Box>
          )}

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_e, value) => setPage(value)}
                color="primary"
                disabled={loading}
              />
            </Box>
          )}
          <Box display="flex" justifyContent="flex-end" mt={1}>
            <Typography variant="body2" color="text.secondary">
              Total records: {totalCount}
            </Typography>
          </Box>
        </React.Fragment>
      )}
    </Box>
  );
}

export default DepartmentStudentData;
