"use client";

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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Papa from "papaparse";

interface CompanyHeader {
  id: number;
  name: string;
}

interface ApiData {
  company_headers: CompanyHeader[];
  progress_fields: string[];
  report_data: Record<string, any>[];
}

function formatHeader(field: string): string {
  if (field === "gd") return "GD";
  if (field === "final") return "Final";
  return field
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function TableSkeletonLoader({ columns }: { columns: number }) {
  return (
    <>
      {[...Array(5)].map((_, i) => (
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

export function BranchWiseReport() {
  const [apiData, setApiData] = React.useState<ApiData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = React.useState<string>("");
  const [batches, setBatches] = React.useState<string[]>([]);

  React.useEffect(() => {
    fetch("/api/staff/companies/batches/")
      .then((res) => res.json())
      .then((data) => setBatches(data))
      .catch((err) => console.error("Error fetching batches:", err));
  }, []);

  React.useEffect(() => {
    async function fetchData(fetchBatch: string) {
      if (!fetchBatch) return;
      setLoading(true);
      setError(null);
      setApiData(null);

      try {
        const response = await fetch(
          `/api/placement_officer/branch_wise_report/${selectedBatch}/`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch report: ${response.statusText}`);
        }
        const data: ApiData = await response.json();
        setApiData(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchData(selectedBatch);
  }, [selectedBatch]);

  const columns = React.useMemo<ColumnDef<Record<string, any>>[]>(() => {
    if (!apiData) return [];

    const staticColumn: ColumnDef<Record<string, any>> = {
      id: "department",
      accessorKey: "department",
      header: "Branch / Div",
      size: 150,
    };

    const companyColumns = apiData.company_headers.map((company) => {
      const progressColumns = apiData.progress_fields.map((field) => {
        const accessorKey = `company_${company.id}_${field}`;
        return {
          id: accessorKey,
          accessorKey: accessorKey,
          header: () => (
            <div className="w-20 text-center">{formatHeader(field)}</div>
          ),
          cell: ({ getValue }) => (
            <div className="text-center">{String(getValue() ?? 0)}</div>
          ),
        } as ColumnDef<Record<string, any>>;
      });

      return {
        id: `company-${company.id}`,
        header: company.name,
        columns: progressColumns,
      };
    });

    return [staticColumn, ...companyColumns];
  }, [apiData]);

  const table = useReactTable({
    data: apiData?.report_data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleExportCSV = () => {
    if (!apiData) return;
    const { company_headers, progress_fields, report_data } = apiData;
    const headerRow1: string[] = ["Branch / Div"];
    company_headers.forEach((company) => {
      headerRow1.push(company.name);
      for (let i = 0; i < progress_fields.length - 1; i++) {
        headerRow1.push("");
      }
    });

    const formattedFields = progress_fields.map(formatHeader);
    const headerRow2: string[] = [""];
    company_headers.forEach(() => {
      headerRow2.push(...formattedFields);
    });
    const dataRows = report_data.map((row) => {
      const csvRow: (string | number)[] = [row.department];

      company_headers.forEach((company) => {
        progress_fields.forEach((field) => {
          const key = `company_${company.id}_${field}`;
          csvRow.push(row[key] ?? 0);
        });
      });
      return csvRow;
    });

    const csvData = [headerRow1, headerRow2, ...dataRows];
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `branch_report_${selectedBatch}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="m-4">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>Branch-wise Progress Report</CardTitle>
            <CardDescription>
              {selectedBatch
                ? `Showing results for Batch: ${selectedBatch}`
                : "Select a batch to view report"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
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

            <Button
              disabled={!apiData?.company_headers.length}
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
                    No data found for this batch
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}