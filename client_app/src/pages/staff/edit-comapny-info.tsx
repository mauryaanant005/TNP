/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Container, Paper, Typography, Box, Grid, Button } from "@mui/material";
import toast from "react-hot-toast";
import { getCookie } from "@/utils";
import CompanyDetailsForm from "./components/placement/CompanyDetailsForm";
import EligibilityForm from "./components/placement/EligibilityForm";
import DomainDepartmentsForm from "./components/placement/DomainDepartment";
import JobOffersForm from "./components/placement/JobOffersForm";
import CompanyNotice from "./components/placement/CompanyNotice";
import type { FormDataType, NoticeType } from "./placement_company";
const EditCompanyInfo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchParamId = searchParams.get("id");
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
    id: 0, // Added the missing 'id' property
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
   useEffect(()=>{
    if(!searchParamId){
      toast.error("Company ID is required");
      navigate(-1);
      return;
    }
    const fetchCompanyData = async()=>{
      try{
        const response = await fetch(`/api/staff/placement/company/${searchParamId}/`,{
          method:"GET",
          headers:{
            "Content-Type":"application/json",
            "X-CSRFToken":getCookie("csrftoken")||""
          }
        });
        if(!response.ok){
          throw new Error("Failed to fetch company data");
        }
        const data = await response.json();
        setFormData({
          id: data.id || 0, // Ensure 'id' is included
          name: data.name,
          min_tenth_marks: data.min_tenth_marks,
          min_higher_secondary_marks: data.min_higher_secondary_marks,
          min_cgpa: data.min_cgpa,
          accepted_kt: data.accepted_kt,
          domain: data.domain,
          departments: data.departments,
          is_aedp_or_pli: data.is_aedp_or_pli,
          is_aedp_or_ojt: data.is_aedp_or_ojt,
          selected_departments: data.selected_departments,
          job_offers: data.job_offers.length > 0 ? data.job_offers : [{ role: "", salary: "", skills: "" }],
          batch: data.batch,
          notice: data.notice || Notice,
        });
      }catch(error:any){
        console.error("Error fetching company data:",error);
        toast.error(error.message||"Something went wrong");
      }
    }
    fetchCompanyData();
   },[searchParamId])
  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if(!searchParamId){
        toast.error("Company ID is required");
        return;
      }
      const csrfToken = getCookie("csrftoken");
      const response = await fetch(`/api/staff/placement/company/${searchParamId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken || "",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update company info");
      toast.success("Company info updated successfully!");
      navigate(-1);
    } catch (error) {
      console.error("Error updating company info:", error);
      toast.error("Error updating company info");
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

export default EditCompanyInfo;
