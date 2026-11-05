/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  TextField,
  Button,
  Typography,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogContent,
} from "@mui/material";
import {
  Menu,
  Save,
  Send,
  Copy,
  History,
  ShieldCheck,
  Printer,
  Plus,
  Trash2,
  AlertTriangle,
  RotateCcw,
  FileText,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Eye,
  Edit3,
  Download,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileEdit,
  Sparkles,
  Building2,
} from "lucide-react";
import { api } from "@/lib/api";
import { getCookie } from "../../../utils";
import Notice, { NoticeData, NoticeTableRow } from "../../placement_officer/components/notice";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";
import { useStaffLayout } from "../StaffLayout";

// Modals & Subcomponents
import OpportunitySearchCard, { OpportunityItem } from "./placement/OpportunitySearchCard";
import NoticeVersionHistoryModal from "./placement/NoticeVersionHistoryModal";
import NoticeAuditLogsModal from "./placement/NoticeAuditLogsModal";
import SavedDraftsModal from "./placement/SavedDraftsModal";

const emptyRow = (): NoticeTableRow => ({ type: "Regular", salary: "", position: "" });

export interface PlacementNoticeProps {
  activeTab?: string;
  onTabChange?: (tab: any) => void;
}

const NOTICE_TABS = [
  { key: "placement", label: "Placement" },
  { key: "internship", label: "Internship" },
  { key: "training", label: "Training" },
  { key: "Infrastructure", label: "Infrastructure" },
  { key: "Duty Chart", label: "Duty Chart" },
];

