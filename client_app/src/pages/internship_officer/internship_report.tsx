import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface InternshipReport {
  id: string;
  student_name: string;
  uid: string;
  company_name: string;
  domain_name: string;
  start_date: string;
  completion_date: string;
  total_hours: number;
  type: string;
  salary: number;
  is_verified: boolean;
  year: string;
  branch: string;
}

interface StipendStats {
  maximum: number;
  minimum: number;
  average: number;
  median: number;
}

import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  AppBar,
  Toolbar,
  Paper,
  TableRow,
  Button,
} from "@mui/material";
import {FileText } from "lucide-react";

const InternshipReport = () => {
  const [reports, setReports] = useState<InternshipReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [stipendStats, setStipendStats] = useState<StipendStats>({
    maximum: 0,
    minimum: 0,
    average: 0,
    median: 0,
  });

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    calculateStipendStats();
  }, [reports]);

  const calculateStipendStats = () => {
    if (reports.length === 0) return;

    const salaries = reports.map(report => report.salary);
    const maximum = Math.max(...salaries);
    const minimum = Math.min(...salaries);
    const average = Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length);
    
    // Calculate median
    const sorted = [...salaries].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    setStipendStats({
      maximum,
      minimum,
      average,
      median,
    });
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/internship/jobs/reports/");
      setReports(response.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setError("Failed to load internship reports");
      toast.error("Failed to load internship reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setDownloading(true);
      const statisticsData = {
        title: "Stipend Statistics",
        data: [
          ["", "Stipend offered"],
          ["Maximum", `₹${stipendStats.maximum.toLocaleString()}`],
          ["Minimum", `₹${stipendStats.minimum.toLocaleString()}`],
          ["Average", `₹${stipendStats.average.toLocaleString()}`],
          ["Median", `₹${stipendStats.median.toLocaleString()}`]
        ]
      };

      const response = await axios.get("/api/internship/jobs/download-report/", {
        params: {
          statistics: JSON.stringify(statisticsData)  // Sending formatted statistics data
        },
        responseType: 'blob'
      });
      
      // Create a blob from the response data
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      // Create a link element and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'internship_report.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <Typography>Loading reports...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Verified Internship Reports
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<FileText />}
            onClick={handleDownloadReport}
            disabled={downloading}
          >
            {downloading ? "Downloading..." : "Download Report"}
          </Button>
        </Toolbar>
      </AppBar>
      <TableContainer component={Paper} style={{ marginTop: 20, marginBottom: 20 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sr. No.</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>UID</TableCell>
              <TableCell>Student Name</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>Completion Date</TableCell>
              <TableCell>Company Name</TableCell>
              <TableCell>Stipend</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No verified internships found
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report, index) => (
                <TableRow key={report.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{report.branch}</TableCell>
                  <TableCell>{report.uid}</TableCell>
                  <TableCell>{report.student_name}</TableCell>
                  <TableCell>{new Date(report.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(report.completion_date).toLocaleDateString()}</TableCell>
                  <TableCell>{report.company_name || "In House"}</TableCell>
                  <TableCell>₹{report.salary.toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Stipend Statistics Table */}
      <TableContainer component={Paper} style={{ maxWidth: 400, margin: '20px auto' }}>
        <Typography variant="h6" style={{ padding: '16px', textAlign: 'center' }}>
          Stipend Statistics
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell align="right">Stipend offered</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Maximum</TableCell>
              <TableCell align="right">₹{stipendStats.maximum.toLocaleString()}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Minimum</TableCell>
              <TableCell align="right">₹{stipendStats.minimum.toLocaleString()}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Average</TableCell>
              <TableCell align="right">₹{stipendStats.average.toLocaleString()}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Median</TableCell>
              <TableCell align="right">₹{stipendStats.median.toLocaleString()}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default InternshipReport;
