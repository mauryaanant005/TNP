import React, { useState } from "react";
import { FileUploadCard } from "./components/FileUploadCard";
import { GraduationCap, UserCheck } from "lucide-react";
import { getCookie } from "@/utils";
import toast from "react-hot-toast";

export default function DepartmentAttendance() {
  const [attendanceFile, setAttendanceFile] = useState<File | null>(null);
  const [marksFile, setMarksFile] = useState<File | null>(null);

  const handleAttendanceSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const formData = new FormData();
    if (attendanceFile) {
      formData.append("file_attendance", attendanceFile);
      const res = await fetch(
        "/api/department_coordinator/attendance/upload-attendance/",
        {
          method: "POST",
          body: formData,
          headers: {
            "X-CSRFToken": getCookie("csrftoken") || "",
          },
          credentials: "include",
        }
      );
      if (res.ok) {
        toast.success("Attendance file submitted successfully");
      } else {
        toast.error("Error submitting attendance file");
      }
    }
  };

  const handleMarksSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    if (marksFile) {
      formData.append("file_performance", marksFile);
      const res = await fetch(
        "/api/department_coordinator/attendance/upload-performance/",
        {
          method: "POST",
          body: formData,
          headers: {
            "X-CSRFToken": getCookie("csrftoken") || "",
          },
          credentials: "include",
        }
      );
      if (res.ok) {
        toast.success("Attendance file submitted successfully");
      } else {
        toast.error("Error submitting attendance file");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Academic Data Management
          </h1>
          <p className="text-blue-200 max-w-2xl mx-auto">
            Upload and manage your academic records efficiently. Our system
            supports both attendance tracking and academic performance data.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <FileUploadCard
            title="Student Attendance Records"
            description="Upload attendance data for processing. Supports CSV and Excel formats with student details and attendance records."
            onFileChange={setAttendanceFile}
            onSubmit={handleAttendanceSubmit}
            formType="attendance"
          />

          <FileUploadCard
            title="Academic Performance Data"
            description="Import student marks and academic performance data. Ensure the file follows the required format for accurate processing."
            onFileChange={setMarksFile}
            onSubmit={handleMarksSubmit}
            formType="marks"
          />
        </div>

        <footer className="mt-12 text-center text-blue-200 text-sm">
          <div className="flex justify-center space-x-8 mb-4">
            <div className="flex items-center">
              <UserCheck className="w-5 h-5 mr-2 text-orange-400" />
              <span>Attendance Tracking</span>
            </div>
            <div className="flex items-center">
              <GraduationCap className="w-5 h-5 mr-2 text-orange-400" />
              <span>Performance Analytics</span>
            </div>
          </div>
          <p>
            Ensure all data files comply with the institution's format
            requirements
          </p>
        </footer>
      </div>
    </div>
  );
}
