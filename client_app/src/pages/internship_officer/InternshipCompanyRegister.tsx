/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
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
} from "@mui/material";
import { getCookie } from "@/utils";
import toast from "react-hot-toast";

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
        min_tenth_marks: parseFloat(formData.min_tenth_marks),
        min_higher_secondary_marks: parseFloat(
          formData.min_higher_secondary_marks
        ),
        min_cgpa: parseFloat(formData.min_cgpa),
        min_attendance: parseFloat(formData.min_attendance),
        is_kt: formData.is_kt,
        is_backLog: formData.is_backLog,
        domain: formData.domain,
        departments: formData.selectedDepartments.join(","),
        batch: formData.batch, // Added batch field to payload
      },
      offers: formData.jobOffers.map((offer) => ({
        type: offer.type,
        stipend: parseFloat(offer.stipend),
        position: offer.position,
      })),
    };

    console.log(payload);

    try {
      const csrfToken = getCookie("csrftoken");
      const response = await fetch("/api/internship/company/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken || "",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to register company");
      }

      const data = await response.json();
      console.log(data);
      toast.success("Company registered successfully:");
    } catch (error) {
      console.error("Error registering company:", error);
      alert("Error registering company. Check console for details.");
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
      </Container>
    </>
  );
};

export default InternshipCompanyRegister;
