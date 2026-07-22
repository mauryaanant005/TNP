import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "react-hot-toast";
import Papa from "papaparse";
import InternshipBadgeIcon from "@/assets/icons/InternshipBadgeIcon";
import { getCookie } from "@/utils";

interface PreviewData {
  uid: string;
  year: string;
  type: string;
  stipend: string;
  is_verified: string;
  domain_name: string;
  total_hours: string;
  start_date: string;
  end_date: string;
}

const UploadInhouseInternship = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "text/csv") {
        if (selectedFile.size > 1024 * 1024) { // 1MB limit
          toast.error("File size exceeds 1MB limit");
          return;
        }
        setFile(selectedFile);
        setShowPreview(false);
        setWarnings([]);
      } else {
        toast.error("Please select a valid CSV file");
      }
    }
  };

  const validateData = (data: PreviewData[]) => {
    const newWarnings: string[] = [];
    
    data.forEach((row, index) => {
      // Check dates
      const startDate = new Date(row.start_date);
      const endDate = new Date(row.end_date);
      const month = startDate.getMonth() + 1; // JavaScript months are 0-based
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        newWarnings.push(`Row ${index + 2}: Invalid date format`);
      }
      
      if (endDate < startDate) {
        newWarnings.push(`Row ${index + 2}: End date is before start date`);
      }

      // Check internship type and month
      if (row.type.toLowerCase() === 'full-time' && ![12, 5].includes(month)) {
        newWarnings.push(`Row ${index + 2}: Full-time internships only allowed in December and May`);
      }

      // Check total hours
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const maxHours = days * 8;
      if (parseInt(row.total_hours) > maxHours) {
        newWarnings.push(`Row ${index + 2}: Total hours exceed maximum allowed hours (${maxHours})`);
      }

      // Check numeric values
      if (isNaN(parseFloat(row.stipend))) {
        newWarnings.push(`Row ${index + 2}: Invalid stipend value`);
      }
      if (isNaN(parseInt(row.total_hours))) {
        newWarnings.push(`Row ${index + 2}: Invalid total hours value`);
      }

      // Check boolean value
      if (!['true', 'false'].includes(row.is_verified.toLowerCase())) {
        newWarnings.push(`Row ${index + 2}: is_verified must be true or false`);
      }
    });

    setWarnings(newWarnings);
    return newWarnings.length === 0;
  };

  const handleCheckAndPreview = () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }
    console.log("File object:", file);

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = results.data as PreviewData[];
        console.log("Parsed data before filtering:", data); // Log parsed data

        // Filter out empty rows based on uid
        const filteredData = data.filter(row => row.uid && row.uid.trim() !== '');

        // Validate columns on filtered data (assuming at least one valid row exists)
        if (filteredData.length === 0) {
          toast.error("No valid data rows found in the CSV.");
          setPreviewData([]);
          setShowPreview(false);
          return;
        }

        if (validateData(filteredData)) {
          toast.success("Data validation successful!");
        } else {
          toast.error("Data validation completed with warnings");
        }
        
        setPreviewData(filteredData.slice(0, 5));
        setShowPreview(true);
      },
      error: (error) => {
        console.error("PapaParse Error:", error);
        toast.error(`Error parsing CSV: ${error.message}`);
      },
    });
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/department_coordinator/upload-inhouse-internship/", {
        method: "POST",
        body: formData,
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || "File uploaded successfully");
        setFile(null);
        setPreviewData([]);
      } else {
        const error = await response.json();
        toast.error(error.message || "Error uploading file");
      }
    } catch (error: Error | unknown) {
      toast.error(error instanceof Error ? error.message : "Error uploading file");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "uid",
      "year",
      "type",
      "stipend",
      "is_verified",
      "domain_name",
      "total_hours",
      "start_date",
      "end_date"
    ].join(",");

    const sample = [
      "STUDENT_UID,FE,inhouse,0,true,Web Development,120,2024-05-01,2024-06-01"
    ].join("\n");

    const blob = new Blob([headers + "\n" + sample], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inhouse_internship_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-8 px-2">
      <Card className="w-full max-w-2xl shadow-lg rounded-2xl">
        <CardHeader className="flex flex-col items-center gap-2">
          <InternshipBadgeIcon size={40} color="#153F74" />
          <CardTitle className="text-2xl text-[#153F74] font-bold text-center mt-2">
            Upload Inhouse Internship Data
          </CardTitle>
          <p className="text-gray-500 text-center text-sm max-w-md">
            Upload a CSV file with inhouse internship data. You can download a template and preview your data before uploading.
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-[#153F74] mb-2">Important Notes:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
              <li>File must be in CSV format</li>
              <li>Maximum file size: 1MB</li>
              <li>Required columns:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>uid: Student's unique ID</li>
                  <li>year: Academic year (e.g., FE, SE, TE, BE)</li>
                  <li>type: Internship type (Full-time/Part-time)</li>
                  <li>stipend: Numeric value</li>
                  <li>is_verified: Boolean (true/false)</li>
                  <li>domain_name: Internship domain</li>
                  <li>total_hours: Numeric value</li>
                  <li>start_date: YYYY-MM-DD format</li>
                  <li>end_date: YYYY-MM-DD format</li>
                </ul>
              </li>
              <li>Data validation rules:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Full-time internships only allowed in December and May</li>
                  <li>Part-time internships allowed in other months</li>
                  <li>Daily hours should not exceed 8 hours</li>
                  <li>Dates must be valid and in correct format</li>
                  <li>Student must belong to your department</li>
                </ul>
              </li>
              <li>All students in the file must exist in the system</li>
              <li>You can only upload data for students in your department</li>
            </ul>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="max-w-xs"
            />
            <Button onClick={downloadTemplate} className="bg-blue-600 text-white hover:bg-blue-700">
              Download Template
            </Button>
          </div>
          
          {file && (
            <div className="flex justify-center gap-4 mb-4">
              <Button
                onClick={handleCheckAndPreview}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Check and Preview
              </Button>
            </div>
          )}

          {showPreview && previewData.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2 text-[#153F74]">Preview (First 5 rows)</h3>
              {warnings.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Warnings Found</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <ul className="list-disc list-inside">
                          {warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(previewData[0]).map((header) => (
                        <TableHead key={header} className="bg-blue-50 text-[#153F74] text-xs font-bold uppercase">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, index) => (
                      <TableRow key={index} className="hover:bg-blue-50">
                        {Object.values(row).map((cell, cellIndex) => (
                          <TableCell key={cellIndex} className="text-xs">
                            {cell}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <div className="flex justify-center mt-6">
            <Button
              onClick={handleUpload}
              disabled={!file || loading || warnings.length > 0}
              className="bg-[#153F74] text-white hover:bg-blue-800 px-8 py-2 rounded-lg text-base font-semibold"
            >
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadInhouseInternship; 