import React from "react";
import headerImage from "@/assets/tcet header.png";
import footerImage from "@/assets/tcet footer.png";
import logoWatermark from "@/assets/img/logo.png";

export const PRINCIPAL_NAME = "(Dr. B.K. Mishra)";
export const PRINCIPAL_DESIGNATION = "Principal";

export const PERMANENT_COPY_TO = [
  "Vice Principal",
  "All Deans",
  "All HODs",
  "T & P Coordinator",
  "Office",
] as const;

export interface DutyChartColumnDef {
  key: string;
  label: string;
  width: string;
  className?: string;
}

// Static fixed columns — date columns are inserted dynamically from formData.eventDates
export const STATIC_LEFT_COLUMNS: readonly DutyChartColumnDef[] = [
  { key: "srNo", label: "Sr. No", width: "5%", className: "dc-cell-center" },
  { key: "name", label: "Name of the Faculty / Staff", width: "18%", className: "dc-cell-name" },
  { key: "designation", label: "Designation", width: "14%", className: "dc-cell-desig" },
  { key: "department", label: "Dept.", width: "7%", className: "dc-cell-center" },
  { key: "reportingTime", label: "Reporting Time", width: "10%", className: "dc-cell-center" },
] as const;

export const STATIC_RIGHT_COLUMNS: readonly DutyChartColumnDef[] = [
  { key: "sign", label: "Sign", width: "8%", className: "dc-cell-center" },
  { key: "roles", label: "Roles and Responsibilities", width: "38%", className: "dc-cell-roles" },
] as const;

// Keep old export alias so any other imports don't break
export const DUTY_CHART_COLUMNS = [...STATIC_LEFT_COLUMNS, ...STATIC_RIGHT_COLUMNS];

export interface DutyChartFormData {
  srNo: string;
  date: string;
  to: string;
  subject: string;
  intro: string;
  eventDates: string[];
  notes: string[];
  signatoryName: string;
  signatoryDesignation: string;
  copyTo: string[];
}

export interface DutyChartTableRow {
  srNo: number | string;
  name: string;
  designation: string;
  department: string;
  reportingTime: string;
  dutyDates?: Record<string, boolean>;
  sign?: string;
  roles: string;
  roleGroupId?: string;
}

export interface DutyChartPreviewProps {
  formData: DutyChartFormData;
  tableData: DutyChartTableRow[];
}

// Format date into DD.MM.YYYY
export const formatInstitutionalDate = (dateStr?: string): string => {
  if (!dateStr || !dateStr.trim()) return "";
  if (dateStr.includes(".")) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
};

