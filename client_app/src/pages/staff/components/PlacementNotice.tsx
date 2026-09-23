/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Grid,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
  Box,
} from "@mui/material";
import { api } from "@/lib/api";
import Notice from "../../placement_officer/components/notice";
import { getCookie } from "../../../utils";
import { NoticeData, NoticeTableRow } from "../../placement_officer/components/notice";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";

const emptyRow = (): NoticeTableRow => ({ type: "", salary: "", position: "" });

const PlacementNotice = () => {
  const [formData, setFormData] = useState({
    srNo: "",
    to: "",
    subject: "",
    date: "",
    intro: "",
    eligibility_criteria: "",
    about: "",
    skill_required: "",
    Documents_to_Carry: "",
    Walk_in_interview: "",
    Company_registration_Link: "",
    Note: "",
    From: "",
    From_designation: "",
    location: "",
  });

  // Dynamic job-offer rows (Type / CTC / Position)
  const [tableRows, setTableRows] = useState<NoticeTableRow[]>([emptyRow()]);

  const contentRef = useRef<HTMLDivElement>(null);
  const [noticeData, setNoticeData] = useState<NoticeData | null>(null);
  const reactPrintFn = useReactToPrint({ contentRef });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- Table row handlers ---
  const handleRowChange = (
    index: number,
    field: keyof NoticeTableRow,
    value: string
  ) => {
    const updated = tableRows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    setTableRows(updated);
  };

  const addRow = () => setTableRows([...tableRows, emptyRow()]);

  const removeRow = (index: number) => {
    if (tableRows.length === 1) return; // keep at least one row
    setTableRows(tableRows.filter((_, i) => i !== index));
  };

  const csrfToken = getCookie("csrftoken");

  const handleSubmit = (e: any) => {
    e.preventDefault();

    // Filter out completely blank rows before sending
    const validRows = tableRows.filter(
      (r) => r.type.trim() || r.salary.trim() || r.position.trim()
    );

    const payload = {
      subject: formData.subject,
      date: formData.date,
      intro: formData.intro,
      about: formData.about,
      company_registration_link: formData.Company_registration_Link,
      note: formData.Note,
      location: formData.location,
      sr_no: formData.srNo,
      to: formData.to,
      eligibility_criteria: formData.eligibility_criteria,
      // Persist structured table data as JSON string (legacy roles field)
      roles: JSON.stringify(validRows),
      skill_required: formData.skill_required,
      documents_to_carry: formData.Documents_to_Carry,
      walk_in_interview: formData.Walk_in_interview,
      from_field: formData.From,
      from_designation: formData.From_designation,
      notice_type: "Placement",
      tableData: validRows,
    };

    api
      .post("/api/staff/placement/notice/create/", payload, {
        headers: { "X-CSRFToken": csrfToken || "" },
        withCredentials: true,
      })
      .then((response) => {
        const saved = response.data.data;
        const preview: NoticeData = {
          srNo: saved.sr_no,
          to: saved.to,
          subject: saved.subject,
          date: saved.date,
          intro: saved.intro,
          eligibility_criteria: saved.eligibility_criteria,
          roles: saved.roles,
          about: saved.about,
          skill_required: saved.skill_required,
          Documents_to_Carry: saved.documents_to_carry,
          Walk_in_interview: saved.walk_in_interview,
          Company_registration_Link: saved.company_registration_link,
          Note: saved.note,
          From: saved.from_field,
          From_designation: saved.from_designation,
          companyId: "",
          noticeId: String(saved.id),
          // Use structured tableData from response or fall back to what we sent
          tableData: saved.table_data?.length ? saved.table_data : validRows,
          College_registration_Link: "",
          location: saved.location,
        };
        setNoticeData(preview);
        toast.success("Placement notice saved successfully!");
      })
      .catch((error) => {
        console.error("Error saving placement notice:", error);
        toast.error("Failed to save notice. Please check the form and try again.");
      });
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
        <Typography variant="h6" gutterBottom>
          Create Placement Notice
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* --- Basic Fields --- */}
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
                required
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
                required
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
                label="About Company"
                name="about"
                value={formData.about}
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

            {/* --- Job Offer Table (Type / CTC / Position) --- */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 1 }} />
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Job Offer Details (Type / CTC / Position)
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={addRow}
                >
                  + Add Row
                </Button>
              </Box>
              <Table size="small" sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}>
                <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>CTC / Stipend</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Position / Role</TableCell>
                    <TableCell sx={{ width: 48 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableRows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField
                          placeholder="e.g. Regular"
                          value={row.type}
                          onChange={(e) => handleRowChange(index, "type", e.target.value)}
                          size="small"
                          fullWidth
                          variant="standard"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          placeholder="e.g. 6 LPA"
                          value={row.salary}
                          onChange={(e) => handleRowChange(index, "salary", e.target.value)}
                          size="small"
                          fullWidth
                          variant="standard"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          placeholder="e.g. Software Engineer"
                          value={row.position}
                          onChange={(e) => handleRowChange(index, "position", e.target.value)}
                          size="small"
                          fullWidth
                          variant="standard"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeRow(index)}
                          disabled={tableRows.length === 1}
                          title="Remove row"
                        >
                          ✕
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Divider sx={{ mt: 1 }} />
            </Grid>

            {/* --- Remaining Fields --- */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Skills Required"
                name="skill_required"
                value={formData.skill_required}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
                label="From (Name)"
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
          <Notice formData={noticeData} ref={contentRef} isPlacement={true} />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            style={{ marginTop: "20px" }}
            onClick={() => reactPrintFn()}
          >
            Print / Save as PDF
          </Button>
        </div>
      )}
    </Container>
  );
};

export default PlacementNotice;
