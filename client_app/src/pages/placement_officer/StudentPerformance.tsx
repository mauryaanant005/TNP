/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Papa from "papaparse";
import { DEPARTMENTS_TO_DISPLAY } from "@/constant";
interface CompanyHeader {
  id: number;
  name: string;
}

interface StudentData {
  uid: string;
  student_name: string;
  department: string;
  [key: string]: any;
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  company_headers: CompanyHeader[];
  progress_fields: string[];
  student_data: StudentData[];
}

function formatHeader(field: string): string {
  if (field === "gd") return "GD";
  return field
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function TableSkeletonLoader({ columns }: { columns: number }) {
  return (
    <>
      {[...Array(10)].map((_, i) => (
        <TableRow key={`skel-row-${i}`}>
          {[...Array(columns)].map((_, j) => (
            <TableCell key={`skel-cell-${i}-${j}`}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function StudentStatusReport() {
  const [apiResponse, setApiResponse] = React.useState<ApiResponse | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [department, setDepartment] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selectedBatch, setSelectedBatch] = React.useState<string>("");
  const [batches, setBatches] = React.useState<string[]>([]);
  React.useEffect(() => {
    fetch("/api/staff/companies/batches/")
      .then((res) => res.json())
      .then((data) => setBatches(data))
      .catch((err) => console.error("Error fetching batches:", err));
  }, []);
  React.useEffect(() => {
    async function fetchData() {
      if (!selectedBatch) return;

      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append("page", String(page));
      if (department) {
        params.append("department", department);
      }
      const url = `/api/placement_officer/student_detail_report/${selectedBatch}/?${params.toString()}/`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch report: ${response.statusText}`);
        }
        const data: ApiResponse = await response.json();
        setApiResponse(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "An unknown error occurred");
        setApiResponse(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedBatch, department, page]);
  const columns = React.useMemo<ColumnDef<StudentData>[]>(() => {
    if (!apiResponse) return [];

    const staticColumns: ColumnDef<StudentData>[] = [
      {
        id: "uid",
        accessorKey: "uid",
        header: "UID",
        size: 200,
      },
      {
        id: "student_name",
        accessorKey: "student_name",
        header: "Student Name",
        size: 200,
      },
      {
        id: "department",
        accessorKey: "department",
        header: "Dept",
        size: 70,
      },
      {
        id: "cgpa",
        accessorKey: "cgpa",
        header: "CGPA",
        size: 60,
        cell: ({ getValue }) =>
          getValue() ? (getValue() as number).toFixed(2) : "N/A",
      },
      {
        id: "is_kt",
        accessorKey: "is_kt",
        header: "KT",
        size: 50,
        cell: ({ getValue }) => (getValue() ? "Yes" : "No"),
      },
      {
        id: "all_offers_list",
        accessorKey: "all_offers_list",
        header: "Placed In (All)",
        size: 200,
        cell: ({ getValue }) => {
          const offers = getValue() as string[];
          if (!offers || offers.length === 0) {
            return null;
          }
          return offers.join(", ");
        },
      },
    ];

    const companyColumns = apiResponse.company_headers.map((company) => {
      const progressColumns = apiResponse.progress_fields.map((field) => {
        const accessorKey = `company_${company.id}_${field}`;
        return {
          id: accessorKey,
          accessorKey: accessorKey,
          header: () => (
            <div className="w-20 text-center">{formatHeader(field)}</div>
          ),
          cell: ({ getValue }) => (
            <div className="text-center">{getValue() ? "✅" : ""}</div>
          ),
        } as ColumnDef<StudentData>;
      });
      return {
        id: `company-${company.id}`,
        header: company.name,
        columns: progressColumns,
      };
    });

    return [...staticColumns, ...companyColumns];
  }, [apiResponse]);
  const table = useReactTable({
    data: apiResponse?.student_data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleNextPage = () => {
    if (apiResponse?.next) {
      setPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (apiResponse?.previous) {
      setPage((prev) => prev - 1);
    }
  };
  const handleExportCSV = () => {
    if (!apiResponse || !apiResponse.student_data.length) {
      alert("No data to export!");
      return;
    }
    const staticHeaders = [
      "UID",
      "Student Name",
      "Department",
      "CGPA",
      "KT",
      "Placed In",
    ];
    const topHeader: string[] = [...staticHeaders];
    const subHeader: string[] = [...Array(staticHeaders.length).fill("")];

    apiResponse.company_headers.forEach((company) => {
      apiResponse.progress_fields.forEach((field, idx) => {
        if (idx === 0) topHeader.push(company.name);
        else topHeader.push("");
        subHeader.push(formatHeader(field));
      });
    });

    const dataRows = apiResponse.student_data.map((student) => {
      const row = [
        student.uid,
        student.student_name,
        student.department,
        student.cgpa ?? "N/A",
        student.is_kt ? "Yes" : "No",
        student.placed_in ?? "N/A",
      ];

      apiResponse.company_headers.forEach((company) => {
        apiResponse.progress_fields.forEach((field) => {
          const key = `company_${company.id}_${field}`;
          row.push(student[key] ? "1" : "NA");
        });
      });

      return row;
    });
    const csvData = [topHeader, subHeader, ...dataRows];

    const csv = Papa.unparse(csvData);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `student_report_${selectedBatch}_${
      department || "ALL"
    }.csv`;
    link.click();
  };
  console.log("Rendered with data:", apiResponse);
  return (
    <Card className="m-4">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>Student-wise Progress Report</CardTitle>
            <CardDescription>
              Showing results for Batch: <strong>{selectedBatch}</strong>
              {department && (
                <>
                  , Department: <strong>{department}</strong>
                </>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="w-40 text-black bg-gray-100">
                <SelectValue placeholder="Select Batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch} value={batch}>
                    {batch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-40 text-black bg-gray-100">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS_TO_DISPLAY.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              disabled={!apiResponse?.company_headers.length}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className="text-center"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeletonLoader
                  columns={table.getAllLeafColumns().length}
                />
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-destructive"
                  >
                    Error: {error}
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No data found for these filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between py-4">
          <span className="text-sm text-muted-foreground">
            {apiResponse?.count ? `Total ${apiResponse.count} students` : ""}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrevPage}
              disabled={!apiResponse?.previous || loading}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNextPage}
              disabled={!apiResponse?.next || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
