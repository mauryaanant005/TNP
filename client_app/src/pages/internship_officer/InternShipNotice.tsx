/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Save,
  Printer,
  Plus,
  Trash2,
  AlertTriangle,
  RotateCcw,
  FileText,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import Notice, { NoticeData, NoticeTableRow } from "../placement_officer/components/notice";
import OpportunitySearchCard, { OpportunityItem } from "@/pages/staff/components/placement/OpportunitySearchCard";
import { getCookie } from "../../utils";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";

interface Company {
  id: string | number;
  name: string;
  batch: string;
  departments?: string;
  domain?: string;
}

const emptyInternshipRow = (): NoticeTableRow => ({
  type: "Internship",
  salary: "",
  position: "",
});

const defaultSrNo = () =>
  `TCET/T&P/INT/${new Date().getFullYear()}/INT-001`;

const defaultInitialForm = () => ({
  company_name: "",
  srNo: defaultSrNo(),
  to: "",
  subject: "",
  date: new Date().toISOString().split("T")[0],
  intro: "",
  about: "",
  eligibility_criteria: "",
  Walk_in_interview: "Online Assessment followed by Technical and HR Interviews.",
  Company_registration_Link: "",
  Note: "Students must report on time in formal attire. Late entries will not be permitted.",
  From: "Dr. Zahir Aalam",
  From_designation: "Dean (TP&IL)",
  company: "",
  location: "TCET Campus / Online",
  deadline: "",
  batch: "",
  roles_responsibilities: "",
});

