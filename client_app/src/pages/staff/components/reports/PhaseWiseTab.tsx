import React, { useState, useMemo, useEffect } from "react";
import { PhaseWiseReport, PlacementReport, MonthData } from "./types";
import { Edit3, Save } from "lucide-react";
import toast from "react-hot-toast";
import { TextTabs, TabItem } from "./TextTabs";

interface Props {
  report: PlacementReport;
  phaseReports: PhaseWiseReport[];
  onUpdatePhases: (phases: PhaseWiseReport[]) => void;
  subtab?: string;
  onSubTabChange?: (subtab: SubTab) => void;
}

type SubTab = "I" | "II" | "III" | "SUMMARY";

const normalizeSubTab = (st?: string): SubTab => {
  if (!st) return "I";
  const upper = st.toUpperCase();
  if (upper === "I" || upper === "PHASE-1" || upper === "PHASE-I" || upper === "PHASE1") return "I";
  if (upper === "II" || upper === "PHASE-2" || upper === "PHASE-II" || upper === "PHASE2") return "II";
  if (upper === "III" || upper === "PHASE-3" || upper === "PHASE-III" || upper === "PHASE3") return "III";
  if (upper === "SUMMARY" || upper === "OVERALL" || upper === "OVERALL-SUMMARY") return "SUMMARY";
  return "I";
};

const PHASE_MONTHS: Record<"I" | "II" | "III", string[]> = {
  I: ["JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"],
  II: ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY"],
  III: ["JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"],
};

const PHASE_TABS: TabItem<SubTab>[] = [
  { key: "I", label: "Phase I (A)" },
  { key: "II", label: "Phase II (B)" },
  { key: "III", label: "Phase III (C)" },
  { key: "SUMMARY", label: "Overall Summary" },
];

