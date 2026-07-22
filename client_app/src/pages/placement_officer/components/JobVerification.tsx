import { useEffect, useState } from "react";
import axios from "axios";

interface Job {
  id: number;
  batch: string;
  company_name: string;
  offer_letter: string;
  verified: boolean;
  uid: string;
  student_name: string;
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
  Checkbox,
  Button,
} from "@mui/material";
import { CheckCircle } from "lucide-react";
import { getCookie } from "@/utils";
const JobVerification = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = () => {
    axios
      .get("/api/placement/jobs/verify")
      .then((response) => setJobs(response.data))
      .catch((error) => console.error("Error fetching data:", error));
  };
  console.log(jobs);
  const handleVerify = async () => {
    try {
      const csrftoken = getCookie("csrftoken");
      await axios.post(
        `/api/placement/jobs/verify/selected/`,
        { jobIds: selectedIds },
        {
          headers: {
            "X-CSRFToken": csrftoken,
          },
          withCredentials: true,
        }
      );
      alert("Jobs verified successfully");
      fetchJobs();
      setSelectedIds([]);
    } catch (error) {
      console.error("Error verifying jobs:", error);
      alert("Failed to verify jobs");
    }
  };

  const handleCheckboxChange = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    );
  };

  return (
    <Box p={4}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Job Verification
          </Typography>
        </Toolbar>
      </AppBar>
      <TableContainer component={Paper} style={{ marginTop: 20 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>UID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Company Name</TableCell>
              <TableCell>Offer Letter</TableCell>
              <TableCell>Verified</TableCell>
              <TableCell>Select</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>{job.uid}</TableCell>
                <TableCell>{job.student_name}</TableCell>
                <TableCell>{job.company_name}</TableCell>
                <TableCell>
                  <a
                    href={job.offer_letter}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View
                  </a>
                </TableCell>
                <TableCell>{job.verified ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(job.id)}
                    onChange={() => handleCheckboxChange(job.id)}
                    disabled={job.verified}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box mt={2} textAlign="right">
        <Button
          variant="contained"
          color="primary"
          startIcon={<CheckCircle />}
          disabled={selectedIds.length === 0}
          onClick={handleVerify}
        >
          Verify Selected
        </Button>
      </Box>
    </Box>
  );
};

export default JobVerification;
