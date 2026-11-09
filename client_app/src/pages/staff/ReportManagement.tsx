import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  PlacementReport,
  PlacementRegisterEntry,
  CompanyRecord,
  PhaseWiseReport,
} from "./components/reports/types";
import { ReportTab } from "./components/reports/ReportTab";
import { PhaseWiseTab } from "./components/reports/PhaseWiseTab";
import { ListOfCompanyTab } from "./components/reports/ListOfCompanyTab";
import { PlacementRegisterTab } from "./components/reports/PlacementRegisterTab";
import { PrintReportModal } from "./components/reports/PrintReportModal";
import { TextTabs } from "./components/reports/TextTabs";
import "./components/reports/report.print.css";

import {
  FileBarChart2,
  Printer,
  Save,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiFetch, toList } from "@/lib/api";
import { getCookie } from "@/utils";

type ReportCategory = "report" | "phasewise" | "companies" | "register";

const TABS: { key: ReportCategory; label: string }[] = [
  { key: "report", label: "Report" },
  { key: "phasewise", label: "Phase-wise Report" },
  { key: "companies", label: "List of Company" },
  { key: "register", label: "Placement Register" },
];

// Fallback initial report if API is loading or network error
const initialReportData: PlacementReport = {
  batch: "2027",
  program: "MCA",
  ref_no: "TCET/TNP/FRM/IP-06/09",
  report_no: "TCET/ T&P / REP  94    of 2026",
  revision: "B",
  report_date: "2026-10-16",
  admitted_final_year: 125,
  opt_out: 4,
  interested: 121,
  eligible: 117,
  not_eligible: 4,
  due_date: "2026-09-27",
  completion_date: "2026-09-24",
  reason_if_late: "Capgemini result Declared as on 16/10/2026",
  signatories: {
    clerk: { name: "Rajesh Singh", designation: "Sr.Clerk", date: "/10/26" },
    placement_officer: { name: "Rupali Mane", designation: "Dy.(Placement Officer)", date: "/10/26" },
    dean: { name: "Dr. Zahir Aalam", designation: "Dean(TP&IL)", date: "/10/26" },
    vice_principal: { name: "Dr. R.R. Sedamkar", designation: "Vice-Principal", date: "" },
  },
  copy_to: ["Principal", "Vice Principal", "All Deans", "All HODs"],
  is_draft: false,
};

