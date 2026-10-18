import React from "react";
import headerImage from "@/assets/tcet header.png";
import footerImage from "@/assets/tcet footer.png";
import logoWatermark from "@/assets/img/logo.png";

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
    // Dynamic event date columns entered by user
    const eventDates = formData.eventDates || [];

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

    // Compute rowspans for grouped Roles & Responsibilities only when actual non-empty data supports grouping
    const rowSpanMap: number[] = new Array(rowsToRender.length).fill(1);
    const skipRowMap: boolean[] = new Array(rowsToRender.length).fill(false);

    let i = 0;
    while (i < rowsToRender.length) {
      const current = rowsToRender[i];
      const hasRoleContent = current.roles && current.roles.trim().length > 0;

      if (!hasRoleContent) {
        rowSpanMap[i] = 1;
        i++;
        continue;
      }

      let span = 1;
      let j = i + 1;
      while (j < rowsToRender.length) {
        const next = rowsToRender[j];
        const isSameGroup =
          (current.roleGroupId && next.roleGroupId && current.roleGroupId === next.roleGroupId) ||
          (current.roles.trim() === (next.roles || "").trim());

        if (isSameGroup) {
          span++;
          skipRowMap[j] = true;
          j++;
        } else {
          break;
        }
      }
      rowSpanMap[i] = span;
      i = j;
    }

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

    // Calculate column widths mathematically to ensure exact 100% table width
    const numDates = eventDates.length;
    let srWidth = "5%";
    let nameWidth = "23%";
    let desigWidth = "17%";
    let deptWidth = "8%";
    let timeWidth = "9%";
    let dateColWidth = "6.5%";
    let signWidth = "6.5%";
    let rolesWidth = "25%";

    if (numDates === 0) {
      srWidth = "6%";
      nameWidth = "26%";
      desigWidth = "20%";
      deptWidth = "9%";
      timeWidth = "10%";
      signWidth = "7%";
      rolesWidth = "22%";
    } else if (numDates === 1) {
      srWidth = "5%";
      nameWidth = "24%";
      desigWidth = "18%";
      deptWidth = "8%";
      timeWidth = "9%";
      dateColWidth = "7%";
      signWidth = "6.5%";
      rolesWidth = "22.5%";
    } else if (numDates === 2) {
      srWidth = "5%";
      nameWidth = "22%";
      desigWidth = "16.5%";
      deptWidth = "7.5%";
      timeWidth = "8.5%";
      dateColWidth = "6.5%";
      signWidth = "6%";
      rolesWidth = "21.5%";
    } else {
      // 3 or more dates
      const totalDateWidth = numDates * 5.5;
      dateColWidth = "5.5%";
      srWidth = "4.5%";
      nameWidth = "20%";
      desigWidth = "15%";
      deptWidth = "7%";
      timeWidth = "7.5%";
      signWidth = "5.5%";
      const remainder = 100 - (4.5 + 20 + 15 + 7 + 7.5 + 5.5 + totalDateWidth);
      rolesWidth = `${Math.max(16, remainder)}%`;
    }

    return (
      <div className="dc-preview-wrapper">
        <div ref={ref} className="dc-document-container">
          {/* Subtle Institutional Watermark */}
          <div className="dc-watermark-overlay" aria-hidden="true">
            <img src={logoWatermark} alt="" className="dc-watermark-img" />
          </div>

          {/* Official TCET Header Image */}
          <div className="dc-header-wrapper">
            <img src={headerImage} alt="TCET Header" className="dc-header-img" />
          </div>

          {/* Inner Content Area with Proper 16mm Institutional Margins */}
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

            {/* Main Duty Assignment Table */}
            <table className="dc-table">
              <thead>
                <tr>
                  <th style={{ width: srWidth }}>Sr. No</th>
                  <th style={{ width: nameWidth }}>Name of the Faculty / Staff</th>
                  <th style={{ width: desigWidth }}>Designation</th>
                  <th style={{ width: deptWidth }}>Dept.</th>
                  <th style={{ width: timeWidth }}>Reporting Time</th>
                  {eventDates.map((dateHeader, idx) => (
                    <th key={idx} style={{ width: dateColWidth }}>
                      {dateHeader}
                    </th>
                  ))}
                  <th style={{ width: signWidth }}>Sign</th>
                  <th style={{ width: rolesWidth }}>Roles and Responsibilities</th>
                </tr>
              </thead>
              <tbody>
                {rowsToRender.map((row, index) => {
                  const shouldSkipRole = skipRowMap[index];
                  const span = rowSpanMap[index];

                  return (
                    <tr key={index}>
                      <td className="dc-cell-center">
                        {row.name || row.designation || row.department ? `${row.srNo ?? index + 1}.` : ""}
                      </td>
                      <td className="dc-cell-name">{row.name || <>&nbsp;</>}</td>
                      <td className="dc-cell-desig">{row.designation || <>&nbsp;</>}</td>
                      <td className="dc-cell-center">{row.department || <>&nbsp;</>}</td>
                      <td className="dc-cell-center">{row.reportingTime || <>&nbsp;</>}</td>

                      {/* Dynamic Event-date checkmark columns */}
                      {eventDates.map((dHeader, dIdx) => {
                        const isAssigned = row.dutyDates ? !!row.dutyDates[dHeader] : false;
                        return (
                          <td key={dIdx} className="dc-cell-center dc-check-mark">
                            {isAssigned ? "√" : <>&nbsp;</>}
                          </td>
                        );
                      })}

                      <td className="dc-cell-center">{row.sign || <>&nbsp;</>}</td>

                      {/* Grouped or Individual Roles & Responsibilities */}
                      {!shouldSkipRole && (
                        <td
                          rowSpan={span > 1 ? span : undefined}
                          className="dc-cell-roles"
                        >
                          {renderRoleContent(row.roles)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Notes and Signatory / Copy To Section */}
            <div className="dc-bottom-container">
              {/* Notes */}
              <div className="dc-notes-block">
                <p className="dc-note-title">Note:</p>
                {formData.notes && formData.notes.length > 0 ? (
                  <ol className="dc-notes-list">
                    {formData.notes.map((note, nIdx) => (
                      <li key={nIdx}>{note}</li>
                    ))}
                  </ol>
                ) : (
                  <div style={{ minHeight: "10px" }} />
                )}
              </div>

              {/* Principal Signature Block on right & Copy to on left */}
              <div className="dc-signatory-row">
                <div className="dc-copyto-block">
                  <p className="dc-copyto-title">Copy to:</p>
                  {formData.copyTo && formData.copyTo.length > 0 ? (
                    <ul className="dc-copyto-list">
                      {formData.copyTo.map((item, cIdx) => (
                        <li key={cIdx}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ minHeight: "16px" }} />
                  )}
                </div>

                <div className="dc-principal-block">
                  {formData.signatoryName && (
                    <p className="dc-principal-name">{formData.signatoryName}</p>
                  )}
                  {formData.signatoryDesignation && (
                    <p className="dc-principal-title">{formData.signatoryDesignation}</p>
                  )}
                  {!formData.signatoryName && !formData.signatoryDesignation && (
                    <div style={{ height: "36px" }} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* TCET Official Footer Image */}
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
