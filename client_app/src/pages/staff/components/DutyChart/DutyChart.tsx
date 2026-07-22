// types.ts
interface FormData {
  srNo: string;
  to: string;
  subject: string;
  date: string;
  Intro: string;
  Note: string;
  From: string;
  From_designation: string;
}

interface TableRow {
  srNo: string;
  name: string;
  designation: string;
  department: string;
  reportingTime: string;
  roles: string;
  signature: string;
}

// DutyChart.tsx
import React, { useState, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@mui/material";
import { DutyChartPreview } from "./DutyChartPreview";

const DutyChart = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const reactPrintFn = useReactToPrint({ contentRef });
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    srNo: "",
    to: "",
    subject: "",
    date: new Date().toISOString().split("T")[0],
    Intro: "",
    Note: "",
    From: "",
    From_designation: "",
  });

  const [tableData, setTableData] = useState<TableRow[]>([
    {
      srNo: "",
      name: "",
      designation: "",
      department: "",
      reportingTime: "",
      roles: "",
      signature: "",
    },
  ]);

  useEffect(() => {
    fetch("/api/get-duty-chart")
      .then((response) => response.json())
      .then((data) => setTableData(data.tableData || tableData))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTableChange = (
    index: number,
    field: keyof TableRow,
    value: string
  ) => {
    setTableData((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => {
    setTableData((prev) => [
      ...prev,
      {
        srNo: "",
        name: "",
        designation: "",
        department: "",
        reportingTime: "",
        roles: "",
        signature: "",
      },
    ]);
  };

  const removeRow = (index: number) => {
    setTableData((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white text-black shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-6">
        NOTICE DETAILS : DUTY CHART
      </h2>

      <form className="grid grid-cols-2 gap-10 mb-6">
        {Object.entries(formData).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <label className="block font-semibold">
              {key.replace(/_/g, " ").toUpperCase()}
            </label>
            <input
              type={key === "date" ? "date" : "text"}
              name={key}
              value={value}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
        ))}
      </form>

      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border">
          <thead>
            <tr className="text-[14px] text-black">
              {Object.keys(tableData[0]).map((header) => (
                <th key={header} className="border p-2 bg-gray-50">
                  {header.replace(/_/g, " ").toUpperCase()}
                </th>
              ))}
              <th className="border p-2 bg-gray-50 text-black">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index}>
                {Object.entries(row).map(([field, value]) => (
                  <td key={field} className="border p-2">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        handleTableChange(
                          index,
                          field as keyof TableRow,
                          e.target.value
                        )
                      }
                      className="w-[90%] p-1 border rounded"
                    />
                  </td>
                ))}
                <td className="border p-2">
                  <button
                    onClick={() => removeRow(index)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between mb-6">
        <Button variant="contained" color="primary" onClick={addRow}>
          Add Row
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowPreview(true)}
        >
          Preview Notice
        </Button>
      </div>

      {showPreview && (
        <div className="mt-6">
          <DutyChartPreview
            formData={formData}
            tableData={tableData}
            ref={contentRef}
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => reactPrintFn()}
            className="mt-4"
          >
            Print Notice
          </Button>
        </div>
      )}
    </div>
  );
};

export default DutyChart;