const ReportManagement: React.FC = () => {
  const { tab, subtab } = useParams<{ tab?: string; subtab?: string }>();
  const navigate = useNavigate();

  // Normalize URL route parameter to tab key
  const normalizeTab = (t?: string): ReportCategory => {
    if (!t) return "report";
    const lower = t.toLowerCase();
    if (lower === "phasewise" || lower === "phase-wise" || lower === "phase") return "phasewise";
    if (lower === "companies" || lower === "list-of-company" || lower === "company") return "companies";
    if (lower === "register" || lower === "placement-register") return "register";
    return "report";
  };

  const activeTab = normalizeTab(tab);

  const handleTabChange = (nextTab: ReportCategory) => {
    if (nextTab === "report") {
      navigate("/staff/reports");
    } else {
      navigate(`/staff/reports/${nextTab}`);
    }
  };

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Core application data
  const [report, setReport] = useState<PlacementReport>(initialReportData);
  const [entries, setEntries] = useState<PlacementRegisterEntry[]>([]);
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [phaseReports, setPhaseReports] = useState<PhaseWiseReport[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState<boolean>(true);
  const [companiesError, setCompaniesError] = useState<string | null>(null);

  // Fetch report data on mount
  const loadReportData = async () => {
    setLoading(true);
    setCompaniesLoading(true);
    setCompaniesError(null);
    try {
      // 1. Fetch main report by batch & program
      try {
        const res = await apiFetch("/api/reports/reports/by-batch/?batch=2027&program=MCA", {
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          setReport(data);
          if (data.register_entries) {
            setEntries(data.register_entries);
          }
          if (data.phase_reports) {
            setPhaseReports(data.phase_reports);
          }
        }
      } catch (rErr) {
        console.error("Failed to load report by batch:", rErr);
      }

      // 2. Fetch company master records
      try {
        const compRes = await apiFetch("/api/reports/companies/", {
          headers: { Accept: "application/json" },
        });
        if (compRes.ok) {
          const compData = await compRes.json();
          const list = toList<CompanyRecord>(compData);
          setCompanies(list);
          setCompaniesError(null);
        } else {
          const errText = `Failed to load company records (HTTP ${compRes.status}).`;
          console.error(`Company fetch failed: ${compRes.status} ${compRes.statusText}`);
          setCompaniesError(errText);
        }
      } catch (cErr: any) {
        const msg = cErr?.message || "Network error while loading company records.";
        console.error("Failed to fetch companies:", cErr);
        setCompaniesError(msg);
      } finally {
        setCompaniesLoading(false);
      }
    } catch (err) {
      console.error("Failed to load reports from API, using cached state:", err);
    } finally {
      setLoading(false);
      setCompaniesLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  // Save current report, register entries, and phase-wise figures
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const csrfToken = getCookie("csrftoken");

      // 1. Update or create main report
      const reportEndpoint = report.id
        ? `/api/reports/reports/${report.id}/`
        : "/api/reports/reports/";
      const reportMethod = report.id ? "PUT" : "POST";

      const reportRes = await apiFetch(reportEndpoint, {
        method: reportMethod,
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken || "",
        },
        body: JSON.stringify({
          ...report,
          is_draft: true,
        }),
      });

      let savedReport = report;
      if (reportRes.ok) {
        savedReport = await reportRes.json();
        setReport(savedReport);
      }

      // 2. Bulk update register entries if report id exists
      if (savedReport.id) {
        await apiFetch(`/api/reports/reports/${savedReport.id}/entries/bulk/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken || "",
          },
          body: JSON.stringify({ entries }),
        });
      }

      toast.success("Draft saved successfully!");
    } catch (err) {
      console.error("Failed to save draft:", err);
      toast.error("Could not save report draft");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#f0f4f8",
        minHeight: "100vh",
        padding: "24px 20px",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        borderRadius: "6px",
      }}
    >
      {/* Page Title & Action Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 mb-6 no-print"
        style={{ borderRadius: "6px" }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: 700,
              color: "#1a2844",
            }}
            className="flex items-center gap-2.5"
          >
            <FileBarChart2 className="w-6 h-6 text-blue-600" />
            Report Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Training & Placement Department — Official Reports, Calculations & Registers
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <Printer className="w-3.5 h-3.5 text-gray-500" />
            <span>Preview & Print</span>
          </button>

          <button
            onClick={loadReportData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            title="Reload from server"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="inline-flex items-center gap-1.5 h-8 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border border-blue-600 rounded-lg text-xs font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save Draft"}</span>
          </button>
        </div>
      </div>

      {/* Top Tab Bar — Simple Horizontal Text Tabs with Moving Blue Underline */}
      <div className="mt-2 mb-6 no-print">
        <TextTabs<ReportCategory>
          tabs={TABS}
          activeKey={activeTab}
          onChange={handleTabChange}
          idPrefix="report-tab"
        />
      </div>

      {/* Tab Workspace Content */}
      <div className="report-tab-content">
        {activeTab === "report" && (
          <ReportTab
            report={report}
            entries={entries}
            phaseReports={phaseReports}
            onUpdateReport={(updated) => setReport(updated)}
          />
        )}

        {activeTab === "phasewise" && (
          <PhaseWiseTab
            report={report}
            phaseReports={phaseReports}
            onUpdatePhases={(updated) => setPhaseReports(updated)}
            subtab={subtab}
            onSubTabChange={(phaseKey) => {
              navigate(`/staff/reports/phasewise/${phaseKey}`);
            }}
          />
        )}

        {activeTab === "companies" && (
          <ListOfCompanyTab
            companies={companies}
            onUpdateCompanies={(updated) => setCompanies(updated)}
            loading={companiesLoading}
            error={companiesError}
            onRetry={loadReportData}
          />
        )}

        {activeTab === "register" && (
          <PlacementRegisterTab
            report={report}
            entries={entries}
            companyNames={companies.map((c) => c.company_name)}
            onUpdateEntries={(updated) => setEntries(updated)}
            onSaveReport={(updated) => setReport(updated)}
          />
        )}
      </div>

      {/* Print / PDF Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        report={report}
        entries={entries}
        companies={companies}
        phaseReports={phaseReports}
        defaultView={activeTab}
      />
    </div>
  );
};

export default ReportManagement;
