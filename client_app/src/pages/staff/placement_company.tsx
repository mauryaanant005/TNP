// PlacementCompany.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Container, Paper, Typography, Box, Grid, Button } from "@mui/material";
import toast from "react-hot-toast";
import { getCookie } from "@/utils";

import CompanyDetailsForm from "./components/placement/CompanyDetailsForm";
import EligibilityForm from "./components/placement/EligibilityForm";
import DomainDepartmentsForm from "./components/placement/DomainDepartment";
import JobOffersForm from "./components/placement/JobOffersForm";
import CompanyNotice from "./components/placement/CompanyNotice";

export interface JobOffer {
  role: string;
  salary: string;
  skills: string;
}

export interface NoticeType {
  subject: string;
  date: string;
  intro: string;
  about: string;
  company_registration_link: string;
  note: string;
  location: string;
  deadline: string;
}

export interface FormDataType {
  id: number;
  name: string;
  min_tenth_marks: string;
  min_higher_secondary_marks: string;
  min_cgpa: string;
  accepted_kt: boolean;
  domain: string;
  departments: string;
  is_aedp_or_pli: boolean;
  is_aedp_or_ojt: boolean;
  selected_departments: string[];
  job_offers: JobOffer[];
  notice: NoticeType;
  batch: string;
}

const PlacementCompany = () => {
  const navigate = useNavigate();
  const Notice: NoticeType = {
    subject: "",
    date: "",
    intro: "",
    about: "",
    company_registration_link: "",
    note: "",
    location: "",
    deadline: "",
  };
  const [formData, setFormData] = useState<FormDataType>({
    id: 0,
    name: "",
    min_tenth_marks: "",
    min_higher_secondary_marks: "",
    min_cgpa: "",
    accepted_kt: false,
    domain: "core",
    departments: "all",
    is_aedp_or_pli: false,
    is_aedp_or_ojt: false,
    selected_departments: [],
    job_offers: [{ role: "", salary: "", skills: "" }],
    batch: "",
    notice: Notice,
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const csrfToken = getCookie("csrftoken");
      const response = await fetch("/api/staff/placement/company/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken || "",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to register company");

      toast.success("Company registered successfully!");
      navigate(`/placement_officer/company_register`);
    } catch (error) {
      console.error("Error registering company:", error);
      alert("Error registering company. Check console for details.");
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography component="h1" variant="h5">
          Company Registration
        </Typography>
        <Box component="form" sx={{ mt: 3 }} onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <CompanyDetailsForm
              formData={formData}
              handleChange={handleChange}
            />
            <EligibilityForm formData={formData} handleChange={handleChange} />
            <DomainDepartmentsForm
              formData={formData}
              setFormData={setFormData}
            />
            <JobOffersForm formData={formData} setFormData={setFormData} />
            <CompanyNotice formData={formData} setFormData={setFormData} />
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
  );
};

export default PlacementCompany;
