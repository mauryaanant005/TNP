// NoticePreview.tsx — Infrastructure Notice (Official TCET Format)
import React from "react";
import "../../../placement_officer/components/notice.css";
import noticeHeader from "@/assets/tcet header.png";
import noticeFooter from "@/assets/tcet footer.png";
import logoWatermark from "@/assets/img/logo.png";
import type { InfraFormData } from "./InfraNotice";

const formatDate = (dateStr?: string): string => {
  if (!dateStr) {
    return new Date()
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-");
  }
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return dateStr;
  return parsed
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, "-");
};

const NoticePreview = React.forwardRef<
  HTMLDivElement,
  { formData: InfraFormData }
>(({ formData }, ref) => {
  const formattedDate = formatDate(formData.date);
  const currentYear = new Date().getFullYear();

  return (
    <div className="notice-document-wrapper">
      <div
        className="main-notice"
        ref={ref}
        style={{
          position: "relative",
          fontFamily: "Arial, Helvetica, sans-serif",
          color: "#000000",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Subtle Institutional Watermark Overlay */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            opacity: 0.05,
            pointerEvents: "none",
            zIndex: 0,
            width: "420px",
            maxWidth: "70%",
            textAlign: "center",
          }}
        >
          <img
            src={logoWatermark}
            alt=""
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>

        {/* Multi-page table layout: repeating header & footer reservation */}
        <table
          className="notice-page-table"
          style={{ position: "relative", zIndex: 1, width: "100%" }}
        >
          <thead className="notice-page-thead">
            <tr>
              <td>
                {/* Official TCET Letterhead Header */}
                <div className="notice-header-container">
                  <img
                    src={noticeHeader}
                    alt="Thakur College of Engineering & Technology"
                    className="header-image"
                  />
                </div>
              </td>
            </tr>
          </thead>

          <tfoot className="notice-page-tfoot">
            <tr>
              <td>
                <div className="notice-footer-spacer" />
              </td>
            </tr>
          </tfoot>

          <tbody className="notice-page-tbody">
            <tr>
              <td>
                <div
                  className="notice-body-content"
                  style={{ padding: "0 12mm" }}
                >
                  {/* Institutional Top Band: Centered Cell Title, Document Code on Left, Revision on Right */}
                  <div
                    style={{
                      position: "relative",
                      marginTop: "4px",
                      marginBottom: "10px",
                      minHeight: "22px",
                      lineHeight: "1.2",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "2px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#000000",
                      }}
                    >
                      TCET/FRM/MP-04/11
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#000000",
                      }}
                    >
                      Training and Placement Cell
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "2px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#000000",
                      }}
                    >
                      Revision: B
                    </div>
                  </div>

                  {/* Reference & Recipient (Left) vs Date & Sender (Right) */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "10px",
                      fontSize: "12px",
                      lineHeight: "1.4",
                      color: "#000000",
                    }}
                  >
                    {/* Left Column: Ref No + To */}
                    <div>
                      <div style={{ marginBottom: "14px" }}>
                        <span style={{ fontWeight: 700 }}>Ref No.:</span>{" "}
                        {formData.refNo && formData.refNo.trim()
                          ? formData.refNo
                          : `TCET/ T&P/IB/        /${currentYear}.`}
                      </div>
                      <div>
                        <div>To</div>
                        <div>{formData.toName || "The Principal"}</div>
                        {formData.toDesignation && (
                          <div>{formData.toDesignation}</div>
                        )}
                        <div>{formData.toInstitution || "TCET"}</div>
                        <div>{formData.toCity || "Kandivali East"}</div>
                        <div>{formData.toPin || "Mumbai – 400101"}</div>
                      </div>
                    </div>

                    {/* Right Column: Date + Sender Authority */}
                    <div style={{ textAlign: "left", minWidth: "170px" }}>
                      <div>{formattedDate}</div>
                      <div style={{ fontWeight: 700 }}>
                        {formData.senderName || "Dr. Zahir Aalam"}
                      </div>
                      <div>{formData.senderDesignation || "Dean (TP&IL)"}</div>
                      <div>{formData.senderInstitution || "TCET"}</div>
                      <div>{formData.senderCity || "Kandivali East"}</div>
                      <div>{formData.senderPin || "Mumbai – 400101"}</div>
                    </div>
                  </div>

                  {/* Main Body */}
                  <div
                    className="main-body"
                    style={{ fontSize: "12px", color: "#000000" }}
                  >
                    {/* Subject */}
                    <p style={{ margin: "8px 0 6px 0", fontWeight: 700 }}>
                      Sub:{" "}
                      {formData.subject && formData.subject.trim()
                        ? formData.subject
                        : ""}
                    </p>

                    {/* Salutation */}
                    <p style={{ margin: "6px 0 6px 0", fontWeight: 700 }}>
                      {formData.salutation || "Respected Sir,"}
                    </p>

                    {/* Intro paragraph */}
                    {formData.introParagraph && formData.introParagraph.trim() && (
                      <p
                        style={{
                          margin: "6px 0 10px 0",
                          textAlign: "justify",
                          lineHeight: "1.45",
                        }}
                      >
                        {formData.introParagraph}
                      </p>
                    )}

                    {/* Infrastructure Details Table */}
                    <div className="table-wrapper" style={{ margin: "8px 0" }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          border: "1px solid #000000",
                          fontSize: "11px",
                          color: "#000000",
                        }}
                      >
                        <thead>
                          <tr style={{ backgroundColor: "#ffffff" }}>
                            <th
                              style={{
                                width: "17%",
                                border: "1px solid #000000",
                                padding: "6px 8px",
                                textAlign: "center",
                                fontWeight: 700,
                              }}
                            >
                              Particulars
                            </th>
                            <th
                              style={{
                                width: "53%",
                                border: "1px solid #000000",
                                padding: "6px 8px",
                                textAlign: "center",
                                fontWeight: 700,
                              }}
                            >
                              Requirements
                            </th>
                            <th
                              style={{
                                width: "30%",
                                border: "1px solid #000000",
                                padding: "6px 8px",
                                textAlign: "center",
                                fontWeight: 700,
                              }}
                            >
                              Remark
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.tableRows.map((row, index) => (
                            <tr key={index} style={{ pageBreakInside: "avoid" }}>
                              <td
                                style={{
                                  border: "1px solid #000000",
                                  padding: "6px 8px",
                                  verticalAlign: "top",
                                  fontWeight: 600,
                                }}
                              >
                                {row.particulars}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #000000",
                                  padding: "6px 8px",
                                  verticalAlign: "top",
                                  whiteSpace: "pre-wrap",
                                  lineHeight: "1.4",
                                }}
                              >
                                {row.requirements || <>&nbsp;</>}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #000000",
                                  padding: "6px 8px",
                                  verticalAlign: "top",
                                  whiteSpace: "pre-wrap",
                                  lineHeight: "1.4",
                                }}
                              >
                                {row.remarks || <>&nbsp;</>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Note: Flows immediately after table */}
                    {formData.note && formData.note.trim() && (
                      <div
                        style={{
                          margin: "8px 0 6px 0",
                          fontSize: "11.5px",
                          lineHeight: "1.4",
                          pageBreakInside: "avoid",
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>Note:</span>{" "}
                        <span style={{ whiteSpace: "pre-wrap" }}>
                          {formData.note}
                        </span>
                      </div>
                    )}

                    {/* Closing paragraph */}
                    {formData.closingParagraph && formData.closingParagraph.trim() && (
                      <p
                        style={{
                          marginTop: "8px",
                          marginBottom: "4px",
                          textAlign: "justify",
                          lineHeight: "1.45",
                          pageBreakInside: "avoid",
                        }}
                      >
                        {formData.closingParagraph}
                      </p>
                    )}

                    {/* Thanking line */}
                    {formData.thankingLine && (
                      <p
                        style={{
                          marginTop: "6px",
                          marginBottom: "2px",
                          pageBreakInside: "avoid",
                        }}
                      >
                        {formData.thankingLine}
                      </p>
                    )}

                    {/* Signatory (Right, ABOVE) and Copy to (Left, BELOW) */}
                    <div
                      style={{
                        marginTop: "14px",
                        marginBottom: "8px",
                        pageBreakInside: "avoid",
                      }}
                    >
                      {/* Signatory Block — Positioned on Right, ABOVE Copy to */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          width: "100%",
                          marginBottom: "14px",
                        }}
                      >
                        <div style={{ textAlign: "right" }}>
                          <div>{formData.regardsLine || "Yours Sincerely,"}</div>
                          <div style={{ height: "30px" }} />
                          <div style={{ fontWeight: 700 }}>
                            ({formData.signatoryName || "Dr. Zahir Aalam"})
                          </div>
                          <div style={{ fontWeight: 700 }}>
                            {formData.signatoryDesignation || "Dean (TP&IL)"}
                          </div>
                        </div>
                      </div>

                      {/* Copy to Section — Positioned on Left, BELOW Signatory */}
                      <div
                        style={{
                          fontSize: "11px",
                          lineHeight: "1.4",
                          color: "#000000",
                          textAlign: "left",
                          width: "100%",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            textDecoration: "underline",
                          }}
                        >
                          Copy to:
                        </span>{" "}
                        <span>
                          {formData.copyTo ||
                            "Principal / Vice-Principal / All Deans / HODs / Section in charges / Librarian / Mr. Binay Vyas"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* TCET Institutional Footer (fixed to bottom on print) */}
        <div className="notice-footer-fixed">
          <img src={noticeFooter} alt="Footer" className="footer-image" />
        </div>
      </div>
    </div>
  );
});

NoticePreview.displayName = "NoticePreview";
export default NoticePreview;
