import { apiFetch } from "@/lib/api";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import {
  TextField,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Typography,
  Container,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Copy, ExternalLink, RefreshCw } from "lucide-react";
import { getCookie } from "@/utils";
import toast from "react-hot-toast";

interface RegisteredCompanyItem {
  company: {
    id: string;
    name: string;
    batch?: string;
    domain?: string;
    min_cgpa?: number;
    min_attendance?: number;
    is_kt?: boolean;
    departments?: string;
  };
  offers: Array<{
    id: string;
    position: string;
    stipend: number;
    type: string;
  }>;
}

const InternshipCompanyRegister = () => {
  interface FormDataType {
    name: string;
    min_tenth_marks: string;
    min_higher_secondary_marks: string;
    min_cgpa: string;
    min_attendance: string;
    is_kt: boolean;
    is_backLog: boolean;
    domain: string;
    Departments: string;
    selectedDepartments: string[];
    jobOffers: Array<{ type: string; stipend: string; position: string }>;
    batch: string;
  }

  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    min_tenth_marks: "",
    min_higher_secondary_marks: "",
    min_cgpa: "",
    min_attendance: "",
    is_kt: false,
    is_backLog: false,
    domain: "core",
    Departments: "all",
    selectedDepartments: [],
    jobOffers: [{ type: "", stipend: "", position: "" }],
    batch: "",
  });

  const [registeredCompanies, setRegisteredCompanies] = useState<
    RegisteredCompanyItem[]
  >([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const fetchRegisteredCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await apiFetch("/api/internship/company/", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setRegisteredCompanies(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch registered companies", err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    fetchRegisteredCompanies();
  }, []);

  const departmentOptions = [
    "CS",
    "IT",
    "AI & DS",
    "AL & ML",
    "CIVIL",
    "E & TC",
    "ELEX",
    "IOT",
    "MECH",
  ];

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleDepartmentChange = (e: any) => {
    const { value, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      selectedDepartments: checked
        ? [...prevData.selectedDepartments, value]
        : prevData.selectedDepartments.filter((dept) => dept !== value),
    }));
  };

  const handleJobOfferChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const updatedJobOffers = [...formData.jobOffers];
    updatedJobOffers[index] = {
      ...updatedJobOffers[index],
      [name as keyof (typeof updatedJobOffers)[typeof index]]: value,
    };
    setFormData({ ...formData, jobOffers: updatedJobOffers });
  };

  const addJobOffer = () => {
    setFormData((prevData) => ({
      ...prevData,
      jobOffers: [
        ...prevData.jobOffers,
        { type: "", stipend: "", position: "" },
      ],
    }));
  };

  const removeJobOffer = (index: any) => {
    setFormData((prevData) => ({
      ...prevData,
      jobOffers:
        prevData.jobOffers.length > 1
          ? prevData.jobOffers.filter((_, i) => i !== index)
          : prevData.jobOffers,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const payload = {
      company: {
        name: formData.name,
        min_tenth_marks: parseFloat(formData.min_tenth_marks) || 0,
        min_higher_secondary_marks:
          parseFloat(formData.min_higher_secondary_marks) || 0,
        min_cgpa: parseFloat(formData.min_cgpa) || 0,
        min_attendance: parseFloat(formData.min_attendance) || 0,
        is_kt: formData.is_kt,
        is_backLog: formData.is_backLog,
        domain: formData.domain,
        departments: formData.selectedDepartments.join(","),
        batch: formData.batch,
      },
      offers: formData.jobOffers.map((offer) => ({
        type: offer.type,
        stipend: parseFloat(offer.stipend) || 0,
        position: offer.position,
      })),
    };

    try {
      const csrfToken = getCookie("csrftoken");
      const response = await apiFetch("/api/internship/company/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken || "",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        let errMsg = "Failed to register company";
        try {
          const errData = await response.json();
          errMsg = errData.error || errData.message || JSON.stringify(errData);
        } catch (_) {}
        throw new Error(errMsg);
      }

      toast.success("Company drive registered successfully!");
      setFormData({
        name: "",
        min_tenth_marks: "",
        min_higher_secondary_marks: "",
        min_cgpa: "",
        min_attendance: "",
        is_kt: false,
        is_backLog: false,
        domain: "core",
        Departments: "all",
        selectedDepartments: [],
        jobOffers: [{ type: "", stipend: "", position: "" }],
        batch: "",
      });
      fetchRegisteredCompanies();
    } catch (error: any) {
      console.error("Error registering company:", error);
      toast.error(error.message || "Error registering company.");
    }
  };

  return (
    <>
      <Container component="main" maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
          <Typography component="h1" variant="h5">
            Company Registration
          </Typography>
          <Box component="form" sx={{ mt: 3 }} onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Name"
                  fullWidth
                  required
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="min_tenth_marks"
                  label="Minimum required 10th Marks"
                  type="number"
                  fullWidth
                  required
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="min_higher_secondary_marks"
                  label="Minimum required 12th Marks"
                  type="number"
                  fullWidth
                  required
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="min_cgpa"
                  label="Minimum required CGPA"
                  type="number"
                  fullWidth
                  required
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="min_attendance"
                  label="Minimum required Attendance"
                  type="number"
                  fullWidth
                  required
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="batch"
                  label="Batch"
                  fullWidth
                  required
                  type="text"
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="is_kt"
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label="Accepting Active KT"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="is_backLog"
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label="Accepting Backlogs"
                />
              </Grid>
              <Grid item xs={12}>
                <Select
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  fullWidth
                >
                  <MenuItem value="core">Core</MenuItem>
                  <MenuItem value="it">IT</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12}>
                <Select
                  name="Departments"
                  value={formData.Departments}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({
                      ...formData,
                      Departments: value,
                      selectedDepartments:
                        value === "all" ? [] : formData.selectedDepartments, // Clear when 'All' is selected
                    });
                  }}
                  fullWidth
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="select">Select Departments</MenuItem>
                </Select>
              </Grid>
              {formData.Departments === "select" && (
                <Grid item xs={12}>
                  <Grid container spacing={1}>
                    {departmentOptions.map((dept) => (
                      <Grid item xs={6} key={dept}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              value={dept}
                              checked={formData.selectedDepartments.includes(
                                dept
                              )} // Fix here
                              onChange={handleDepartmentChange}
                              color="primary"
                            />
                          }
                          label={dept}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              )}

              <Grid item xs={12}>
                <Typography variant="h6">Internship Offers</Typography>
                {formData.jobOffers.map((offer, index) => (
                  <Grid container spacing={2} key={index}>
                    <Grid item xs={4}>
                      <TextField
                        name="type"
                        label="Type"
                        value={offer.type}
                        onChange={(e) => handleJobOfferChange(index, e)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        name="stipend"
                        label="Stipend"
                        type="number"
                        value={offer.stipend}
                        onChange={(e) => handleJobOfferChange(index, e)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        name="position"
                        label="Position"
                        value={offer.position}
                        onChange={(e) => handleJobOfferChange(index, e)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        onClick={() => removeJobOffer(index)}
                        disabled={formData.jobOffers.length === 1}
                        color="error"
                      >
                        Remove
                      </Button>
                    </Grid>
                  </Grid>
                ))}
              </Grid>
              <Grid item xs={12}>
                <Button
                  onClick={addJobOffer}
                  variant="contained"
                  color="primary"
                >
                  Add Job Offer
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                >
                  Submit
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Active Registered Drives Table */}
        <Paper elevation={3} sx={{ p: 4, mt: 5, mb: 8 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Registered Internship Drives (
                {registeredCompanies.length} Active)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All currently active corporate internship drives and openings
              </Typography>
            </Box>
            <Button
              startIcon={<RefreshCw size={16} />}
              variant="outlined"
              size="small"
              onClick={fetchRegisteredCompanies}
              disabled={loadingCompanies}
            >
              Refresh
            </Button>
          </Box>

          {loadingCompanies ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={32} />
            </Box>
          ) : registeredCompanies.length === 0 ? (
            <Box textAlign="center" py={4} color="text.secondary">
              <Typography variant="body1">
                No internship drives registered yet.
              </Typography>
              <Typography variant="caption">
                Use the form above to register and post a new company drive.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#f5f7fa" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Company Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Batch</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Domain</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Min CGPA</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Min Att.</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Departments
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Positions & Stipend
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Student Link
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {registeredCompanies.map((item, idx) => {
                    const comp = item.company;
                    const offers = item.offers || [];
                    const driveUrl = `/student/internship/registration/${comp.id}`;
                    return (
                      <TableRow key={comp.id || idx} hover>
                        <TableCell sx={{ fontWeight: "600" }}>
                          {comp.name}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={comp.batch || "All"}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>
                          {comp.domain?.toUpperCase() || "CORE"}
                        </TableCell>
                        <TableCell>{comp.min_cgpa ?? "N/A"}</TableCell>
                        <TableCell>
                          {comp.min_attendance
                            ? `${comp.min_attendance}%`
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="caption"
                            sx={{ maxWidth: 150, display: "block" }}
                          >
                            {comp.departments || "All"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {offers.length === 0 ? (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              No offers
                            </Typography>
                          ) : (
                            offers.map((off, oIdx) => (
                              <Box key={off.id || oIdx} mb={0.5}>
                                <Chip
                                  label={`${off.position || "Intern"} (₹${
                                    off.stipend?.toLocaleString() || 0
                                  }/m)`}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                              </Box>
                            ))
                          )}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5}>
                            <Tooltip title="Copy Student Application URL">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const fullUrl = `${window.location.origin}${driveUrl}`;
                                  navigator.clipboard.writeText(fullUrl);
                                  toast.success(
                                    "Student application link copied to clipboard!"
                                  );
                                }}
                              >
                                <Copy size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Open Student Registration Form">
                              <IconButton
                                size="small"
                                component="a"
                                href={driveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink size={16} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
    </>
  );
};

export default InternshipCompanyRegister;