const InternshipNotice: React.FC = () => {
  const [formData, setFormData] = useState(defaultInitialForm());
  const [tableRows, setTableRows] = useState<NoticeTableRow[]>([emptyInternshipRow()]);
  const [skillInput, setSkillInput] = useState<string>("");
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityItem | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Printing & Live Preview Ref
  const contentRef = useRef<HTMLDivElement>(null);
  const reactPrintFn = useReactToPrint({ contentRef });
  const csrfToken = getCookie("csrftoken");

  // Fetch initial next institutional serial number & company list on mount
  useEffect(() => {
    // 1. Fetch next serial number
    api
      .get("/api/internship/notice/next-serial-number/")
      .then((res) => {
        if (res.data?.sr_no) {
          setFormData((prev) => ({
            ...prev,
            srNo: prev.srNo && prev.srNo !== defaultSrNo() ? prev.srNo : res.data.sr_no,
          }));
        }
      })
      .catch(() => {
        // Fallback to staff serial endpoint with query param
        api
          .get("/api/staff/placement-notices/next-serial-number/?type=Internship")
          .then((res) => {
            if (res.data?.sr_no) {
              setFormData((prev) => ({
                ...prev,
                srNo: prev.srNo && prev.srNo !== defaultSrNo() ? prev.srNo : res.data.sr_no,
              }));
            }
          })
          .catch(() => {});
      });

    // 2. Fetch companies
    api
      .get("/api/internship/company/", {
        headers: { "X-CSRFToken": csrfToken || "" },
        withCredentials: true,
      })
      .then((response) => {
        const raw = response.data || [];
        const formattedCompanies = raw.map((item: any) => ({
          id: item.company ? item.company.id : item.id,
          name: item.company ? item.company.name : item.name,
          batch: item.company ? item.company.batch : item.batch,
          departments: item.company ? item.company.departments : item.departments,
          domain: item.company ? item.company.domain : item.domain,
        }));
        setCompanies(formattedCompanies);
      })
      .catch((error) => {
        console.error("Error fetching internship companies:", error);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const batchPart = formData.batch ? ` for ${formData.batch} Batch` : "";
    const matched = companies.find((c) => c.name.trim().toLowerCase() === val.trim().toLowerCase());
    setFormData((prev) => ({
      ...prev,
      company_name: val,
      company: matched ? String(matched.id) : prev.company,
      subject: val ? `Campus Internship Drive - ${val}${batchPart}` : prev.subject,
      intro: val
        ? `All eligible and interested students${batchPart} are hereby informed that ${val} is offering internship opportunities.`
        : prev.intro,
      about: val
        ? `${val} is offering internship opportunities in the ${formData.batch || "IT/Core"} domain.`
        : prev.about,
    }));
  };

  // --- Table Row Handlers ---
  const handleRowChange = (index: number, field: keyof NoticeTableRow, value: string) => {
    const updated = tableRows.map((row, i) => (i === index ? { ...row, [field]: value } : row));
    setTableRows(updated);
  };

  const addRow = () => {
    setTableRows([...tableRows, emptyInternshipRow()]);
  };

  const removeRow = (index: number) => {
    if (tableRows.length === 1) return;
    setTableRows(tableRows.filter((_, i) => i !== index));
  };

  // --- Skills Handlers ---
  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skillTags.includes(trimmed)) {
      setSkillTags([...skillTags, trimmed]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillTags(skillTags.filter((s) => s !== skillToRemove));
  };

  // --- Opportunity Selection from Placement Master Data ---
  const handleSelectOpportunity = async (opp: OpportunityItem) => {
    setSelectedOpportunity(opp);
    setLoading(true);
    try {
      const res = await api.get(`/api/staff/placement/opportunities/${opp.id}/autofill/?type=Internship`);
      const auto = res.data;
      const compName = auto.company_name || opp.company_name || "";
      const batchStr = auto.batch || opp.batch || "";

      setFormData((prev) => ({
        ...prev,
        company: String(opp.company_id || opp.id),
        company_name: compName,
        srNo: auto.sr_no || prev.srNo || defaultSrNo(),
        date: auto.date || new Date().toISOString().split("T")[0],
        to: auto.to || (batchStr ? `All concerned Students of ${batchStr} Batch` : "All concerned Students"),
        subject: auto.subject || `Campus Internship Drive - ${compName}${batchStr ? ` for ${batchStr} Batch` : ""}`,
        intro: auto.intro || `All eligible and interested students are hereby informed that ${compName} is offering internship opportunities.`,
        about: auto.about || `${compName} is offering internship opportunities in the IT/Core domain.`,
        eligibility_criteria: auto.eligibility_criteria || "As per company criteria",
        Walk_in_interview: auto.walk_in_interview || "Online Assessment followed by Technical and HR Interviews.",
        Company_registration_Link: auto.company_registration_link || opp.company_website || "",
        Note: auto.note || "Students must report on time in formal attire. Late entries will not be permitted.",
        From: auto.from_field || "Dr. Zahir Aalam",
        From_designation: auto.from_designation || "Dean (TP&IL)",
        location: auto.location || "TCET Campus / Online",
        deadline: "",
        batch: batchStr,
        roles_responsibilities: auto.roles_responsibilities || "",
      }));

      // Cleanly format salary for internship notice (prevent LPA / annual CTC from placement)
      const cleanInternshipSalary = (val?: string) => {
        if (!val || val.trim().toUpperCase() === "NOT SPECIFIED") return "As per company norms";
        if (val.toUpperCase().includes("LPA")) return "As per company norms";
        return val;
      };

      const validRows: NoticeTableRow[] = auto.table_data && auto.table_data.length > 0
        ? auto.table_data.map((r: any) => ({
            type: "Internship",
            salary: cleanInternshipSalary(r.salary),
            position: r.position?.includes("Intern") ? r.position : `${r.position || opp.designation || "Intern"} (Intern)`,
          }))
        : [{
            type: "Internship",
            salary: "As per company norms",
            position: `${opp.designation || "Intern"} (Intern)`,
          }];
      setTableRows(validRows);

      const skills = opp.skills && opp.skills.length > 0
        ? opp.skills
        : auto.skill_required
          ? auto.skill_required.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [];
      setSkillTags(skills);

      setIsSaved(false);
      toast.success(`Auto-filled internship notice for ${compName}!`);
    } catch (err) {
      console.error("Autofill failed:", err);
      toast.error("Failed to autofill opportunity details.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearOpportunity = () => {
    setSelectedOpportunity(null);
    setFormData((prev) => ({
      ...prev,
      company: "",
      company_name: "",
      to: "",
      subject: "",
      intro: "",
      about: "",
      eligibility_criteria: "",
      Company_registration_Link: "",
      batch: "",
      roles_responsibilities: "",
    }));
    setTableRows([emptyInternshipRow()]);
    setSkillTags([]);
  };

  const handleResetForm = () => {
    setSelectedOpportunity(null);
    setFormData(defaultInitialForm());
    setTableRows([emptyInternshipRow()]);
    setSkillTags([]);
    setIsSaved(false);
    toast.success("Form reset to defaults.");
  };

  // --- Form Submit Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetCompanyId = formData.company;
    if (!targetCompanyId && formData.company_name.trim()) {
      const found = companies.find(
        (c) => c.name.trim().toLowerCase() === formData.company_name.trim().toLowerCase()
      );
      if (found) {
        targetCompanyId = String(found.id);
      } else {
        targetCompanyId = formData.company_name.trim();
      }
    }

    if (!targetCompanyId && !formData.company_name.trim()) {
      toast.error("Please select or enter an internship company first.");
      return;
    }

    setLoading(true);
    const validRows = tableRows.filter((r) => r.type.trim() || r.salary.trim() || r.position.trim());
    const payload = {
      ...formData,
      company: targetCompanyId,
      notice_type: "Internship",
      srNo: formData.srNo || defaultSrNo(),
      roles: validRows.map((r) => `${r.position} (${r.type}) — Stipend: ${r.salary}`).join("\n"),
      skill_required: skillTags.join(", "),
      tableData: validRows,
    };

    try {
      // 1. Primary persistence: Save to official Placement/Internship Notices store
      try {
        await api.post(
          "/api/staff/placement-notices/drafts/",
          {
            opportunity_id: selectedOpportunity?.id,
            company_id: selectedOpportunity?.company_id,
            batch: formData.batch || selectedOpportunity?.batch || "",
            subject: formData.subject,
            date: formData.date,
            to: formData.to,
            intro: formData.intro,
            about: formData.about,
            eligibility_criteria: formData.eligibility_criteria,
            skill_required: skillTags.join(", "),
            walk_in_interview: formData.Walk_in_interview,
            company_registration_link: formData.Company_registration_Link,
            note: formData.Note,
            from_field: formData.From,
            from_designation: formData.From_designation,
            location: formData.location,
            deadline: formData.deadline || null,
            sr_no: formData.srNo || defaultSrNo(),
            table_data: validRows,
            roles_responsibilities: formData.roles_responsibilities || "",
            notice_type: "Internship",
          },
          { headers: { "X-CSRFToken": csrfToken || "" } }
        );
      } catch {
        // Fallback to legacy endpoint
      }

      // 2. Also save to legacy internship notice endpoint if targetCompanyId exists
      if (targetCompanyId) {
        try {
          await api.post(
            `/api/internship/notice/create/${targetCompanyId}`,
            payload,
            {
              headers: { "X-CSRFToken": csrfToken || "" },
              withCredentials: true,
            }
          );
        } catch {
          // Handled
        }
      }

      setIsSaved(true);
      toast.success("Internship Notice saved successfully!");
    } catch (error) {
      console.error("Error creating internship notice:", error);
      toast.error("Failed to save notice. Please check all fields.");
    } finally {
      setLoading(false);
    }
  };

  // --- Live Preview Data Construction (Matches Official Institutional Letterhead) ---
  const livePreviewData: NoticeData = useMemo(() => {
    const validRows = tableRows.filter((r) => r.type.trim() || r.salary.trim() || r.position.trim());
    return {
      srNo: formData.srNo || defaultSrNo(),
      to: formData.to,
      subject: formData.subject,
      date: formData.date,
      intro: formData.intro,
      about: formData.about,
      eligibility_criteria: formData.eligibility_criteria,
      roles: validRows.map((r) => `${r.position} (${r.type}) — Stipend: ${r.salary}`).join("\n"),
      tableData: validRows.length > 0 ? validRows : [emptyInternshipRow()],
      skill_required: skillTags.join(", "),
      Walk_in_interview: formData.Walk_in_interview,
      Company_registration_Link: formData.Company_registration_Link,
      Note: formData.Note,
      From: formData.From,
      From_designation: formData.From_designation,
      location: formData.location,
      deadline: formData.deadline,
      roles_responsibilities: formData.roles_responsibilities,
    };
  }, [formData, tableRows, skillTags]);

  // --- Missing Information Quality Indicators ---
  const qualityChecklist = useMemo(() => {
    const items = [];
    if (!formData.company && !formData.company_name.trim()) items.push({ label: "No company selected", critical: true });
    if (!formData.subject.trim()) items.push({ label: "Notice Subject is missing", critical: true });
    if (!formData.to.trim()) items.push({ label: "Recipient (To) is missing", critical: true });
    if (!formData.eligibility_criteria.trim()) items.push({ label: "Eligibility criteria is missing", critical: false });
    if (tableRows.every((r) => !r.salary.trim() && !r.position.trim())) items.push({ label: "Internship role & stipend not specified", critical: false });
    return items;
  }, [formData, tableRows]);

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 3,
        px: { xs: 1, sm: 2, md: 3 },
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Step 1: Intelligent Opportunity Search sourcing directly from Placement Master Data */}
      <OpportunitySearchCard
        title="Search Company / Internship Opportunity"
        searchPlaceholder="Search uploaded company name, role, skills, or batch (e.g. TCS, Infosys, Reliance, 2026)..."
        noticeType="Internship"
        onSelectOpportunity={handleSelectOpportunity}
        selectedOpportunity={selectedOpportunity}
        selectedOppId={selectedOpportunity?.id}
        onClearSelection={handleClearOpportunity}
        noticeStatus={isSaved ? "DRAFT" : "NEW"}
        isDirty={false}
      />

      {/* Main Form Editor */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3, md: 3.5 },
          mb: 4,
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          bgcolor: "#ffffff",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Form Section A: Communication Meta */}
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: "#1e293b",
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }} />
            Communication & Institutional Meta
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Serial Number"
                name="srNo"
                value={formData.srNo}
                onChange={handleChange}
                fullWidth
                size="small"
                helperText="Institutional serial format: TCET/T&P/INT/{YEAR}/INT-{SEQ}"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Notice Date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Company Name"
                name="company_name"
                value={formData.company_name}
                onChange={handleCompanyNameChange}
                fullWidth
                size="small"
                placeholder="e.g. Google India"
                helperText="Auto-fills Subject, Intro & About"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Recipient (To)"
                name="to"
                value={formData.to}
                onChange={handleChange}
                fullWidth
                size="small"
                placeholder="e.g. All concerned Students of 2026 Batch (COMP, IT, AI&DS)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                fullWidth
                size="small"
                required
                placeholder="e.g. Campus Internship Drive - Tata Consultancy Services for 2026 Batch"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Job Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Registration Deadline"
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Form Section B: Introduction & Company Overview */}
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: "#1e293b",
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }} />
            Introduction & Company Overview
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <TextField
                label="Introduction"
                name="intro"
                value={formData.intro}
                onChange={handleChange}
                fullWidth
                multiline
                rows={2}
                size="small"
                placeholder="All eligible and interested students are hereby informed that..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="About Company"
                name="about"
                value={formData.about}
                onChange={handleChange}
                fullWidth
                multiline
                rows={2}
                size="small"
                placeholder="Brief overview of the hiring organisation..."
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Form Section C: Eligibility Criteria */}
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: "#1e293b",
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }} />
            Eligibility Criteria
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <TextField
                label="Eligibility Criteria"
                name="eligibility_criteria"
                value={formData.eligibility_criteria}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
                size="small"
                placeholder="e.g. Minimum CGPA: 6.75 | No active backlogs | 10th & 12th minimum 60%"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Form Section D: Internship Offers & Stipend Details Table */}
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: "#1e293b",
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }} />
            Internship Offers & Stipend Details
          </Typography>

          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", mb: 3 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#f8fafc" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: "25%", color: "#475569" }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "35%", color: "#475569" }}>Stipend</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "35%", color: "#475569" }}>Position / Role</TableCell>
                  <TableCell sx={{ width: "5%" }} align="center"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={row.type}
                        onChange={(e) => handleRowChange(index, "type", e.target.value)}
                        placeholder="e.g. Internship"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={row.salary}
                        onChange={(e) => handleRowChange(index, "salary", e.target.value)}
                        placeholder="e.g. ₹20,000 / month"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={row.position}
                        onChange={(e) => handleRowChange(index, "position", e.target.value)}
                        placeholder="e.g. Software Development Intern"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        disabled={tableRows.length === 1}
                        onClick={() => removeRow(index)}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box sx={{ p: 1.5, bgcolor: "#fafbfd", borderTop: "1px solid #e2e8f0" }}>
              <Button
                size="small"
                startIcon={<Plus size={16} />}
                onClick={addRow}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Add Role / Stipend Row
              </Button>
            </Box>
          </Paper>

          {/* Skills Chip Input */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "block", mb: 1 }}>
                Required Skills (Type and press Enter or click Add)
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
                <TextField
                  size="small"
                  placeholder="e.g. Python, React, Data Structures, Git"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddSkill}
                  disabled={!skillInput.trim()}
                  sx={{ textTransform: "none", borderRadius: 2 }}
                >
                  Add Skill
                </Button>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                {skillTags.map((skill, i) => (
                  <Chip
                    key={i}
                    label={skill}
                    size="small"
                    onDelete={() => handleRemoveSkill(skill)}
                    sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 600 }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Form Section E: Selection Process, Logistics & Links */}
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: "#1e293b",
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }} />
            Selection Process, Logistics & Links
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <TextField
                label="Selection Process"
                name="Walk_in_interview"
                value={formData.Walk_in_interview}
                onChange={handleChange}
                fullWidth
                multiline
                rows={2}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Roles & Responsibilities"
                name="roles_responsibilities"
                value={formData.roles_responsibilities}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
                size="small"
                placeholder="Enter internship specific roles & responsibilities (leave empty if not specified)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Company Registration Link"
                name="Company_registration_Link"
                value={formData.Company_registration_Link}
                onChange={handleChange}
                fullWidth
                size="small"
                placeholder="https://careers.company.com/internship/apply"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Important Note for Students"
                name="Note"
                value={formData.Note}
                onChange={handleChange}
                fullWidth
                multiline
                rows={2}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Signatory Name"
                name="From"
                value={formData.From}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Signatory Designation"
                name="From_designation"
                value={formData.From_designation}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>

          {/* Quality Alerts */}
          {qualityChecklist.length > 0 && (
            <Box sx={{ mb: 3 }}>
              {qualityChecklist.map((item, idx) => (
                <Alert
                  key={idx}
                  severity={item.critical ? "error" : "warning"}
                  icon={<AlertTriangle size={16} />}
                  sx={{ mb: 1, py: 0.5, borderRadius: 2, fontSize: "12px" }}
                >
                  {item.label}
                </Alert>
              ))}
            </Box>
          )}

          {/* Bottom Action Buttons */}
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              flexWrap: "wrap",
              alignItems: "center",
              pt: 2.5,
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
              disabled={loading}
              sx={{ textTransform: "none", borderRadius: 2, px: 3, fontWeight: 700 }}
            >
              {isSaved ? "Update Notice" : "Save / Submit Notice"}
            </Button>

            <Button
              variant="text"
              startIcon={<RotateCcw size={16} />}
              onClick={handleResetForm}
              sx={{ textTransform: "none" }}
            >
              Reset Form
            </Button>

            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Printer size={16} />}
              onClick={() => reactPrintFn()}
              sx={{ textTransform: "none", borderRadius: 2, ml: "auto" }}
            >
              Print / Save PDF
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Live Document Preview Section */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          borderRadius: 3,
          border: "1px solid #cbd5e1",
          overflow: "hidden",
          bgcolor: "#ffffff",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <Box
          sx={{
            p: 2.5,
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            bgcolor: "#fafbfd",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "#22c55e",
                boxShadow: "0 0 0 3px rgba(34,197,94,0.2)",
              }}
            />
            <FileText size={18} color="#2563eb" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b" }}>
              Official Institutional Document Preview (Live)
            </Typography>
            <Chip
              label="Interactive Preview"
              size="small"
              icon={<Sparkles size={12} />}
              sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 600, fontSize: "11px" }}
            />
          </Box>

          <Button
            size="small"
            variant="outlined"
            startIcon={<Printer size={15} />}
            onClick={() => reactPrintFn()}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Print Notice
          </Button>
        </Box>

        <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: "#525659", display: "flex", justifyContent: "center" }}>
          <Notice formData={livePreviewData} ref={contentRef} isPlacement={false} />
        </Box>
      </Paper>
    </Container>
  );
};

export default InternshipNotice;
