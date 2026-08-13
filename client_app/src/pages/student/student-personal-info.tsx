/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function StudentDashboard() {
  interface Student {
    uid: string;
    department: string;
    batch: string;
    academic_year: string;
    gender: string;
    dob: string;
    contact: string;
    personal_email: string;
    cgpa?: number;
    attendance?: number;
    card: string;
    current_category: string;
    consent: string;
    is_dse_student: boolean;
    is_kt: boolean;
    is_blacklisted: boolean;
    academic_performance: { semester: string; performance: string | number }[];
    academic_attendance: { semester: string; attendance: number }[];
  }

  const [student, setStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDummy, setIsDummy] = useState<boolean>(false);

  useEffect(() => {
    api
      .get("/api/student/info", { withCredentials: true })
      .then((res) => {
        setStudent(res.data);
        setIsDummy(false);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          const DUMMY_STUDENT: Student = {
            uid: "DUMMY-2026-001",
            department: "Computer Engineering",
            batch: "2026",
            academic_year: "TE",
            gender: "Male",
            dob: "2004-01-01",
            contact: "9876543210",
            personal_email: "dummy.student@example.com",
            cgpa: 8.5,
            attendance: 85,
            card: "Green",
            current_category: "Open",
            consent: "Yes",
            is_dse_student: false,
            is_kt: false,
            is_blacklisted: false,
            academic_performance: [
              { semester: "Sem 1", performance: 8.2 },
              { semester: "Sem 2", performance: 8.4 },
              { semester: "Sem 3", performance: 8.6 },
              { semester: "Sem 4", performance: 8.8 },
            ],
            academic_attendance: [
              { semester: "Sem 1", attendance: 80 },
              { semester: "Sem 2", attendance: 82 },
              { semester: "Sem 3", attendance: 88 },
              { semester: "Sem 4", attendance: 90 },
            ],
          };
          setStudent(DUMMY_STUDENT);
          setIsDummy(true);
        } else {
          setError("Failed to load dashboard. Please try again later.");
        }
        console.error(err);
      });
  }, []);

  if (error) return <p className="p-6 text-red-500">{error}</p>;
  if (!student) return <p className="p-6">Loading your dashboard...</p>;

  return (
    <div className="p-8 space-y-6">
      {isDummy && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-sm" role="alert">
          <p className="font-bold">Displaying Sample Data</p>
          <p>Your actual student profile has not been created yet. Showing fallback content for demonstration.</p>
        </div>
      )}

      {/* Profile Info */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p>
            <strong>UID:</strong> {student.uid}
          </p>
          <p>
            <strong>Department:</strong> {student.department}
          </p>
          <p>
            <strong>Batch:</strong> {student.batch}
          </p>
          <p>
            <strong>Academic Year:</strong> {student.academic_year}
          </p>
          <p>
            <strong>Gender:</strong> {student.gender}
          </p>
          <p>
            <strong>DOB:</strong> {student.dob}
          </p>
          <p>
            <strong>Email:</strong> {student.personal_email}
          </p>
          <p>
            <strong>CGPA:</strong> {student.cgpa?.toFixed(2) ?? "N/A"}
          </p>
          <p>
            <strong>Attendance:</strong> {student.attendance ?? "N/A"}%
          </p>
          <p>
            <strong>Card Type:</strong> {student.card}
          </p>
          <p>
            <strong>Category:</strong> {student.current_category}
          </p>
          <p>
            <strong>Consent:</strong> {student.consent}
          </p>
          <p>
            <strong>DSE Student:</strong>{" "}
            {student.is_dse_student ? "Yes" : "No"}
          </p>
          <p>
            <strong>KT:</strong> {student.is_kt ? "Yes" : "No"}
          </p>
          <p>
            <strong>Blacklisted:</strong>{" "}
            {student.is_blacklisted ? "Yes" : "No"}
          </p>
        </CardContent>
      </Card>

      <Separator className="my-4" />

      {/* Academic Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc ml-6">
            {student.academic_performance.map((item) => (
              <li key={item.semester}>
                {item.semester}: {item.performance}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc ml-6">
            {student.academic_attendance.map((item) => (
              <li key={item.semester}>
                {item.semester}: {item.attendance}%
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

    </div>
  );
}