export const DutyChartPreview = React.forwardRef<HTMLDivElement, DutyChartPreviewProps>(
  ({ formData, tableData }, ref) => {
    // Rows to render: if tableData is empty, render 1 blank row so table structure remains visible
    const rowsToRender: DutyChartTableRow[] =
      tableData && tableData.length > 0
        ? tableData
        : [
          {
            srNo: 1,
            name: "",
            designation: "",
            department: "",
            reportingTime: "",
            dutyDates: {},
            sign: "",
            roles: "",
          },
        ];

    const renderRoleContent = (roleText?: string) => {
      if (!roleText || !roleText.trim()) return <>&nbsp;</>;
      const lines = roleText.split("\n").filter((l) => l.trim().length > 0);
      return (
        <div className="dc-roles-list">
          {lines.map((line, idx) => (
            <div key={idx} className="dc-role-item">
              {line}
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="dc-preview-wrapper">
        <div ref={ref} className="dc-document-container">
          {/* Subtle Institutional Watermark */}
          <div className="dc-watermark-overlay" aria-hidden="true">
            <img src={logoWatermark} alt="" className="dc-watermark-img" />
          </div>

          {/* Official TCET Header Image (Fixed at top of every page in print) */}
          <div className="dc-header-wrapper">
            <img src={headerImage} alt="TCET Header" className="dc-header-img" />
          </div>

          {/* Outer Layout Table for bulletproof multi-page print header/footer reservation */}
          <table className="dc-print-layout-table">
            <thead>
              <tr>
                <td>
                  <div className="dc-header-spacer" />
                </td>
              </tr>
            </thead>
            <tfoot>
              <tr>
                <td>
                  <div className="dc-footer-spacer" />
                </td>
              </tr>
            </tfoot>
            <tbody>
              <tr>
                <td>
                  {/* Inner Content Area with Proper Institutional Margins */}
                  <div className="dc-content-body">
                    {/* Institutional Document Reference bar */}
                    <div className="dc-ref-bar">
                      <span className="dc-ref-left">TCET/FRM/MP-04/11</span>
                      <span className="dc-ref-right">Revision: B</span>
                    </div>

                    {/* Heading Section */}
                    <div className="dc-title-section">
                      <h2 className="dc-cell-heading">Training and Placement Cell</h2>
                      <h1 className="dc-notice-heading">NOTICE</h1>
                    </div>

                    {/* Serial Number and Date Row */}
                    <div className="dc-meta-row">
                      <div className="dc-meta-sr">
                        <span className="font-semibold">Sr. No:</span>{" "}
                        <span className="dc-meta-val">{formData.srNo || ""}</span>
                      </div>
                      <div className="dc-meta-date">
                        <span className="font-semibold">Date:</span>{" "}
                        <span className="dc-meta-val">{formatInstitutionalDate(formData.date)}</span>
                      </div>
                    </div>

                    {/* Recipient & Subject */}
                    <div className="dc-recipient-section">
                      <p className="dc-to-line">
                        <strong>To:</strong> {formData.to || ""}
                      </p>
                      <p className="dc-sub-line">
                        <strong>Sub:</strong> {formData.subject || ""}
                      </p>
                      {formData.intro && formData.intro.trim() ? (
                        <p className="dc-intro-paragraph">{formData.intro}</p>
                      ) : (
                        <div style={{ minHeight: "12px" }} />
                      )}
                    </div>

                    {/* Main Duty Assignment Table — dynamic date columns inserted between Reporting Time and Sign */}
                    <table className="dc-table">
                      <colgroup>
                        {STATIC_LEFT_COLUMNS.map((col) => (
                          <col key={col.key} style={{ width: col.width }} />
                        ))}
                        {/* One column per event date */}
                        {formData.eventDates && formData.eventDates.map((d) => (
                          <col key={`date-col-${d}`} style={{ width: "6%" }} />
                        ))}
                        {STATIC_RIGHT_COLUMNS.map((col) => (
                          <col key={col.key} style={{ width: col.width }} />
                        ))}
                      </colgroup>
                      <thead>
                        <tr>
                          {STATIC_LEFT_COLUMNS.map((col) => (
                            <th key={col.key} style={{ width: col.width }}>
                              {col.label}
                            </th>
                          ))}
                          {/* Dynamic date column headers */}
                          {formData.eventDates && formData.eventDates.map((d) => (
                            <th
                              key={`date-th-${d}`}
                              style={{ width: "6%", textAlign: "center", fontSize: "10px", wordBreak: "break-word" }}
                            >
                              {d}
                            </th>
                          ))}
                          {STATIC_RIGHT_COLUMNS.map((col) => (
                            <th
                              key={col.key}
                              style={{ width: col.width }}
                              className={col.key === "roles" ? "dc-th-roles" : undefined}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rowsToRender.map((row, index) => (
                          <tr key={index}>
                            <td className="dc-cell-center">
                              {row.srNo ?? index + 1}.
                            </td>
                            <td className="dc-cell-name">{row.name || <>&nbsp;</>}</td>
                            <td className="dc-cell-desig">{row.designation || <>&nbsp;</>}</td>
                            <td className="dc-cell-center">{row.department || <>&nbsp;</>}</td>
                            <td className="dc-cell-center">{row.reportingTime || <>&nbsp;</>}</td>
                            {/* Dynamic date duty cells */}
                            {formData.eventDates && formData.eventDates.map((d) => {
                              const isAssigned = row.dutyDates ? !!row.dutyDates[d] : false;
                              return (
                                <td
                                  key={`date-td-${d}`}
                                  className="dc-cell-center"
                                  style={{ fontWeight: isAssigned ? "bold" : "normal", fontSize: "13px" }}
                                >
                                  {isAssigned ? "✓" : <>&nbsp;</>}
                                </td>
                              );
                            })}
                            <td className="dc-cell-center">{row.sign || <>&nbsp;</>}</td>
                            <td className="dc-cell-roles">
                              {renderRoleContent(row.roles)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Notes Block — flows immediately after table */}
                    {formData.notes && formData.notes.length > 0 && (
                      <div className="dc-notes-block" style={{ marginTop: "8px", marginBottom: "8px", pageBreakInside: "avoid" }}>
                        <p className="dc-note-title">Note:</p>
                        <ol className="dc-notes-list">
                          {formData.notes.map((note, nIdx) => (
                            <li key={nIdx}>{note}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Signatory & Copy to Section — Signatory on Right ABOVE Copy to on Left */}
                    <div className="dc-bottom-container" style={{ pageBreakInside: "avoid", marginTop: "12px" }}>
                      {/* Principal Signature Block — on right, ABOVE Copy to */}
                      <div className="dc-signatory-wrapper" style={{ display: "flex", justifyContent: "flex-end", width: "100%", marginBottom: "12px" }}>
                        <div className="dc-principal-block" style={{ textAlign: "center", minWidth: "180px" }}>
                          <p className="dc-principal-name" style={{ fontWeight: 700, margin: 0 }}>{PRINCIPAL_NAME}</p>
                          <p className="dc-principal-title" style={{ margin: "2px 0 0 0" }}>{PRINCIPAL_DESIGNATION}</p>
                        </div>
                      </div>

                      {/* Copy to Block — on left, BELOW Principal */}
                      <div className="dc-copyto-block" style={{ textAlign: "left", width: "100%" }}>
                        <p className="dc-copyto-title" style={{ fontWeight: 700, textDecoration: "underline", margin: "0 0 2px 0" }}>Copy to:</p>
                        <ul className="dc-copyto-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                          {PERMANENT_COPY_TO.map((item, cIdx) => (
                            <li key={cIdx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Official TCET Footer Image (Fixed at bottom of every page in print, bottom of sheet on screen) */}
          <div className="dc-footer-wrapper">
            <img src={footerImage} alt="TCET Footer" className="dc-footer-img" />
          </div>
        </div>
      </div>
    );
  }
);

DutyChartPreview.displayName = "DutyChartPreview";
export default DutyChartPreview;
