import React, { useState, useMemo } from "react";
import { CompanyRecord } from "./types";
import { Search, Plus, Trash2, Edit2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  companies: CompanyRecord[];
  onUpdateCompanies: (companies: CompanyRecord[]) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const BATCH_YEARS = ["2019", "2020", "2021", "2022", "2023", "2024", "2027"];

const emptyCompany: CompanyRecord = {
  company_name: "",
  first_visit_year: new Date().getFullYear().toString(),
  mnc_status: "Indian Company",
  criteria_yes_no: "Yes",
  technical_yes_no: "Yes",
  batch_data: {
    "2019": "—",
    "2020": "—",
    "2021": "—",
    "2022": "—",
    "2023": "—",
    "2024": "—",
    "2027": "In Process",
  },
  is_current_batch: true,
};

export const ListOfCompanyTab: React.FC<Props> = ({
  companies,
  onUpdateCompanies,
  loading = false,
  error = null,
  onRetry,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [mncFilter, setMncFilter] = useState("ALL");
  const [currentOnly, setCurrentOnly] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<CompanyRecord>(emptyCompany);

  // Filtered companies
  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const matchSearch =
        searchTerm === "" ||
        c.company_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchMnc =
        mncFilter === "ALL" ||
        (mncFilter === "MNCs" && c.mnc_status === "MNCs") ||
        (mncFilter === "Indian" && c.mnc_status === "Indian Company");

      const matchCurrent = !currentOnly || c.is_current_batch;

      return matchSearch && matchMnc && matchCurrent;
    });
  }, [companies, searchTerm, mncFilter, currentOnly]);

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setFormData({ ...emptyCompany });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (index: number) => {
    setEditingIndex(index);
    setFormData({ ...companies[index] });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrimmed = formData.company_name.trim();
    if (!nameTrimmed) {
      toast.error("Please enter company name");
      return;
    }

    // Duplicate check
    const isDuplicate = companies.some(
      (c, idx) =>
        idx !== editingIndex &&
        c.company_name.toLowerCase() === nameTrimmed.toLowerCase()
    );
    if (isDuplicate) {
      toast.error(`Company "${nameTrimmed}" already exists in the list!`);
      return;
    }

    if (editingIndex !== null) {
      const updated = [...companies];
      updated[editingIndex] = {
        ...formData,
        company_name: nameTrimmed,
      };
      onUpdateCompanies(updated);
      toast.success("Company record updated");
    } else {
      const newCompany: CompanyRecord = {
        ...formData,
        company_name: nameTrimmed,
      };
      onUpdateCompanies([...companies, newCompany]);
      toast.success("New company added");
    }
    setIsModalOpen(false);
  };

  const handleDelete = (index: number) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${companies[index].company_name}?`
      )
    ) {
      const updated = companies.filter((_, i) => i !== index);
      onUpdateCompanies(updated);
      toast.success("Company deleted");
    }
  };

  return (
    <div className="space-y-6">
      {/* Official Document Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="text-center pb-4">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">TCET</h2>
          <h3 className="text-sm font-semibold text-gray-700 mt-1">
            List of Company — (Batch-wise &amp; Company-wise Placement Record)
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-1.5 text-xs text-gray-600 mt-3 pt-3 border-t border-gray-100 font-sans">
            <span className="font-medium text-gray-800">TCET/T&amp;P/FRM/IP-06/11</span>
            <span className="text-gray-300 font-light select-none">|</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              Revision: B
            </span>
            <span className="text-gray-300 font-light select-none">|</span>
            <span>
              REF: <span className="font-semibold text-gray-900">TCET/ T&amp;P/ REP 97 of 2026</span>
            </span>
            <span className="text-gray-300 font-light select-none">|</span>
            <span>
              Date: <span className="font-semibold text-gray-900">05/09/2024</span>
            </span>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-3 items-center justify-between no-print">
        <div className="flex flex-wrap gap-3 items-center flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search companies by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-9 pr-3.5 bg-white text-gray-900 placeholder:text-gray-500 text-xs sm:text-[13px] rounded-lg border border-gray-200 hover:border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-150"
            />
          </div>

          {/* MNC filter */}
          <select
            value={mncFilter}
            onChange={(e) => setMncFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-gray-200 bg-white font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Company Types</option>
            <option value="MNCs">MNCs Only</option>
            <option value="Indian">Indian Company Only</option>
          </select>

          {/* Current Batch Toggle */}
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer bg-white border border-gray-200 px-3 py-1.5 rounded-lg select-none">
            <input
              type="checkbox"
              checked={currentOnly}
              onChange={(e) => setCurrentOnly(e.target.checked)}
              className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500"
            />
            Current 2027 Batch Only
          </label>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Company</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-gray-700 sticky top-0 z-10 font-semibold border-b border-gray-200">
              <tr>
                <th className="p-2.5 border-r border-gray-200 text-center w-12" rowSpan={2}>
                  Sr. No.
                </th>
                <th className="p-2.5 border-r border-gray-200 min-w-[200px]" rowSpan={2}>
                  Name of the Company
                </th>
                <th className="p-2.5 border-r border-gray-200 text-center w-24" rowSpan={2}>
                  Visit First Time
                </th>
                <th className="p-2.5 border-r border-gray-200 text-center w-28" rowSpan={2}>
                  MNC / Indian
                </th>
                <th
                  className="p-1 border-r border-gray-200 text-center bg-blue-50/70 text-blue-900 font-semibold"
                  colSpan={BATCH_YEARS.length}
                >
                  Batch-wise Placement
                </th>
                <th className="p-2.5 border-r border-gray-200 text-center w-24" rowSpan={2}>
                  Criteria (Yes/No)
                </th>
                <th className="p-2.5 border-r border-gray-200 text-center w-24" rowSpan={2}>
                  Technical Yes/No
                </th>
                <th className="p-2.5 text-center w-20 no-print" rowSpan={2}>
                  Actions
                </th>
              </tr>
              <tr className="bg-slate-50/60 border-t border-gray-200">
                {BATCH_YEARS.map((y) => (
                  <th
                    key={y}
                    className={`p-1.5 border-r border-gray-200 text-center w-14 font-semibold ${
                      y === "2027" ? "bg-amber-100 text-amber-900 font-bold" : "text-gray-600"
                    }`}
                  >
                    {y}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium text-gray-600">Loading company records...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center">
                    <div className="inline-flex flex-col items-center gap-2 text-rose-600">
                      <span className="font-medium text-xs">{error}</span>
                      {onRetry && (
                        <button
                          type="button"
                          onClick={onRetry}
                          className="mt-1 px-3 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors cursor-pointer"
                        >
                          Retry Loading
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-gray-400">
                    {searchTerm || mncFilter !== "ALL" || currentOnly
                      ? "No company records match the current filters."
                      : "No company records found."}
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => (
                  <tr
                    key={c.id || idx}
                    className="hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="p-2.5 border-r border-gray-200 text-center font-medium text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="p-2.5 border-r border-gray-200 font-semibold text-gray-900">
                      {c.company_name}
                    </td>
                    <td className="p-2.5 border-r border-gray-200 text-center text-gray-600">
                      {c.first_visit_year || "—"}
                    </td>
                    <td className="p-2.5 border-r border-gray-200 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          c.mnc_status === "MNCs"
                            ? "bg-purple-100 text-purple-800"
                            : c.mnc_status === "Indian Company"
                            ? "bg-blue-100 text-blue-800"
                            : "text-gray-400"
                        }`}
                      >
                        {c.mnc_status || "—"}
                      </span>
                    </td>
                    {BATCH_YEARS.map((y) => {
                      const val = c.batch_data?.[y] ?? "—";
                      const is2027 = y === "2027";
                      return (
                        <td
                          key={y}
                          className={`p-2 border-r border-gray-200 text-center font-medium ${
                            is2027
                              ? val === "In Process"
                                ? "bg-amber-50 text-amber-800 font-semibold text-[11px]"
                                : "bg-emerald-50 text-emerald-800 font-bold"
                              : "text-gray-600"
                          }`}
                        >
                          {val}
                        </td>
                      );
                    })}
                    <td className="p-2.5 border-r border-gray-200 text-center">
                      {c.criteria_yes_no === "Yes" ? (
                        <span className="text-emerald-700 font-bold">Yes</span>
                      ) : c.criteria_yes_no === "No" ? (
                        <span className="text-gray-500">No</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-2.5 border-r border-gray-200 text-center">
                      {c.technical_yes_no === "Yes" ? (
                        <span className="text-blue-700 font-bold">Yes</span>
                      ) : c.technical_yes_no === "No" ? (
                        <span className="text-gray-500">No</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(companies.indexOf(c))}
                          className="inline-flex items-center justify-center w-7 h-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit Company"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(companies.indexOf(c))}
                          className="inline-flex items-center justify-center w-7 h-7 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Company"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Company Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">
              {editingIndex !== null ? "Edit Company Record" : "Add New Company"}
            </h3>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Capgemini or Infosys"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    First Visit Year
                  </label>
                  <input
                    type="text"
                    value={formData.first_visit_year}
                    onChange={(e) =>
                      setFormData({ ...formData, first_visit_year: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 2016"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    MNC Status
                  </label>
                  <select
                    value={formData.mnc_status}
                    onChange={(e) =>
                      setFormData({ ...formData, mnc_status: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="MNCs">MNCs</option>
                    <option value="Indian Company">Indian Company</option>
                    <option value="">— (Not Specified)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Criteria (Yes/No)
                  </label>
                  <select
                    value={formData.criteria_yes_no}
                    onChange={(e) =>
                      setFormData({ ...formData, criteria_yes_no: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="">—</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Technical Yes/No
                  </label>
                  <select
                    value={formData.technical_yes_no}
                    onChange={(e) =>
                      setFormData({ ...formData, technical_yes_no: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="">—</option>
                  </select>
                </div>
              </div>

              {/* Batch-wise Placement figures */}
              <div className="pt-2">
                <label className="block text-gray-700 font-semibold mb-2">
                  Batch Placements Record:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {BATCH_YEARS.map((y) => (
                    <div key={y}>
                      <span className="text-[11px] font-medium text-gray-500 block mb-0.5">
                        Batch {y}
                      </span>
                      <input
                        type="text"
                        value={formData.batch_data?.[y] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            batch_data: {
                              ...formData.batch_data,
                              [y]: e.target.value,
                            },
                          })
                        }
                        className="w-full p-1.5 border rounded focus:ring-2 focus:ring-blue-500 text-center"
                        placeholder="0 or In Process"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="current_batch_cb"
                  checked={formData.is_current_batch}
                  onChange={(e) =>
                    setFormData({ ...formData, is_current_batch: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="current_batch_cb" className="text-gray-800 font-semibold cursor-pointer">
                  Current Active (Visiting 2027 Batch)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 px-3.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 active:bg-gray-100 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs rounded-lg shadow-sm transition-colors"
                >
                  {editingIndex !== null ? "Update Company" : "Save Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