export const PhaseWiseTab: React.FC<Props> = ({
  report,
  phaseReports,
  onUpdatePhases,
  subtab,
  onSubTabChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>(() => normalizeSubTab(subtab));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (subtab) {
      setActiveSubTab(normalizeSubTab(subtab));
    }
  }, [subtab]);

  const handleSubTabChange = (key: SubTab) => {
    setActiveSubTab(key);
    if (onSubTabChange) {
      onSubTabChange(key);
    }
  };

  // Local state for phase reports to enable clerk editing
  const [localPhases, setLocalPhases] = useState<PhaseWiseReport[]>(phaseReports);

  // Ensure phases I, II, III exist in state
  const phaseI: PhaseWiseReport = useMemo(() => {
    return (
      localPhases.find((p) => p.phase === "I") || {
        phase: "I" as const,
        total_admitted: report.admitted_final_year || 125,
        opt_out: report.opt_out || 4,
        opted_higher_studies: 0,
        interested: report.interested || 121,
        eligible: report.eligible || 117,
        companies_visited: 19,
        students_placed: 15,
        monthly_data: {
          JUNE: { companies: 2, placed: 3 },
          JULY: { companies: 0, placed: 0 },
          AUGUST: { companies: 10, placed: 3 },
          SEPTEMBER: { companies: 4, placed: 2 },
          OCTOBER: { companies: 3, placed: 7 },
          NOVEMBER: { companies: 0, placed: 0 },
          DECEMBER: { companies: 0, placed: 0 },
        } as Record<string, MonthData>,
        off_campus_placed: 0,
      }
    );
  }, [localPhases, report]);

  const phaseII: PhaseWiseReport = useMemo(() => {
    return (
      localPhases.find((p) => p.phase === "II") || {
        phase: "II" as const,
        total_admitted: report.admitted_final_year || 125,
        opt_out: 0,
        opted_higher_studies: 0,
        interested: 0,
        eligible: 0,
        companies_visited: 0,
        students_placed: 0,
        monthly_data: {
          JANUARY: { companies: 0, placed: 0 },
          FEBRUARY: { companies: 0, placed: 0 },
          MARCH: { companies: 0, placed: 0 },
          APRIL: { companies: 0, placed: 0 },
          MAY: { companies: 0, placed: 0 },
        } as Record<string, MonthData>,
        off_campus_placed: 0,
      }
    );
  }, [localPhases, report]);

  const phaseIII: PhaseWiseReport = useMemo(() => {
    return (
      localPhases.find((p) => p.phase === "III") || {
        phase: "III" as const,
        total_admitted: report.admitted_final_year || 125,
        opt_out: 0,
        opted_higher_studies: 0,
        interested: 0,
        eligible: 0,
        companies_visited: 0,
        students_placed: 0,
        monthly_data: {
          JUNE: { companies: 0, placed: 0 },
          JULY: { companies: 0, placed: 0 },
          AUGUST: { companies: 0, placed: 0 },
          SEPTEMBER: { companies: 0, placed: 0 },
          OCTOBER: { companies: 0, placed: 0 },
          NOVEMBER: { companies: 0, placed: 0 },
          DECEMBER: { companies: 0, placed: 0 },
        } as Record<string, MonthData>,
        off_campus_placed: 0,
      }
    );
  }, [localPhases, report]);

  // Compute subtotals dynamically
  const calcSubTotal = (p: PhaseWiseReport, months: string[]) => {
    let compSum = 0;
    let placedSum = 0;
    for (const m of months) {
      compSum += p.monthly_data?.[m]?.companies || 0;
      placedSum += p.monthly_data?.[m]?.placed || 0;
    }
    const totalPlaced = placedSum + (p.off_campus_placed || 0);
    const pct = p.interested ? ((totalPlaced / p.interested) * 100).toFixed(2) : "0.00";
    return { compSum, placedSum, totalPlaced, pct };
  };

  const subI = useMemo(() => calcSubTotal(phaseI, PHASE_MONTHS.I), [phaseI]);
  const subII = useMemo(() => calcSubTotal(phaseII, PHASE_MONTHS.II), [phaseII]);
  const subIII = useMemo(() => calcSubTotal(phaseIII, PHASE_MONTHS.III), [phaseIII]);

  const grandTotalPlaced = subI.totalPlaced + subII.totalPlaced + subIII.totalPlaced;
  const grandTotalCompanies = subI.compSum + subII.compSum + subIII.compSum;
  const overallPercentage = phaseI.interested
    ? ((grandTotalPlaced / phaseI.interested) * 100).toFixed(2)
    : "0.00";

  // Handle month field change
  const handleMonthChange = (
    phaseKey: "I" | "II" | "III",
    month: string,
    field: "companies" | "placed",
    value: number
  ) => {
    const updated = localPhases.map((p) => {
      if (p.phase === phaseKey) {
        const currentMonthData = p.monthly_data?.[month] || { companies: 0, placed: 0 };
        return {
          ...p,
          monthly_data: {
            ...p.monthly_data,
            [month]: {
              ...currentMonthData,
              [field]: isNaN(value) ? 0 : value,
            },
          },
        };
      }
      return p;
    });
    setLocalPhases(updated);
  };

  // Handle general field change (admitted, interested, eligible, etc.)
  const handleFieldChange = (
    phaseKey: "I" | "II" | "III",
    field: keyof PhaseWiseReport,
    value: any
  ) => {
    const updated = localPhases.map((p) => {
      if (p.phase === phaseKey) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setLocalPhases(updated);
  };

  const handleSave = () => {
    onUpdatePhases(localPhases);
    setIsEditing(false);
    toast.success("Phase-wise data saved");
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Official Sheet Header */}
      <div className="text-center pb-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">TCET</h2>
        <h3 className="text-sm font-semibold text-gray-700 mt-1">
          Phase wise Comparison — Number of Students Placed from Batch {report.batch} onward
        </h3>
        {/* Metadata row — pipe-separated with high contrast */}
        <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-1.5 text-xs text-gray-600 mt-3 pt-3 border-t border-gray-100 font-sans">
          <span className="font-medium text-gray-800">TCET/T&amp;P/FRM/IP-06/11</span>
          <span className="text-gray-300 font-light select-none">|</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
            Revision: B
          </span>
          <span className="text-gray-300 font-light select-none">|</span>
          <span>
            REF: <span className="font-semibold text-gray-900">{report.report_no || "TCET/ T&P/ REP 96 of 2026"}</span>
          </span>
          <span className="text-gray-300 font-light select-none">|</span>
          <span>
            Date: <span className="font-semibold text-gray-900">{report.report_date || "16/10/2026"}</span>
          </span>
        </div>
      </div>

      {/* Phase Navigation — Simple Horizontal Text Tabs with Moving Blue Underline */}
      <div className="flex items-center justify-between border-b border-gray-200 pt-1 pb-0 no-print gap-4">
        <TextTabs<SubTab>
          tabs={PHASE_TABS}
          activeKey={activeSubTab}
          onChange={handleSubTabChange}
          idPrefix="phase-subtab"
          className="border-b-0"
        />

        {/* Edit Phase Data action */}
        <div className="flex items-center gap-2 pb-2 flex-shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center h-7 px-3 rounded-md text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300/50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 h-7 px-3.5 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors focus:outline-none py-1 px-2.5 rounded hover:bg-gray-50"
            >
              <Edit3 className="w-3.5 h-3.5 text-gray-500" />
              <span>Edit Phase Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Phase I Tab View */}
      {activeSubTab === "I" && (
        <div className="space-y-6 report-tab-content">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
              <span className="w-1 h-5 rounded-full bg-blue-600 inline-block flex-shrink-0"></span>
              Phase I (A) — 2027 Batch
            </h3>
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3.5 py-1 rounded-full font-semibold">
              Placement: {subI.pct}%
            </span>
          </div>

          {/* Key Eligibility Figures — unified horizontal container with subtle dividers */}
          <div className="border border-gray-200 rounded-xl bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
              <div className="px-4 py-2 lg:first:pl-2">
                <span className="text-xs text-gray-500 font-medium block">Total Admitted</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={phaseI.total_admitted}
                    onChange={(e) =>
                      handleFieldChange("I", "total_admitted", parseInt(e.target.value) || 0)
                    }
                    className="w-full mt-1 p-1 border rounded text-lg font-bold"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-900 mt-1 block">{phaseI.total_admitted}</span>
                )}
              </div>

              <div className="px-4 py-2">
                <span className="text-xs text-gray-500 font-medium block">Opt Out of Campus</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={phaseI.opt_out}
                    onChange={(e) =>
                      handleFieldChange("I", "opt_out", parseInt(e.target.value) || 0)
                    }
                    className="w-full mt-1 p-1 border rounded text-lg font-bold"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-900 mt-1 block">{phaseI.opt_out}</span>
                )}
              </div>

              <div className="px-4 py-2">
                <span className="text-xs text-gray-500 font-medium block">Interested in Placement</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={phaseI.interested}
                    onChange={(e) =>
                      handleFieldChange("I", "interested", parseInt(e.target.value) || 0)
                    }
                    className="w-full mt-1 p-1 border rounded text-lg font-bold"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-900 mt-1 block">{phaseI.interested}</span>
                )}
              </div>

              <div className="px-4 py-2">
                <span className="text-xs text-gray-500 font-medium block">Eligible</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={phaseI.eligible}
                    onChange={(e) =>
                      handleFieldChange("I", "eligible", parseInt(e.target.value) || 0)
                    }
                    className="w-full mt-1 p-1 border rounded text-lg font-bold"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-900 mt-1 block">{phaseI.eligible}</span>
                )}
              </div>

              <div className="px-4 py-2 lg:last:pr-2">
                <span className="text-xs text-gray-500 font-medium block">Company Visited</span>
                <span className="text-2xl font-bold text-gray-900 mt-1 block">{subI.compSum}</span>
              </div>
            </div>
          </div>

          {/* Monthly Table — reference style */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <table className="report-phase-table">
              <thead>
                <tr>
                  <th className="text-left w-1/3">Month</th>
                  <th className="text-center w-1/3">Company Visited</th>
                  <th className="text-center w-1/3">Students Placed</th>
                </tr>
              </thead>
              <tbody>
                {PHASE_MONTHS.I.map((m) => {
                  const mData = phaseI.monthly_data?.[m] || { companies: 0, placed: 0 };
                  return (
                    <tr key={m}>
                      <td className="text-gray-800 font-medium text-xs uppercase tracking-wide">{m}</td>
                      <td className="text-center text-sm">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={mData.companies}
                            onChange={(e) =>
                              handleMonthChange("I", m, "companies", parseInt(e.target.value) || 0)
                            }
                            className="w-20 p-1 border border-gray-300 rounded text-center text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-700">{mData.companies}</span>
                        )}
                      </td>
                      <td className="text-center text-sm">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={mData.placed}
                            onChange={(e) =>
                              handleMonthChange("I", m, "placed", parseInt(e.target.value) || 0)
                            }
                            className="w-20 p-1 border border-gray-300 rounded text-center text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-900 font-semibold">{mData.placed}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="row-subtotal">
                  <td className="text-xs font-bold uppercase tracking-wider">SUB TOTAL (A)</td>
                  <td className="text-center text-sm font-bold text-gray-900">{subI.compSum}</td>
                  <td className="text-center text-sm font-bold text-gray-900">{subI.placedSum}</td>
                </tr>
                <tr className="row-percentage">
                  <td className="text-xs font-semibold text-gray-800">% of Placement (out of Interested)</td>
                  <td colSpan={2} className="text-center font-extrabold text-sm text-blue-700">{subI.pct}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Phase II Tab View */}
      {activeSubTab === "II" && (
        <div className="space-y-6 report-tab-content">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
              <span className="w-1 h-5 rounded-full bg-blue-600 inline-block flex-shrink-0"></span>
              Phase II (B) — 2027 Batch
            </h3>
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3.5 py-1 rounded-full font-semibold">
              Placement: {subII.pct}%
            </span>
          </div>

          {/* Key Eligibility Figures — matching Option 1 horizontal divided row */}
          <div className="border border-gray-200 rounded-xl bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
              <div className="px-4 py-2 lg:first:pl-2">
                <span className="text-xs text-gray-500 font-medium block">Total Admitted</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={phaseII.total_admitted}
                    onChange={(e) =>
                      handleFieldChange("II", "total_admitted", parseInt(e.target.value) || 0)
                    }
                    className="w-full mt-1 p-1 border rounded text-lg font-bold"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-900 mt-1 block">{phaseII.total_admitted}</span>
                )}
              </div>

              <div className="px-4 py-2">
                <span className="text-xs text-gray-500 font-medium block">Opted for Higher Studies</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={phaseII.opted_higher_studies}
                    onChange={(e) =>
                      handleFieldChange("II", "opted_higher_studies", parseInt(e.target.value) || 0)
                    }
                    className="w-full mt-1 p-1 border rounded text-lg font-bold"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-900 mt-1 block">{phaseII.opted_higher_studies}</span>
                )}
              </div>

              <div className="px-4 py-2">
                <span className="text-xs text-gray-500 font-medium block">Interested in Placement</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={phaseII.interested}
                    onChange={(e) =>
                      handleFieldChange("II", "interested", parseInt(e.target.value) || 0)
                    }
                    className="w-full mt-1 p-1 border rounded text-lg font-bold"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-900 mt-1 block">{phaseII.interested}</span>
                )}
              </div>

              <div className="px-4 py-2">
                <span className="text-xs text-gray-500 font-medium block">Eligible</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={phaseII.eligible}
                    onChange={(e) =>
                      handleFieldChange("II", "eligible", parseInt(e.target.value) || 0)
                    }
                    className="w-full mt-1 p-1 border rounded text-lg font-bold"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-900 mt-1 block">{phaseII.eligible}</span>
                )}
              </div>

              <div className="px-4 py-2 lg:last:pr-2">
                <span className="text-xs text-gray-500 font-medium block">Company Visited</span>
                <span className="text-2xl font-bold text-gray-900 mt-1 block">{subII.compSum}</span>
              </div>
            </div>
          </div>

          {/* Monthly Table — reference style */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <table className="report-phase-table">
              <thead>
                <tr>
                  <th className="text-left w-1/3">Month</th>
                  <th className="text-center w-1/3">Company Visited</th>
                  <th className="text-center w-1/3">Students Placed</th>
                </tr>
              </thead>
              <tbody>
                {PHASE_MONTHS.II.map((m) => {
                  const mData = phaseII.monthly_data?.[m] || { companies: 0, placed: 0 };
                  return (
                    <tr key={m}>
                      <td className="text-gray-800 font-medium text-xs uppercase tracking-wide">{m}</td>
                      <td className="text-center text-sm">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={mData.companies}
                            onChange={(e) =>
                              handleMonthChange("II", m, "companies", parseInt(e.target.value) || 0)
                            }
                            className="w-20 p-1 border border-gray-300 rounded text-center text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-700">{mData.companies}</span>
                        )}
                      </td>
                      <td className="text-center text-sm">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={mData.placed}
                            onChange={(e) =>
                              handleMonthChange("II", m, "placed", parseInt(e.target.value) || 0)
                            }
                            className="w-20 p-1 border border-gray-300 rounded text-center text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-900 font-semibold">{mData.placed}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="row-subtotal">
                  <td className="text-xs font-bold uppercase tracking-wider">SUB TOTAL (B)</td>
                  <td className="text-center text-sm font-bold text-gray-900">{subII.compSum}</td>
                  <td className="text-center text-sm font-bold text-gray-900">{subII.placedSum}</td>
                </tr>
                <tr className="row-percentage">
                  <td className="text-xs font-semibold text-gray-800">% of Placement (B)</td>
                  <td colSpan={2} className="text-center font-extrabold text-sm text-blue-700">{subII.pct}%</td>
                </tr>
                <tr className="row-combined">
                  <td className="text-xs font-bold uppercase tracking-wider">Total (A + B)</td>
                  <td className="text-center text-sm font-bold text-gray-900">{subI.compSum + subII.compSum}</td>
                  <td className="text-center text-sm font-bold text-gray-900">{subI.totalPlaced + subII.totalPlaced}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Phase III Tab View */}
      {activeSubTab === "III" && (
        <div className="space-y-6 report-tab-content">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
              <span className="w-1 h-5 rounded-full bg-blue-600 inline-block flex-shrink-0"></span>
              Phase III (C) — 2027 Batch
            </h3>
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3.5 py-1 rounded-full font-semibold">
              Placement: {subIII.pct}%
            </span>
          </div>

          {/* Key Eligibility Figures — matching Option 1 horizontal divided row */}
          <div className="border border-gray-200 rounded-xl bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
              <div className="px-4 py-2 lg:first:pl-2">
                <span className="text-xs text-gray-500 font-medium block">Total Admitted</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={phaseIII.total_admitted}
                    onChange={(e) =>
                      handleFieldChange("III", "total_admitted", parseInt(e.target.value) || 0)
                    }
                    className="w-full mt-1 p-1 border rounded text-lg font-bold"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-900 mt-1 block">{phaseIII.total_admitted}</span>
                )}
              </div>

              <div className="px-4 py-2">
                <span className="text-xs text-gray-500 font-medium block">Opted for Higher Studies</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={phaseIII.opted_higher_studies}
                    onChange={(e) =>
                      handleFieldChange("III", "opted_higher_studies", parseInt(e.target.value) || 0)
                    }
                    className="w-full mt-1 p-1 border rounded text-lg font-bold"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-900 mt-1 block">{phaseIII.opted_higher_studies}</span>
                )}
              </div>

              <div className="px-4 py-2">
                <span className="text-xs text-gray-500 font-medium block">Interested in Placement</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={phaseIII.interested}
                    onChange={(e) =>
                      handleFieldChange("III", "interested", parseInt(e.target.value) || 0)
                    }
                    className="w-full mt-1 p-1 border rounded text-lg font-bold"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-900 mt-1 block">{phaseIII.interested}</span>
                )}
              </div>

              <div className="px-4 py-2">
                <span className="text-xs text-gray-500 font-medium block">Eligible</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={phaseIII.eligible}
                    onChange={(e) =>
                      handleFieldChange("III", "eligible", parseInt(e.target.value) || 0)
                    }
                    className="w-full mt-1 p-1 border rounded text-lg font-bold"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-900 mt-1 block">{phaseIII.eligible}</span>
                )}
              </div>

              <div className="px-4 py-2 lg:last:pr-2">
                <span className="text-xs text-gray-500 font-medium block">Company Visited</span>
                <span className="text-2xl font-bold text-gray-900 mt-1 block">{subIII.compSum}</span>
              </div>
            </div>
          </div>

          {/* Monthly Table — reference style */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <table className="report-phase-table">
              <thead>
                <tr>
                  <th className="text-left w-1/3">Month</th>
                  <th className="text-center w-1/3">Company Visited</th>
                  <th className="text-center w-1/3">Students Placed</th>
                </tr>
              </thead>
              <tbody>
                {PHASE_MONTHS.III.map((m) => {
                  const mData = phaseIII.monthly_data?.[m] || { companies: 0, placed: 0 };
                  return (
                    <tr key={m}>
                      <td className="text-gray-800 font-medium text-xs uppercase tracking-wide">{m}</td>
                      <td className="text-center text-sm">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={mData.companies}
                            onChange={(e) =>
                              handleMonthChange("III", m, "companies", parseInt(e.target.value) || 0)
                            }
                            className="w-20 p-1 border border-gray-300 rounded text-center text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-700">{mData.companies}</span>
                        )}
                      </td>
                      <td className="text-center text-sm">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={mData.placed}
                            onChange={(e) =>
                              handleMonthChange("III", m, "placed", parseInt(e.target.value) || 0)
                            }
                            className="w-20 p-1 border border-gray-300 rounded text-center text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-900 font-semibold">{mData.placed}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td className="font-semibold text-gray-800 text-xs uppercase tracking-wide">Off-Campus</td>
                  <td className="text-center text-gray-400 text-sm">—</td>
                  <td className="text-center text-sm">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={phaseIII.off_campus_placed || 0}
                        onChange={(e) =>
                          handleFieldChange("III", "off_campus_placed", parseInt(e.target.value) || 0)
                        }
                        className="w-20 p-1 border border-gray-300 rounded text-center font-bold text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="font-bold text-gray-900">{phaseIII.off_campus_placed || 0}</span>
                    )}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="row-subtotal">
                  <td className="text-xs font-bold uppercase tracking-wider">SUB TOTAL (C)</td>
                  <td className="text-center text-sm font-bold text-gray-900">{subIII.compSum}</td>
                  <td className="text-center text-sm font-bold text-gray-900">{subIII.totalPlaced}</td>
                </tr>
                <tr className="row-percentage">
                  <td className="text-xs font-semibold text-gray-800">% of Placement (C)</td>
                  <td colSpan={2} className="text-center font-extrabold text-sm text-blue-700">{subIII.pct}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Overall Summary View */}
      {activeSubTab === "SUMMARY" && (
        <div className="space-y-6 report-tab-content">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                <span className="w-1 h-5 rounded-full bg-blue-600 inline-block flex-shrink-0"></span>
                Overall Phase-wise Summary — 2027 Batch
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Cumulative totals across Phase I (A), Phase II (B), and Phase III (C)
              </p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3.5 py-1 rounded-full font-semibold">
              Overall Placement: {overallPercentage}%
            </span>
          </div>

          {/* Key Overall Figures — matching Option 1 horizontal divided row */}
          <div className="border border-gray-200 rounded-xl bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
              <div className="px-4 py-2 lg:first:pl-2">
                <span className="text-xs text-gray-500 font-medium block">Total Placed (A+B+C)</span>
                <span className="text-2xl font-bold text-gray-900 mt-1 block">{grandTotalPlaced}</span>
              </div>

              <div className="px-4 py-2">
                <span className="text-xs text-gray-500 font-medium block">Companies Visited</span>
                <span className="text-2xl font-bold text-gray-900 mt-1 block">{grandTotalCompanies}</span>
              </div>

              <div className="px-4 py-2">
                <span className="text-xs text-gray-500 font-medium block">Overall Placement %</span>
                <span className="text-2xl font-bold text-blue-600 mt-1 block">{overallPercentage}%</span>
              </div>

              <div className="px-4 py-2">
                <span className="text-xs text-gray-500 font-medium block">Total Admitted</span>
                <span className="text-2xl font-bold text-gray-900 mt-1 block">{phaseI.total_admitted}</span>
              </div>

              <div className="px-4 py-2 lg:last:pr-2">
                <span className="text-xs text-gray-500 font-medium block">Interested in Placement</span>
                <span className="text-2xl font-bold text-gray-900 mt-1 block">{phaseI.interested}</span>
              </div>
            </div>
          </div>

          {/* Breakdown Comparison Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <table className="report-phase-table">
              <thead>
                <tr>
                  <th className="text-left w-2/5">Phase Category</th>
                  <th className="text-center w-1/5">Company Visited</th>
                  <th className="text-center w-1/5">Students Placed</th>
                  <th className="text-center w-1/5">% of Placement</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold text-gray-900">
                    Phase I (A) — June to December
                  </td>
                  <td className="text-center text-gray-700">{subI.compSum}</td>
                  <td className="text-center font-semibold text-gray-900">{subI.totalPlaced}</td>
                  <td className="text-center font-bold text-blue-700">{subI.pct}%</td>
                </tr>
                <tr>
                  <td className="font-semibold text-gray-900">
                    Phase II (B) — January to May
                  </td>
                  <td className="text-center text-gray-700">{subII.compSum}</td>
                  <td className="text-center font-semibold text-gray-900">{subII.totalPlaced}</td>
                  <td className="text-center font-bold text-blue-700">{subII.pct}%</td>
                </tr>
                <tr>
                  <td className="font-semibold text-gray-900">
                    Phase III (C) — June to December + Off-Campus
                  </td>
                  <td className="text-center text-gray-700">{subIII.compSum}</td>
                  <td className="text-center font-semibold text-gray-900">{subIII.totalPlaced}</td>
                  <td className="text-center font-bold text-blue-700">{subIII.pct}%</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="row-grandtotal">
                  <td className="uppercase tracking-wider">Grand Total (A + B + C)</td>
                  <td className="text-center text-sm">{grandTotalCompanies}</td>
                  <td className="text-center font-extrabold text-sm text-gray-900">
                    {grandTotalPlaced}
                  </td>
                  <td className="text-center font-extrabold text-sm text-blue-700">{overallPercentage}%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signatories Block from Template */}
          <div className="bg-gray-50/70 p-5 rounded-xl border border-gray-200 text-xs space-y-4">
            <h4 className="font-bold text-gray-800 border-b border-gray-200 pb-2">Approval Signatories</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
              <div className="bg-white border border-gray-200 p-3 rounded-lg text-center shadow-xs">
                <div className="font-bold text-gray-900">(Rajesh Singh)</div>
                <div className="text-gray-500 text-[11px] mt-0.5">Sr.Clerk</div>
                <div className="text-gray-400 text-[11px] mt-2">Date: 16/10/2026</div>
              </div>
              <div className="bg-white border border-gray-200 p-3 rounded-lg text-center shadow-xs">
                <div className="font-bold text-gray-900">(Ms. Rupali Mane)</div>
                <div className="text-gray-500 text-[11px] mt-0.5">Dy. (Placement Officer)</div>
                <div className="text-gray-400 text-[11px] mt-2">Date: 16/10/2026</div>
              </div>
              <div className="bg-white border border-gray-200 p-3 rounded-lg text-center shadow-xs">
                <div className="font-bold text-gray-900">(Dr. Zahir Aalam)</div>
                <div className="text-gray-500 text-[11px] mt-0.5">Dean (TP&IL)</div>
                <div className="text-gray-400 text-[11px] mt-2">Date: 16/10/2026</div>
              </div>
              <div className="bg-white border border-gray-200 p-3 rounded-lg text-center shadow-xs">
                <div className="font-bold text-gray-900">(Dr. R.R. Sedamkar)</div>
                <div className="text-gray-500 text-[11px] mt-0.5">Vice-Principal</div>
                <div className="text-gray-400 text-[11px] mt-2">Date: 16/10/2026</div>
              </div>
            </div>

            <div className="text-gray-600 space-y-1 pt-2 border-t border-gray-200 text-[11px]">
              <div>
                <strong className="text-gray-700">Due Date:</strong> 19/10/2026
              </div>
              <div>
                <strong className="text-gray-700">Completion Date:</strong> 16/10/2026
              </div>
              <div>
                <strong className="text-gray-700">If not Completed as per the due date (Reason):</strong> Capgemini result Declared as on 16/10/2026
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
