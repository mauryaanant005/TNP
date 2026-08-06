import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Calendar, AlertCircle } from "lucide-react";
import Loader from "./Loader";

interface AttendanceSummary {
  attendance_percentage: number;
  total_sessions: number;
  present_count: number;
  absent_count: number;
  late_count: number;
}

interface PerformanceCategory {
  category_name: string;
  marks: number | string;
}

interface PerformanceItem {
  training_type: string;
  semester: string;
  total_marks: number | string;
  average_marks: number | string;
  categories: PerformanceCategory[];
}

interface Student {
  uid: string;
  name: string;
  batch: string;
  department: string;
  attendance_summary: AttendanceSummary;
  performance_summary: PerformanceItem[];
}

function StudentAnalytics({
  batch,
  department,
  semester,
}: {
  batch: string;
  department: string;
  semester: string;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (batch) params.append("batch", batch);
        if (department) params.append("department", department);
        if (semester) params.append("semester", semester);

        const response = await apiFetch(
          `/api/program_coordinator/student-analytics/?${params}`
        );
        if (!response.ok) throw new Error("Network response was not ok");
        const result = await response.json();
        setStudents(result.results || result);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError("Failed to fetch student data. " + (err.message || ""));
      }
      setLoading(false);
    };

    return () => clearTimeout(timer);
  }, [batch, department, semester]);

  if (loading) return <Loader />;
  if (error)
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Student Drill-Down
        </CardTitle>
        <CardDescription>
          Detailed analytics for individual students
        </CardDescription>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed rounded-lg bg-gray-50 mt-4">
            <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
            <p className="text-gray-500">
              No students match the selected filters or you do not have permission to view students in this department.
            </p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {students.map((student) => (
              <AccordionItem
                key={student.uid}
                value={student.uid}
                className="border rounded-lg"
              >
                <AccordionTrigger className="px-4 hover:no-underline hover:bg-gray-50">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-lg">
                      {student.name}
                    </span>
                    <Badge variant="secondary">UID: {student.uid}</Badge>
                    <Badge variant="outline">Batch: {student.batch}</Badge>
                    <Badge variant="outline">Dept: {student.department}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                    {/* Attendance Summary */}
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Attendance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col items-center space-y-4">
                          <div className="relative inline-flex">
                            <svg className="w-32 h-32">
                              <circle
                                className="text-gray-200"
                                strokeWidth="8"
                                stroke="currentColor"
                                fill="transparent"
                                r="56"
                                cx="64"
                                cy="64"
                              />
                              <circle
                                className="text-blue-600"
                                strokeWidth="8"
                                strokeDasharray={2 * Math.PI * 56}
                                strokeDashoffset={
                                  2 *
                                  Math.PI *
                                  56 *
                                  (1 -
                                    student.attendance_summary
                                      .attendance_percentage /
                                      100)
                                }
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r="56"
                                cx="64"
                                cy="64"
                                transform="rotate(-90 64 64)"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-gray-700">
                              {Math.round(
                                student.attendance_summary.attendance_percentage
                              )}
                              %
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 w-full text-sm">
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <p className="text-gray-500">Sessions</p>
                              <p className="font-semibold text-gray-900">
                                {student.attendance_summary.total_sessions}
                              </p>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded">
                              <p className="text-gray-500">Present</p>
                              <p className="font-semibold text-green-700">
                                {student.attendance_summary.present_count}
                              </p>
                            </div>
                            <div className="text-center p-2 bg-red-50 rounded">
                              <p className="text-gray-500">Absent</p>
                              <p className="font-semibold text-red-700">
                                {student.attendance_summary.absent_count}
                              </p>
                            </div>
                            <div className="text-center p-2 bg-yellow-50 rounded">
                              <p className="text-gray-500">Late</p>
                              <p className="font-semibold text-yellow-700">
                                {student.attendance_summary.late_count}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Performance Summary */}
                    <Card className="border-2 lg:col-span-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {!student.performance_summary || student.performance_summary.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">
                            No performance data found.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {(student.performance_summary || []).map((perf, index) => (
                              <div
                                key={index}
                                className="border rounded-lg p-4 bg-gradient-to-r from-gray-50 to-white"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-semibold text-gray-900">
                                    {perf.training_type}
                                  </h4>
                                  <Badge className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {perf.semester}
                                  </Badge>
                                </div>
                                <div className="flex gap-4 text-sm text-gray-600 mb-3">
                                  <span>
                                    Total:{" "}
                                    <strong className="text-gray-900">
                                      {perf.total_marks}
                                    </strong>
                                  </span>
                                  <span>
                                    Average:{" "}
                                    <strong className="text-gray-900">
                                      {perf.average_marks}
                                    </strong>
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {(perf.categories || []).map((cat, i) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {cat.category_name}: {cat.marks}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

export default StudentAnalytics;
