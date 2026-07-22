/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import {
  Container,
  TextField,
  Button,
  MenuItem,
  Typography,
  Grid,
  Paper,
} from "@mui/material";
import axios from "axios";
import Notice from "../placement_officer/components/notice";
import { getCookie } from "../../utils";
import { NoticeData } from "../placement_officer/components/notice";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";
//

const InternshipNotice = () => {
  const [formData, setFormData] = useState({
    srNo: "",
    to: "",
    subject: "",
    date: "",
    intro: "",
    eligibility_criteria: "",
    roles: "",
    about: "",
    skill_required: "",
    Documents_to_Carry: "",
    Walk_in_interview: "",
    Company_registration_Link: "",
    Note: "",
    From: "",
    From_designation: "",
    company: "",
    location: "",
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const [noticeData, setNoticeData] = useState<NoticeData | null>(null);
  const reactPrintFn = useReactToPrint({ contentRef });
  interface Company {
    id: number;
    name: string;
    batch: string;
  }

  const [companies, setCompanies] = useState<Company[]>([]);

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const csrfToken = getCookie("csrftoken");
  useEffect(() => {
    axios
      .get("/api/internship/company/", {
        headers: {
          "X-CSRFToken": csrfToken || "",
        },
        withCredentials: true, // Ensure cookies are included in the request
      })
      .then((response) => {
        const formattedCompanies = response.data.map((item: any) => ({
          id: item.company.id,
          name: item.company.name,
          batch: item.company.batch,
        }));
        setCompanies(formattedCompanies);
      })
      .catch((error) => {
        console.error("Error fetching companies:", error);
      });
  }, []);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    axios
      .post(`/api/internship/notice/create/${formData.company}`, formData, {
        headers: {
          "X-CSRFToken": csrfToken || "",
        },
        withCredentials: true,
      })
      .then((response) => {
        setNoticeData(response.data.data);
        toast.success("Notice created successfully!");
      })
      .catch((error) => {
        console.error("Error creating notice:", error);
        alert("Failed to create notice!");
      });
  };
  const onPrint = () => {
    reactPrintFn();
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
        <Typography variant="h6" gutterBottom>
          Create Internship Notice
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                select
                label="Select Company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                fullWidth
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}-{company.batch}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Sr No"
                name="srNo"
                value={formData.srNo}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="To"
                name="to"
                value={formData.to}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Introduction"
                name="intro"
                value={formData.intro}
                onChange={handleChange}
                multiline
                rows={3}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Eligibility Criteria"
                name="eligibility_criteria"
                value={formData.eligibility_criteria}
                onChange={handleChange}
                multiline
                rows={3}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Roles"
                name="roles"
                value={formData.roles}
                onChange={handleChange}
                multiline
                rows={3}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="About"
                name="about"
                value={formData.about}
                onChange={handleChange}
                multiline
                rows={3}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Skills Required"
                name="skill_required"
                value={formData.skill_required}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Documents to Carry"
                name="Documents_to_Carry"
                value={formData.Documents_to_Carry}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Walk-in Interview Details"
                name="Walk_in_interview"
                value={formData.Walk_in_interview}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Company Registration Link"
                name="Company_registration_Link"
                value={formData.Company_registration_Link}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Note"
                name="Note"
                value={formData.Note}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="From"
                name="From"
                value={formData.From}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="From Designation"
                name="From_designation"
                value={formData.From_designation}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            style={{ marginTop: "20px" }}
          >
            Submit Notice
          </Button>
        </form>
      </Paper>
      {noticeData && (
        <div>
          <Notice formData={noticeData} ref={contentRef} isPlacement={false} />
          <Button
            variant="contained"
            color="primary"
            fullWidth={true}
            style={{ marginTop: "20px" }}
            onClick={onPrint}
          >
            Print Notice
          </Button>
        </div>
      )}
    </Container>
  );
};

export default InternshipNotice;
