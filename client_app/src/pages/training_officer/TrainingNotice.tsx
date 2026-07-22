/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState } from "react";
import "../DutyChart.css";
import Notice from "./components/notice";
import { Button } from "@mui/material";
import { useReactToPrint } from "react-to-print";
const TrainingNotice = () => {
  const [formData, setFormData] = useState({
    srNo: "",
    to: "",
    subject: "",
    date: new Date().toISOString().split("T")[0],
    Intro: "",
    Note: "",
    From: "",
    From_designation: "",
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const reactPrintFn = useReactToPrint({ contentRef });
  const [showPreview, setShowPreview] = useState(false);
  const [tableData, setTableData] = useState([
    {
      BatchNo: "",
      Date: "",
      Time: "",
      Program: "",
      TopicsToRevise: "",
    },
  ]);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const addRow = () => {
    setTableData([
      ...tableData,
      {
        BatchNo: "",
        Date: "",
        Time: "",
        Program: "",
        TopicsToRevise: "",
      },
    ]);
  };

  const handleTableChange = (index: number, field: string, value: string) => {
    const updatedTableData = [...tableData];
    // @ts-expect-error: Object is possibly 'null'.
    updatedTableData[index][field] = value;
    setTableData(updatedTableData);
  };

  const removeRow = (index: any) => {
    const updatedTableData = tableData.filter((_, i) => i !== index);
    setTableData(updatedTableData);
  };

  const printContent = () => {
    reactPrintFn();
  };

  return (
    <div className="duty-chart-container">
      <h2 className="duty-chart-title">NOTICE DETAILS : Training</h2>
      <form className="form-grid">
        {Object.entries(formData).map(([key, value]) => (
          <div key={key} className="form-group">
            <label htmlFor={key} className="form-label text-black">
              {key.replace(/_/g, " ").toUpperCase()}
            </label>
            <input
              id={key}
              type={key === "date" ? "date" : "text"}
              name={key}
              value={value}
              onChange={handleInputChange}
              placeholder={key.replace(/_/g, " ").toUpperCase()}
              className="form-input"
            />
          </div>
        ))}
      </form>

      <div className="table-container">
        <h3 className="text-black">Table Data</h3>
        <table className="duty-table">
          <thead>
            <tr className="text-black">
              <th>Batch No</th>
              <th>Date</th>
              <th>Time</th>
              <th>Program</th>
              <th>Topics to Revise</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index}>
                {Object.keys(row).map((field) => (
                  <td key={field}>
                    <input
                      type="text"
                      style={{ marginRight: 10 }}
                      //   @ts-expect-error: Object is possibly 'null'.
                      value={row[field]}
                      onChange={(e) =>
                        handleTableChange(index, field, e.target.value)
                      }
                    />
                  </td>
                ))}
                <td>
                  <button
                    className="button remove-button"
                    onClick={() => removeRow(index)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="button-container">
        <button className="button" onClick={addRow}>
          Add Row
        </button>
        <button className="button" onClick={() => setShowPreview(true)}>
          View Preview
        </button>
      </div>
      {showPreview && (
        <div>
          <Notice formData={{ ...formData, tableData }} ref={contentRef} />
          <Button
            variant="contained"
            color="primary"
            fullWidth={true}
            style={{ marginTop: "20px" }}
            onClick={printContent}
          >
            Print Notice
          </Button>
        </div>
      )}
    </div>
  );
};

export default TrainingNotice;