const PlacementNotice: React.FC<PlacementNoticeProps> = ({
  activeTab = "placement",
  onTabChange,
}) => {
  const { toggleSidebar } = useStaffLayout();

  // --- Selected Opportunity Context ---
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityItem | null>(null);
  const [noticeId, setNoticeId] = useState<number | null>(null);
  const [noticeStatus, setNoticeStatus] = useState<"NEW" | "DRAFT" | "PUBLISHED">("NEW");
  const [versionCount, setVersionCount] = useState<number>(1);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // --- Responsive & Workspace View Controls ---
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [zoom, setZoom] = useState<number>(90);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [searchCardCollapsed, setSearchCardCollapsed] = useState<boolean>(false);

  // --- Form State ---
  const [formData, setFormData] = useState({
    company_name: "",
    srNo: "",
    to: "",
    subject: "",
    date: new Date().toISOString().split("T")[0],
    intro: "",
    about: "",
    eligibility_criteria: "",
    Walk_in_interview: "Online Assessment followed by Technical and HR Interviews.",
    Company_registration_Link: "",
    College_registration_Link: "",
    Note: "Students must report on time in formal attire. Late entries will not be permitted.",
    From: "Dr. Zahir Aalam",
    From_designation: "Dean (TP&IL)",
    location: "TCET Campus / Online",
    deadline: "",
    batch: "",
    roles_responsibilities: "",
  });

  // Dynamic job-offer rows (Type / CTC / Position)
  const [tableRows, setTableRows] = useState<NoticeTableRow[]>([emptyRow()]);

  // Dynamic Skill Chips
  const [skillInput, setSkillInput] = useState<string>("");
  const [skillTags, setSkillTags] = useState<string[]>([]);

  // Modals state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [draftsOpen, setDraftsOpen] = useState(false);

  // Printing & Live Preview Ref
  const contentRef = useRef<HTMLDivElement>(null);
  const fullscreenContentRef = useRef<HTMLDivElement>(null);

  const printDocumentTitle = useMemo(() => {
    const cleanCompany = formData.company_name ? formData.company_name.replace(/[^a-zA-Z0-9_-]/g, "_") : "TCET";
    const cleanSr = formData.srNo ? formData.srNo.replace(/[^a-zA-Z0-9_-]/g, "_") : "Draft";
    return `${cleanCompany}_Notice_${cleanSr}`;
  }, [formData.company_name, formData.srNo]);

  const reactPrintFn = useReactToPrint({
    contentRef,
    documentTitle: printDocumentTitle,
  });

  const fullscreenPrintFn = useReactToPrint({
    contentRef: fullscreenContentRef,
    documentTitle: printDocumentTitle,
  });

  // Warn user before navigating away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Initial next serial number on mount
  useEffect(() => {
    api
      .get("/api/staff/placement-notices/next-serial-number/")
      .then((res) => {
        if (res.data?.sr_no && !formData.srNo) {
          setFormData((prev) => ({ ...prev, srNo: res.data.sr_no }));
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsDirty(true);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDirty(true);
    const newName = e.target.value;
    const batchPart = formData.batch ? ` for ${formData.batch} Batch` : "";
    setFormData((prev) => ({
      ...prev,
      company_name: newName,
      subject: newName ? `Campus Recruitment Drive - ${newName}${batchPart}` : prev.subject,
      intro: newName
        ? `All eligible and interested students are hereby informed that ${newName} is conducting a campus recruitment drive.`
        : prev.intro,
      about: newName ? `${newName} is a leading organization in its industry.` : prev.about,
    }));
  };

  // --- Table Row Handlers ---
  const handleRowChange = (index: number, field: keyof NoticeTableRow, value: string) => {
    setIsDirty(true);
    const updated = tableRows.map((row, i) => (i === index ? { ...row, [field]: value } : row));
    setTableRows(updated);
  };

  const addRow = () => {
    setIsDirty(true);
    setTableRows([...tableRows, emptyRow()]);
  };

  const removeRow = (index: number) => {
    if (tableRows.length === 1) return;
    setIsDirty(true);
    setTableRows(tableRows.filter((_, i) => i !== index));
  };

  // --- Skills Handlers ---
  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skillTags.includes(trimmed)) {
      setIsDirty(true);
      setSkillTags([...skillTags, trimmed]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setIsDirty(true);
    setSkillTags(skillTags.filter((s) => s !== skillToRemove));
  };

  // --- Opportunity Selection Handler ---
  const handleSelectOpportunity = async (opp: OpportunityItem) => {
    if (isDirty && selectedOpportunity && selectedOpportunity.id !== opp.id) {
      if (!window.confirm("Switching opportunity will replace notice draft content. Do you want to continue?")) {
        return;
      }
    }

    setSelectedOpportunity(opp);
    setLoading(true);
    try {
      const res = await api.get(`/api/staff/placement/opportunities/${opp.id}/autofill/`);
      const auto = res.data;
      const compName = auto.company_name || opp.company_name || "";

      setFormData({
        company_name: compName,
        srNo: auto.sr_no || "",
        date: auto.date || new Date().toISOString().split("T")[0],
        to: auto.to || "",
        subject: auto.subject || (compName ? `Campus Recruitment Drive - ${compName}` : ""),
        intro: auto.intro || "",
        about: auto.about || "",
        eligibility_criteria: auto.eligibility_criteria || "",
        Walk_in_interview: auto.walk_in_interview || "Online Assessment followed by Technical and HR Interviews.",
        Company_registration_Link: auto.company_registration_link || opp.company_website || "",
        College_registration_Link: "",
        Note: auto.note || "Students must report on time in formal attire. Late entries will not be permitted.",
        From: auto.from_field || "Dr. Zahir Aalam",
        From_designation: auto.from_designation || "Dean (TP&IL)",
        location: auto.location || "TCET Campus / Online",
        deadline: "",
        batch: auto.batch || opp.batch || "",
        roles_responsibilities: auto.roles_responsibilities || "",
      });

      setTableRows(auto.table_data && auto.table_data.length > 0 ? auto.table_data : [emptyRow()]);

      const skills =
        opp.skills && opp.skills.length > 0
          ? opp.skills
          : auto.skill_required
          ? auto.skill_required.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [];
      setSkillTags(skills);

      setIsDirty(true);
      setSearchCardCollapsed(true);
      toast.success(`Auto-filled notice details for ${opp.company_name} (${opp.designation})!`);
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
    setTableRows([emptyRow()]);
    setSkillTags([]);
    setIsDirty(true);
  };

  // --- Load an Existing Notice or Draft ---
  const loadNoticeById = async (id: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/staff/placement-notices/${id}/`);
      const n = res.data;

      setNoticeId(n.id);
      setNoticeStatus(n.status);
      setVersionCount(n.version_count || 1);

      const compName = n.company_name || n.company?.name || "";

      setFormData({
        company_name: compName,
        srNo: n.sr_no || "",
        to: n.to || "",
        subject: n.subject || "",
        date: n.date || "",
        intro: n.intro || "",
        about: n.about || "",
        eligibility_criteria: n.eligibility_criteria || "",
        Walk_in_interview: n.walk_in_interview || "",
        Company_registration_Link: n.company_registration_link || "",
        College_registration_Link: n.custom_data?.college_registration_link || "",
        Note: n.note || "",
        From: n.from_field || "",
        From_designation: n.from_designation || "",
        location: n.location || "",
        deadline: n.deadline || "",
        batch: n.batch || "",
        roles_responsibilities: n.roles_responsibilities || n.custom_data?.roles_responsibilities || "",
      });

      if (n.table_data && n.table_data.length > 0) {
        setTableRows(n.table_data);
      }

      if (n.skill_required) {
        const skills = n.skill_required.split(",").map((s: string) => s.trim()).filter(Boolean);
        setSkillTags(skills);
      }

      setIsDirty(false);
      toast.success(`Loaded notice #${n.id} (${n.status})`);
    } catch (err) {
      toast.error("Failed to load notice details.");
    } finally {
      setLoading(false);
    }
  };

  // --- Reset to New Blank Notice ---
  const handleResetNewNotice = () => {
    if (isDirty && !window.confirm("Start new notice? Any unsaved edits will be discarded.")) {
      return;
    }

    setNoticeId(null);
    setNoticeStatus("NEW");
    setVersionCount(1);
    setSelectedOpportunity(null);
    setSkillTags([]);
    setTableRows([emptyRow()]);
    setFormData({
      company_name: "",
      srNo: "",
      to: "",
      subject: "",
      date: new Date().toISOString().split("T")[0],
      intro: "",
      about: "",
      eligibility_criteria: "",
      Walk_in_interview: "Online Assessment followed by Technical and HR Interviews.",
      Company_registration_Link: "",
      College_registration_Link: "",
      Note: "Students must report on time in formal attire. Late entries will not be permitted.",
      From: "Dr. Zahir Aalam",
      From_designation: "Dean (TP&IL)",
      location: "TCET Campus / Online",
      deadline: "",
      batch: "",
      roles_responsibilities: "",
    });

    api
      .get("/api/staff/placement-notices/next-serial-number/")
      .then((res) => {
        if (res.data?.sr_no) {
          setFormData((prev) => ({ ...prev, srNo: res.data.sr_no }));
        }
      })
      .catch(() => {});

    setIsDirty(false);
    toast.success("Editor reset to blank notice.");
  };

  // --- Save Draft Handler ---
  const handleSaveDraft = async () => {
    const csrfToken = getCookie("csrftoken");
    const validRows = tableRows.filter((r) => r.type.trim() || r.salary.trim() || r.position.trim());

    const payload = {
      id: noticeId || undefined,
      opportunity_id: selectedOpportunity?.id || undefined,
      company_id: selectedOpportunity?.company_id || undefined,
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
      college_registration_link: formData.College_registration_Link,
      note: formData.Note,
      from_field: formData.From,
      from_designation: formData.From_designation,
      location: formData.location,
      deadline: formData.deadline || null,
      sr_no: formData.srNo,
      table_data: validRows,
      roles_responsibilities: formData.roles_responsibilities || "",
    };

    setLoading(true);
    try {
      const res = await api.post("/api/staff/placement-notices/drafts/", payload, {
        headers: { "X-CSRFToken": csrfToken || "" },
      });

      const saved = res.data.notice;
      setNoticeId(saved.id);
      setNoticeStatus("DRAFT");
      setIsDirty(false);
      toast.success("Draft saved successfully!");
    } catch (err: any) {
      console.error("Error saving draft:", err);
      toast.error(err.response?.data?.error || "Failed to save draft.");
    } finally {
      setLoading(false);
    }
  };

  // --- Publish Handler (Version 1 or Version N+1) ---
  const handlePublish = async () => {
    if (!formData.subject.trim()) {
      toast.error("Notice Subject is required.");
      return;
    }
    if (!formData.to.trim()) {
      toast.error("Notice Recipient (To) is required.");
      return;
    }
    if (!formData.intro.trim()) {
      toast.error("Notice Introduction is required.");
      return;
    }
    if (!formData.eligibility_criteria.trim()) {
      toast.error("Eligibility Criteria is required.");
      return;
    }

    const csrfToken = getCookie("csrftoken");
    const validRows = tableRows.filter((r) => r.type.trim() || r.salary.trim() || r.position.trim());

    let currentId = noticeId;
    if (!currentId) {
      try {
        const draftRes = await api.post(
          "/api/staff/placement-notices/drafts/",
          {
            opportunity_id: selectedOpportunity?.id,
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
            sr_no: formData.srNo,
            table_data: validRows,
            roles_responsibilities: formData.roles_responsibilities || "",
          },
          { headers: { "X-CSRFToken": csrfToken || "" } }
        );
        currentId = draftRes.data.notice.id;
        setNoticeId(currentId);
      } catch (err: any) {
        toast.error("Failed to initialize draft before publish.");
        return;
      }
    }

    const publishPayload = {
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
      sr_no: formData.srNo,
      table_data: validRows,
      roles_responsibilities: formData.roles_responsibilities || "",
    };

    setLoading(true);
    try {
      const res = await api.post(`/api/staff/placement-notices/${currentId}/publish/`, publishPayload, {
        headers: { "X-CSRFToken": csrfToken || "" },
      });

      const published = res.data.notice;
      const ver = res.data.version;

      setNoticeStatus("PUBLISHED");
      setVersionCount(published.version_count);
      setIsDirty(false);
      toast.success(`Notice published successfully as Version ${ver.version_number}!`);
    } catch (err: any) {
      console.error("Publish failed:", err);
      toast.error(err.response?.data?.error || "Publishing failed. Please check form values.");
    } finally {
      setLoading(false);
    }
  };

  // --- Clone as New Notice Handler ---
  const handleCloneAsNew = async () => {
    if (!noticeId) {
      toast.error("Please save or load a notice first before cloning.");
      return;
    }

    const csrfToken = getCookie("csrftoken");
    setLoading(true);
    try {
      const res = await api.post(
        `/api/staff/placement-notices/${noticeId}/clone/`,
        {},
        { headers: { "X-CSRFToken": csrfToken || "" } }
      );

      const cloned = res.data.notice;
      setNoticeId(cloned.id);
      setNoticeStatus("DRAFT");
      setVersionCount(1);
      setFormData((prev) => ({
        ...prev,
        subject: cloned.subject,
        srNo: cloned.sr_no,
        date: cloned.date,
      }));
      setIsDirty(false);
      toast.success(`Cloned as new independent draft Notice #${cloned.id}!`);
    } catch (err: any) {
      toast.error("Failed to clone notice.");
    } finally {
      setLoading(false);
    }
  };

  // --- Construct Live Preview Data Object (Direct single-source-of-truth) ---
  const livePreviewData: NoticeData = useMemo(() => {
    const validRows = tableRows.filter((r) => r.type.trim() || r.salary.trim() || r.position.trim());
    return {
      srNo: formData.srNo,
      to: formData.to,
      subject: formData.subject,
      date: formData.date,
      intro: formData.intro,
      about: formData.about,
      eligibility_criteria: formData.eligibility_criteria,
      roles: JSON.stringify(validRows),
      tableData: validRows.length > 0 ? validRows : [emptyRow()],
      skill_required: skillTags.join(", "),
      Walk_in_interview: formData.Walk_in_interview,
      Company_registration_Link: formData.Company_registration_Link,
      Note: formData.Note,
      From: formData.From,
      From_designation: formData.From_designation,
      location: formData.location,
      deadline: formData.deadline,
      noticeId: noticeId ? String(noticeId) : "Draft",
      roles_responsibilities: formData.roles_responsibilities || "",
    };
  }, [formData, tableRows, skillTags, noticeId]);

  // --- Quality Checklist ---
  const qualityChecklist = useMemo(() => {
    const items = [];
    if (!formData.subject.trim()) items.push({ label: "Notice Subject is missing", critical: true });
    if (!formData.to.trim()) items.push({ label: "Recipient (To) is missing", critical: true });
    if (!formData.eligibility_criteria.trim()) items.push({ label: "Eligibility criteria is missing", critical: true });
    if (tableRows.every((r) => !r.salary.trim() && !r.position.trim()))
      items.push({ label: "Job position & salary not specified", critical: false });
    if (!formData.Company_registration_Link.trim())
      items.push({ label: "Company registration link is empty", critical: false });
    if (skillTags.length === 0) items.push({ label: "No skill tags added", critical: false });
    return items;
  }, [formData, tableRows, skillTags]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
  const handleResetZoom = () => setZoom(90);

  return (
    <div className="w-full flex-1 flex flex-col bg-slate-100 min-h-screen text-slate-900 font-sans">
      {/* ── TOP WORKSPACE HEADER ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-3 sm:px-4 py-2 flex items-center justify-between gap-3 shadow-sm select-none">
        {/* Left: Sidebar Toggle, Title, Status Badges */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Toggle navigation sidebar"
            title="Toggle Navigation Sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate tracking-tight">
              Notice Creation
            </h1>

            {/* Document Status Chip */}
            {noticeStatus === "PUBLISHED" ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                <CheckCircle2 size={11} className="text-emerald-600" />
                Published v{versionCount}
              </span>
            ) : noticeStatus === "DRAFT" ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                <FileEdit size={11} className="text-amber-600" />
                Draft #{noticeId}
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300">
                <Sparkles size={11} className="text-slate-500" />
                New Notice
              </span>
            )}

            {/* Unsaved Changes Indicator */}
            {isDirty && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"
                title="You have unsaved changes"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="hidden md:inline">Unsaved edits</span>
              </span>
            )}
          </div>
        </div>

        {/* Center: Notice Sub-Type Switcher Pills (Placement, Internship, Training, etc.) */}
        <div className="hidden xl:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          {NOTICE_TABS.map((tab) => {
            const isTabActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange?.(tab.key)}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  isTabActive
                    ? "bg-white text-blue-700 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right: Primary Workspace Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Saved Drafts Trigger */}
          <button
            type="button"
            onClick={() => setDraftsOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
            title="Browse saved drafts"
          >
            <FileText size={14} className="text-slate-500" />
            <span className="hidden md:inline">Drafts</span>
          </button>

          {/* Save Draft Button */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-300 hover:bg-blue-100 active:bg-blue-200 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
            title="Save draft"
          >
            {loading ? <CircularProgress size={14} color="inherit" /> : <Save size={15} />}
            <span>Save Draft</span>
          </button>

          {/* Publish Notice Button */}
          <button
            type="button"
            onClick={handlePublish}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            title="Publish notice"
          >
            {loading ? <CircularProgress size={14} color="inherit" /> : <Send size={15} />}
            <span className="hidden sm:inline">
              {noticeStatus === "PUBLISHED" ? `Update v${versionCount + 1}` : "Publish"}
            </span>
          </button>

          {/* Reset / Clear Form */}
          <button
            type="button"
            onClick={handleResetNewNotice}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Reset form"
            aria-label="Reset form"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      {/* ── RESPONSIVE MOBILE / TABLET TAB BAR (<1024px) ────────────────── */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-between gap-2 shadow-2xs">
        <div className="inline-flex p-1 bg-slate-100 rounded-lg w-full max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setMobileTab("edit")}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === "edit"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Edit3 size={14} />
            <span>Notice Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === "preview"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Eye size={14} />
            <span>Live Document</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          </button>
        </div>
      </div>

      {/* ── MAIN SPLIT-SCREEN WORKSPACE ─────────────────────────────────── */}
      <div className="flex-1 w-full flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* ── LEFT PANEL: NOTICE EDITOR (Approx 48%) ────────────────────── */}
        <section
          aria-label="Notice Editor"
          className={`${
            mobileTab === "preview" ? "hidden" : "flex"
          } lg:flex flex-col w-full lg:w-[48%] xl:w-[47%] border-r border-slate-200 bg-white overflow-y-auto min-h-0`}
          style={{ maxHeight: "calc(100vh - 58px)" }}
        >
          <div className="p-4 sm:p-5 lg:p-6 space-y-5">
            {/* 1. Opportunity Search & Auto-Fill Card (Collapsible) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden transition-all shadow-2xs">
              <div
                className="px-4 py-3 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none"
                onClick={() => setSearchCardCollapsed((prev) => !prev)}
              >
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-blue-600" />
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    Opportunity Search &amp; Auto-fill
                  </span>
                  {selectedOpportunity && (
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                      {selectedOpportunity.company_name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">
                    {searchCardCollapsed ? "Expand" : "Collapse"}
                  </span>
                  {searchCardCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </div>
              </div>

              {!searchCardCollapsed && (
                <div className="p-3.5 sm:p-4">
                  <OpportunitySearchCard
                    onSelectOpportunity={handleSelectOpportunity}
                    selectedOpportunity={selectedOpportunity}
                    selectedOppId={selectedOpportunity?.id}
                    onClearSelection={handleClearOpportunity}
                    noticeStatus={noticeStatus}
                    isDirty={isDirty}
                    onOpenDrafts={() => setDraftsOpen(true)}
                  />
                </div>
              )}
            </div>

            {/* Quality Alerts */}
            {qualityChecklist.length > 0 && (
              <div className="space-y-1.5">
                {qualityChecklist.map((item, idx) => (
                  <Alert
                    key={idx}
                    severity={item.critical ? "error" : "warning"}
                    icon={<AlertTriangle size={15} />}
                    sx={{ py: 0.25, px: 1.5, borderRadius: 2, fontSize: "12px" }}
                  >
                    {item.label}
                  </Alert>
                ))}
              </div>
            )}

            {/* Section 1: Communication & Institutional Meta */}
            <div className="rounded-xl border border-slate-200 p-4 sm:p-5 bg-white shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  1. Communication &amp; Institutional Meta
                </h2>
              </div>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Serial Number"
                    name="srNo"
                    value={formData.srNo}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    placeholder="e.g. TCET/T&P/OFF/2026/PL-001"
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
                    placeholder="e.g. Tata Consultancy Services"
                    helperText="Auto-fills subject, intro & about text"
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
                    placeholder="e.g. All concerned Students of 2027 Batch"
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
                    placeholder="e.g. Campus Recruitment Drive - Tata Consultancy Services"
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
                    placeholder="TCET Campus / Mumbai / Remote"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Registration Deadline"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    placeholder="e.g. 30.09.2026 by 10.00 am"
                    helperText="Format: 30.09.2026 by 10.00 am"
                  />
                </Grid>
              </Grid>
            </div>

            {/* Section 2: Introduction & Company Background */}
            <div className="rounded-xl border border-slate-200 p-4 sm:p-5 bg-white shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  2. Introduction &amp; Company Background
                </h2>
              </div>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Introduction Text"
                    name="intro"
                    value={formData.intro}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    placeholder="All eligible students are hereby informed that..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="About Company (Notice Snapshot)"
                    name="about"
                    value={formData.about}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                    placeholder="Company overview, domain, global footprint..."
                  />
                </Grid>
              </Grid>
            </div>

            {/* Section 3: Job Positions & CTC (Repeatable Table) */}
            <div className="rounded-xl border border-slate-200 p-4 sm:p-5 bg-white shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    3. Job Positions &amp; CTC
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={addRow}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-md transition-colors"
                >
                  <Plus size={14} />
                  <span>Add Position</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <Table size="small">
                  <TableHead className="bg-slate-50">
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: "12px", width: "26%" }}>Offer Type</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "12px", width: "28%" }}>CTC / Stipend</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "12px", width: "36%" }}>Role / Position</TableCell>
                      <TableCell sx={{ width: "10%" }} align="center">Del</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableRows.map((row, index) => (
                      <TableRow key={index} className="hover:bg-slate-50/50">
                        <TableCell sx={{ py: 1 }}>
                          <TextField
                            size="small"
                            value={row.type}
                            onChange={(e) => handleRowChange(index, "type", e.target.value)}
                            placeholder="Regular / Dream"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
                          <TextField
                            size="small"
                            value={row.salary}
                            onChange={(e) => handleRowChange(index, "salary", e.target.value)}
                            placeholder="e.g. ₹7.5 LPA"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
                          <TextField
                            size="small"
                            value={row.position}
                            onChange={(e) => handleRowChange(index, "position", e.target.value)}
                            placeholder="e.g. Software Engineer"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell sx={{ py: 1 }} align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeRow(index)}
                            disabled={tableRows.length === 1}
                            title="Remove row"
                          >
                            <Trash2 size={15} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Section 4: Eligibility Criteria & Required Skills */}
            <div className="rounded-xl border border-slate-200 p-4 sm:p-5 bg-white shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  4. Eligibility &amp; Required Skills
                </h2>
              </div>

              <Grid container spacing={2}>
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
                    placeholder="e.g. B.E. (COMP, IT, AI&DS) with 60% throughout without backlogs"
                  />
                </Grid>

                {/* Skills Tag Input */}
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: "#475569", fontWeight: 600, display: "block", mb: 0.5 }}>
                    Required Technical / Soft Skills
                  </Typography>
                  <div className="flex gap-2 mb-2">
                    <TextField
                      size="small"
                      placeholder="Type skill & press Enter (e.g. Python, React, SQL)"
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
                      sx={{ textTransform: "none", borderRadius: 1.5 }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {skillTags.map((skill, i) => (
                      <Chip
                        key={i}
                        label={skill}
                        size="small"
                        onDelete={() => handleRemoveSkill(skill)}
                        sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 600, border: "1px solid #bfdbfe" }}
                      />
                    ))}
                    {skillTags.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No skills added yet</span>
                    )}
                  </div>
                </Grid>
              </Grid>
            </div>

            {/* Section 5: Selection Process, Logistics & Instructions */}
            <div className="rounded-xl border border-slate-200 p-4 sm:p-5 bg-white shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  5. Selection Process, Logistics &amp; Instructions
                </h2>
              </div>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Selection Process Rounds"
                    name="Walk_in_interview"
                    value={formData.Walk_in_interview}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    placeholder="1. Online Assessment 2. Technical Interview 3. HR Round"
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
                    placeholder="Enter key day-to-day responsibilities (supports bullets/lines)"
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
                    placeholder="https://company.com/careers/apply"
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
                    placeholder="Formal attire, reporting time, documents..."
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
            </div>

            {/* Bottom Form Actions Bar */}
            <div className="pt-3 pb-6 flex items-center justify-between gap-2 flex-wrap border-t border-slate-200">
              <div className="flex items-center gap-2">
                <Button
                  variant="contained"
                  color={noticeStatus === "PUBLISHED" ? "secondary" : "primary"}
                  startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <Send size={15} />}
                  onClick={handlePublish}
                  disabled={loading}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                >
                  {noticeStatus === "PUBLISHED" ? `Update Notice (v${versionCount + 1})` : "Publish Notice"}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={loading ? <CircularProgress size={15} /> : <Save size={15} />}
                  onClick={handleSaveDraft}
                  disabled={loading}
                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                >
                  Save Draft
                </Button>
              </div>

              {noticeId && (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<History size={14} />}
                    onClick={() => setHistoryOpen(true)}
                    sx={{ textTransform: "none" }}
                  >
                    History
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<ShieldCheck size={14} />}
                    onClick={() => setAuditOpen(true)}
                    sx={{ textTransform: "none" }}
                  >
                    Audit
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<Copy size={14} />}
                    onClick={handleCloneAsNew}
                    disabled={loading}
                    sx={{ textTransform: "none" }}
                  >
                    Clone
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── RIGHT PANEL: LIVE NOTICE PREVIEW (Approx 52%) ──────────────── */}
        <section
          aria-label="Live Notice Document Preview"
          className={`${
            mobileTab === "edit" ? "hidden" : "flex"
          } lg:flex flex-col w-full lg:w-[52%] xl:w-[53%] bg-slate-800 text-white min-h-0 overflow-hidden select-none`}
          style={{ maxHeight: "calc(100vh - 58px)" }}
        >
          {/* Preview Toolbar */}
          <div className="bg-slate-900 border-b border-slate-700/80 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 z-10 flex-wrap">
            {/* Live Indicator */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-xs font-semibold text-slate-200 tracking-wide">
                Live Document Preview
              </span>
              <span className="hidden xl:inline text-[11px] text-slate-400">
                • Real-time synchronization
              </span>
            </div>

            {/* Toolbar Controls: Zoom, Fullscreen, Print, PDF */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-slate-300">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className="p-1 hover:text-white hover:bg-slate-700 rounded disabled:opacity-40 transition-colors"
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-[11px] font-mono px-1.5 text-slate-300 select-none">
                  {zoom}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoom >= 150}
                  className="p-1 hover:text-white hover:bg-slate-700 rounded disabled:opacity-40 transition-colors"
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1 hover:text-white hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 border-l border-slate-700/60 ml-0.5 transition-colors"
                  title="Reset Zoom to 90%"
                  aria-label="Reset Zoom"
                >
                  <RotateCcw size={12} />
                </button>
              </div>

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
                title="Full-screen view"
                aria-label="Full-screen preview"
              >
                <Maximize2 size={14} />
              </button>

              {/* Print Button */}
              <button
                type="button"
                onClick={() => reactPrintFn()}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:text-white rounded-lg transition-colors shadow-2xs"
                title="Print document"
              >
                <Printer size={13} />
                <span className="hidden sm:inline">Print</span>
              </button>

              {/* PDF Download Button */}
              <button
                type="button"
                onClick={() => reactPrintFn()}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-2xs"
                title="Save as PDF via Print dialog"
              >
                <Download size={13} />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* Canvas Viewport (Scrollable with scaled document) */}
          <div
            className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 flex justify-center items-start bg-[#475569] min-h-0"
            style={{
              backgroundImage:
                "radial-gradient(#64748b 1px, transparent 1px), radial-gradient(#64748b 1px, #475569 1px)",
              backgroundSize: "24px 24px",
              backgroundPosition: "0 0, 12px 12px",
            }}
          >
            <div
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
                transition: "transform 0.12s ease-out",
                boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
              }}
              className="rounded"
            >
              <Notice formData={livePreviewData} ref={contentRef} isPlacement={true} />
            </div>
          </div>
        </section>
      </div>

      {/* ── FULLSCREEN PREVIEW MODAL ─────────────────────────────────────── */}
      <Dialog
        fullScreen
        open={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        PaperProps={{
          sx: { bgcolor: "#334155", color: "white" },
        }}
      >
        <div className="bg-slate-900 border-b border-slate-700 px-4 py-2.5 flex items-center justify-between text-white sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-sm font-bold tracking-wide">
              Full-Screen Document Inspection • {formData.company_name || "TCET Notice"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fullscreenPrintFn()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={() => fullscreenPrintFn()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg"
            >
              <Download size={14} />
              <span>Save PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg ml-2"
              title="Exit fullscreen (Esc)"
              aria-label="Exit fullscreen"
            >
              <Minimize2 size={18} />
            </button>
          </div>
        </div>

        <DialogContent sx={{ p: { xs: 2, sm: 4 }, display: "flex", justifyContent: "center", bgcolor: "#475569" }}>
          <div style={{ maxWidth: "850px", width: "100%", margin: "0 auto" }}>
            <Notice formData={livePreviewData} ref={fullscreenContentRef} isPlacement={true} />
          </div>
        </DialogContent>
      </Dialog>

      {/* ── AUXILIARY MODALS (PRESERVED) ─────────────────────────────────── */}
      <NoticeVersionHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        noticeId={noticeId}
        onSelectVersionSnapshot={(snap) => {
          setFormData((prev) => ({
            ...prev,
            srNo: snap.sr_no || prev.srNo,
            to: snap.to || prev.to,
            subject: snap.subject || prev.subject,
            date: snap.date || prev.date,
            intro: snap.intro || prev.intro,
            about: snap.about || prev.about,
            eligibility_criteria: snap.eligibility_criteria || prev.eligibility_criteria,
            roles_responsibilities:
              snap.roles_responsibilities ?? snap.custom_data?.roles_responsibilities ?? prev.roles_responsibilities,
            Walk_in_interview: snap.walk_in_interview || prev.Walk_in_interview,
            Company_registration_Link: snap.company_registration_link || prev.Company_registration_Link,
            Note: snap.note || prev.Note,
            From: snap.from_field || prev.From,
            From_designation: snap.from_designation || prev.From_designation,
            location: snap.location || prev.location,
            deadline: snap.deadline || prev.deadline,
          }));
          if (snap.table_data) setTableRows(snap.table_data);
          if (snap.skill_required) {
            setSkillTags(snap.skill_required.split(",").map((s: string) => s.trim()).filter(Boolean));
          }
          setIsDirty(true);
          toast.success("Loaded snapshot into editor.");
        }}
      />

      <NoticeAuditLogsModal
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        noticeId={noticeId}
      />

      <SavedDraftsModal
        open={draftsOpen}
        onClose={() => setDraftsOpen(false)}
        onSelectDraft={(id) => loadNoticeById(id)}
        onNewNotice={handleResetNewNotice}
      />
    </div>
  );
};

export default PlacementNotice;
