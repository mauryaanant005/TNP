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
import { Chip } from "@mui/material";
import { sampleBranchWiseData } from "./fallbackData";
import { useBatchOptions, useRealOrSampleData } from "./hooks";
import { ErrorBanner, NO_DATA_MESSAGE } from "./ErrorBanner";

export interface BranchReportData {
  company_headers: CompanyHeader[];
  progress_fields: string[];
  report_data: Record<string, any>[];
}

interface CompanyHeader {
  id: number;
  name: string;
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

function hasBranchWiseData(json: BranchReportData): boolean {
  return Boolean(json.report_data && json.report_data.length > 0);
}

export function BranchWiseReport() {
  const { batches, selectedBatch, setSelectedBatch } = useBatchOptions();
  const { data: apiData, isSampleData, loading, error, retry } =
    useRealOrSampleData<BranchReportData>({
      url: selectedBatch
        ? `/api/placement_officer/branch_wise_report/${selectedBatch}/`
        : null,
      sampleData: sampleBranchWiseData as unknown as BranchReportData,
      hasData: hasBranchWiseData,
      deps: [],
    });

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
            <CardTitle className="flex items-center gap-4">
              Branch-wise Progress Report
              {isSampleData && (
                <Chip label="Viewing Sample Data" color="warning" size="small" variant="outlined" />
              )}
            </CardTitle>
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

      <CardContent className="space-y-4">
        {error && <ErrorBanner message={error} onRetry={retry} />}
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
                    {NO_DATA_MESSAGE}
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