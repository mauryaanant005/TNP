import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";
import { getCookie } from "@/utils";

interface Student {
  uid: string;
  department: string;
  academic_year: string;
  current_category: string;
  is_dse_student: boolean;
  gender: string;
  dob: string;
  contact: string;
  personal_email: string;
  tenth_grade: number;
  higher_secondary_grade: number;
  card: string;
  consent: string;
  batch: string;
  cgpa: number;
  attendance: number;
  is_kt: boolean;
  is_blacklisted: boolean;
  joined_company: boolean;
}

export default function StudentManager() {
  const [uid, setUid] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Fetch student details
  const fetchStudent = async () => {
    if (!uid) {
      toast.error("Please enter UID");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/update/student/${uid}/`);
      const data = await res.json();
      if (res.ok) {
        setStudent(data);
        toast.success("Student data fetched");
      } else {
        toast.error(data.error || "Student not found");
        setStudent(null);
      }
    } catch {
      toast.error("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  // Update student details
  const updateStudent = async () => {
    if (!student) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/staff/update/student/${uid}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken") || "",
        },
        body: JSON.stringify(student),
      });
      const data = await res.json();
      if (res.ok) {
        setStudent(data);
        toast.success("Student updated successfully");
      } else {
        toast.error("Failed to update student");
      }
    } catch {
      toast.error("Error updating data");
    } finally {
      setUpdating(false);
    }
  };

  const handleChange = (field: keyof Student, value: any) => {
    if (!student) return;
    setStudent({ ...student, [field]: value });
  };

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Student Information Manager</CardTitle>
          <CardDescription>
            Fetch and update student data using UID.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* UID Input */}
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Enter UID"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
            />
            <Button onClick={fetchStudent} disabled={loading}>
              {loading ? "Fetching..." : "Fetch"}
            </Button>
          </div>

          {/* Student Form */}
          {student && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <Label>Department</Label>
                <Input
                  value={student.department || ""}
                  onChange={(e) => handleChange("department", e.target.value)}
                />
              </div>

              <div>
                <Label>Academic Year</Label>
                <Input
                  value={student.academic_year || ""}
                  onChange={(e) => handleChange("academic_year", e.target.value)}
                />
              </div>

              <div>
                <Label>CGPA</Label>
                <Input
                  type="number"
                  value={student.cgpa || 0}
                  onChange={(e) =>
                    handleChange("cgpa", parseFloat(e.target.value))
                  }
                />
              </div>

              <div>
                <Label>Attendance</Label>
                <Input
                  type="number"
                  value={student.attendance || 0}
                  onChange={(e) =>
                    handleChange("attendance", parseFloat(e.target.value))
                  }
                />
              </div>

              <div>
                <Label>Contact</Label>
                <Input
                  value={student.contact || ""}
                  onChange={(e) => handleChange("contact", e.target.value)}
                />
              </div>

              <div>
                <Label>Personal Email</Label>
                <Input
                  value={student.personal_email || ""}
                  onChange={(e) =>
                    handleChange("personal_email", e.target.value)
                  }
                />
              </div>

              <div>
                <Label>Consent</Label>
                <Input
                  value={student.consent || ""}
                  onChange={(e) => handleChange("consent", e.target.value)}
                />
              </div>

              <div>
                <Label>Card</Label>
                <Input
                  value={student.card || ""}
                  onChange={(e) => handleChange("card", e.target.value)}
                />
              </div>

              <div>
                <Label>Batch</Label>
                <Input
                  value={student.batch || ""}
                  onChange={(e) => handleChange("batch", e.target.value)}
                />
              </div>

              <div>
                <Label>Gender</Label>
                <Input
                  value={student.gender || ""}
                  onChange={(e) => handleChange("gender", e.target.value)}
                />
              </div>

              {/* ✅ Boolean Toggles */}
              <div className="flex items-center justify-between col-span-2 border-t pt-4 mt-2">
                <Label htmlFor="is_dse_student">DSE Student</Label>
                <Switch
                  id="is_dse_student"
                  checked={student.is_dse_student}
                  onCheckedChange={(checked) =>
                    handleChange("is_dse_student", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between col-span-2">
                <Label htmlFor="is_kt">Has KT</Label>
                <Switch
                  id="is_kt"
                  checked={student.is_kt}
                  onCheckedChange={(checked) =>
                    handleChange("is_kt", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between col-span-2">
                <Label htmlFor="is_blacklisted">Blacklisted</Label>
                <Switch
                  id="is_blacklisted"
                  checked={student.is_blacklisted}
                  onCheckedChange={(checked) =>
                    handleChange("is_blacklisted", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between col-span-2">
                <Label htmlFor="joined_company">Joined Company</Label>
                <Switch
                  id="joined_company"
                  checked={student.joined_company}
                  onCheckedChange={(checked) =>
                    handleChange("joined_company", checked)
                  }
                />
              </div>
            </div>
          )}

          {/* Update Button */}
          {student && (
            <div className="pt-4">
              <Button onClick={updateStudent} disabled={updating}>
                {updating ? "Updating..." : "Update Student"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
