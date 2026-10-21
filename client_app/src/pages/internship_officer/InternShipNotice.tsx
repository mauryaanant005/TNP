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
import { api } from "@/lib/api";
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

  const handleCompanySelect = async (companyId: string) => {
    if (!companyId) {
      setFormData({
        srNo: "",
        to: "",
        subject: "",
        date: "",
        intro: "",
        eligibility_criteria: "",
        roles: "",
        about: "",
        skill_required: "",
        Walk_in_interview: "",
        Company_registration_Link: "",
        Note: "",
        From: "",
        From_designation: "",
        company: "",
        location: "",
      });
      return;
    }

    // Set company id immediately and clean out stale values
    setFormData({
      srNo: "",
      to: "",
      subject: "",
      date: new Date().toISOString().split("T")[0],
      intro: "",
      eligibility_criteria: "",
      roles: "",
      about: "",
      skill_required: "",
      Walk_in_interview: "Online Assessment followed by Technical and HR Interviews.",
      Company_registration_Link: "",
      Note: "Students must report on time in formal attire. Late entries will not be permitted.",
      From: "Dr. Zahir Aalam",
      From_designation: "Dean (TP&IL)",
      company: companyId,
      location: "TCET Campus / Online",
    });

    try {
      // 1. Check if a saved notice already exists for this company
      try {
        const noticeRes = await api.get(`/api/internship/notice/${companyId}`, {
          headers: { "X-CSRFToken": csrfToken || "" },
          withCredentials: true,
        });
        if (noticeRes.data?.data) {
          const n = noticeRes.data.data;
          setFormData({
            srNo: n.sr_no || "",
            to: n.to || "",
            subject: n.subject || "",
            date: n.date || new Date().toISOString().split("T")[0],
            intro: n.intro || "",
            eligibility_criteria: n.eligibility_criteria || "",
            roles: n.roles || "",
            about: n.about || "",
            skill_required: n.skill_required || "",
            Walk_in_interview: n.walk_in_interview || "Online Assessment followed by Technical and HR Interviews.",
            Company_registration_Link: n.company_registration_link || "",
            Note: n.note || "Students must report on time in formal attire. Late entries will not be permitted.",
            From: n.from_field || "Dr. Zahir Aalam",
            From_designation: n.from_designation || "Dean (TP&IL)",
            company: companyId,
            location: n.location || "TCET Campus / Online",
          });
          toast.success("Loaded saved notice draft for company!");
          return;
        }
      } catch {
        // No saved notice yet, fall through to company master data
      }

      // 2. Fetch company master data and associated offers
      const compRes = await api.get(`/api/internship/company/${companyId}`, {
        headers: { "X-CSRFToken": csrfToken || "" },
        withCredentials: true,
      });

      const compData = compRes.data?.company;
      const offersData = compRes.data?.offers || [];

      if (compData) {
        const batchStr = compData.batch ? `${compData.batch} Batch` : "";
        const deptsStr = compData.departments && compData.departments !== "all" ? ` (${compData.departments})` : "";

        // Build eligibility criteria string
        const critParts: string[] = [];
        if (compData.min_cgpa) critParts.push(`Minimum CGPA: ${compData.min_cgpa}`);
        if (compData.min_attendance) critParts.push(`Minimum Attendance: ${compData.min_attendance}%`);
        if (compData.min_tenth_marks) critParts.push(`10th: ${compData.min_tenth_marks}%`);
        if (compData.min_higher_secondary_marks) critParts.push(`12th/Diploma: ${compData.min_higher_secondary_marks}%`);
        if (compData.is_kt === false) critParts.push("No active KT");
        if (compData.is_backlog === false) critParts.push("No backlogs permitted");

        // Build roles string from offers
        const rolesList = offersData
          .map((o: any) => {
            const stip = o.stipend ? `₹${Number(o.stipend).toLocaleString()} / month` : "Unpaid";
            return `• ${o.position || "Intern"} (${o.type || "Internship"}) — Stipend: ${stip}`;
          })
          .join("\n");

        setFormData({
          srNo: "",
          to: batchStr ? `All concerned Students of ${batchStr}${deptsStr}` : `All concerned Students${deptsStr}`,
          subject: `Campus Internship Drive - ${compData.name}${batchStr ? ` for ${batchStr}` : ""}`,
          date: new Date().toISOString().split("T")[0],
          intro: `All eligible and interested students${batchStr ? ` of ${batchStr}` : ""} are hereby informed that ${compData.name} is conducting an internship recruitment drive.`,
          eligibility_criteria: critParts.length > 0 ? critParts.join(" | ") : "As per company criteria",
          roles: rolesList,
          about: `${compData.name} is offering internship opportunities in the ${compData.domain || "core/IT"} domain.`,
          skill_required: "",
          Walk_in_interview: "Online Assessment followed by Technical and HR Interviews.",
          Company_registration_Link: "",
          Note: "Students must report on time in formal attire. Late entries will not be permitted.",
          From: "Dr. Zahir Aalam",
          From_designation: "Dean (TP&IL)",
          company: companyId,
          location: "TCET Campus / Online",
        });
        toast.success(`Auto-filled internship details for ${compData.name}!`);
      }
    } catch (err) {
      console.error("Failed to auto-fill company details:", err);
    }
  };

  const handleChange = (e: any) => {
    if (e.target.name === "company") {
      handleCompanySelect(e.target.value);
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };
  const csrfToken = getCookie("csrftoken");
  useEffect(() => {
    api
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
    api
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
