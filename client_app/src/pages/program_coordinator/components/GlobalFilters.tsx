/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const SEMESTER_OPTIONS = [
  "SEMESTER 1",
  "SEMESTER 2",
  "SEMESTER 3",
  "SEMESTER 4",
  "SEMESTER 5",
  "SEMESTER 6",
  "SEMESTER 7",
  "SEMESTER 8",
];

export default function GlobalFilters({ filters, setFilters }: { filters: any; setFilters: (arg:any)=>void }) {
  const handleFilterChange = (name:string, value:string) => {
    setFilters((prev:any) => ({ ...prev, [name]: value }));
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Dashboard Filters</CardTitle>
        <CardDescription>
          Filter and group student analytics data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Filters */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Student Filters
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="batch">Batch</Label>
                <Input
                  id="batch"
                  placeholder="e.g., A"
                  value={filters.batch}
                  onChange={(e) => handleFilterChange("batch", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="e.g., BTech-CS"
                  value={filters.department}
                  onChange={(e) =>
                    handleFilterChange("department", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={filters.semester}
                  // 2. Update the handler to convert "all" back to "" for your state
                  onValueChange={(value) => {
                    handleFilterChange(
                      "semester",
                      value === "all" ? "" : value
                    );
                  }}
                >
                  <SelectTrigger id="semester">
                    <SelectValue placeholder="All Semesters" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* 1. Use a non-empty string for the value prop */}
                    <SelectItem value="all">All Semesters</SelectItem>
                    {SEMESTER_OPTIONS.map((sem) => (
                      <SelectItem key={sem} value={sem}>
                        {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Group By Filter */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Group Summary By
            </h3>
            <div className="flex gap-2">
              {["batch", "department", "semester"].map((option) => (
                <button
                  key={option}
                  onClick={() => handleFilterChange("groupBy", option)}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                    filters.groupBy === option
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
