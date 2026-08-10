import { useMemo } from "react";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import Papa from "papaparse";
import { Chip } from "@mui/material";
import { sampleConsolidatedData } from "./fallbackData";
import { useBatchOptions, useDepartmentOptions, useRealOrSampleData } from "./hooks";
import { ErrorBanner, NO_DATA_MESSAGE } from "./ErrorBanner";

export interface ReportData {
  id: number;
  role: string;
  salary: string;
  form__name: string;
  form__notice__date: string;
  employee_type?: string;
  [key: string]: any;
}

const getDeptApiKey = (dept: string) => {
  return dept
    .toLowerCase()
    .replace("&", "")
    .replace(" ", "_")
    .replace("-", "_");
};

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

// Columns are now generated inside the component to use dynamic departments

function hasConsolidatedData(json: ReportData[]): boolean {
  return Array.isArray(json) && json.length > 0;
}

export function ConsolidationReportPage() {
  const { batches, selectedBatch, setSelectedBatch } = useBatchOptions();
  const dynamicDepartments = useDepartmentOptions(selectedBatch);
  const { data, isSampleData, loading, error, retry } =
    useRealOrSampleData<ReportData[]>({
      url: selectedBatch
        ? `/api/placement_officer/get_data_by_year/${selectedBatch}/`
        : null,
      sampleData: sampleConsolidatedData as unknown as ReportData[],
      hasData: hasConsolidatedData,
      deps: [],
    });
  const rows = data ?? [];

  const columns = useMemo<ColumnDef<ReportData>[]>(() => {
    return [
      {
        header: "Sr. No.",
        id: "sr_no",
        cell: ({ row }) => row.index + 1,
      },
      {
        header: "Date of Visit",
        accessorKey: "form__notice__date",
        cell: ({ getValue }) => {
          const dateString = getValue() as string;
          if (!dateString) return "N/A";
          return new Date(dateString).toLocaleDateString("en-IN");
        },
      },
      {
        header: "Name of Employer",
        accessorKey: "form__name",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.form__name}</div>
            <div className="text-xs text-muted-foreground">{row.original.role}</div>
          </div>
        ),
      },
      {
        header: "PLI/AEDP",
        accessorKey: "form__is_aedp_or_pli",
        cell: ({ getValue }) => {
          const val = getValue() as boolean;
          return val ? "AEDP/PLI" : "Regular";
        },
      },
      {
        header: "Employer Type",
        accessorKey: "employee_type",
      },
      {
        header: "Salary Offered",
        accessorKey: "salary",
      },
      ...dynamicDepartments.map((dept) => {
        const appliedKey = `applied_${getDeptApiKey(dept)}`;
        const selectedKey = `selected_${getDeptApiKey(dept)}`;
        return {
          header: dept,
          columns: [
            {
              header: "Appeared & Register",
              accessorKey: appliedKey,
            },
            {
              header: "Selected",
              accessorKey: selectedKey,
            },
          ],
        } as ColumnDef<ReportData>;
      }),
    ];
  }, [dynamicDepartments]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleExportCSV = () => {
    if (!rows.length) {
      alert("No data to export!");
      return;
    }
    const staticHeaders = [
      "Sr. No.",
      "Date of Visit",
      "Name of Employer",
      "Employer Type",
      "Salary Offered",
    ];

    const topHeader: string[] = [...staticHeaders];
    const subHeader: string[] = [...Array(staticHeaders.length).fill("")];

    dynamicDepartments.forEach((dept) => {
      topHeader.push(dept, ""); // two columns per dept
      subHeader.push("Appeared & Register", "Selected");
    });
    const dataRows = rows.map((item, index) => {
      const row = [
        index + 1,
        item.form__notice__date
          ? new Date(item.form__notice__date).toLocaleDateString("en-IN")
          : "N/A",
        `${item.form__name} (${item.role})`,
        item.employee_type || "N/A",
        item.salary || "N/A",
      ];

      dynamicDepartments.forEach((dept) => {
        const appliedKey = `applied_${getDeptApiKey(dept)}`;
        const selectedKey = `selected_${getDeptApiKey(dept)}`;
        row.push(item[appliedKey] ?? "", item[selectedKey] ?? "");
      });

      return row;
    });

    const csvData = [topHeader, subHeader, ...dataRows];
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `consolidation_report_${selectedBatch || "batch"}.csv`;
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
              Consolidated Placement Report
              {isSampleData && (
                <Chip label="Viewing Sample Data" color="warning" size="small" variant="outlined" />
              )}
            </CardTitle>
            <CardDescription>
              {selectedBatch
                ? `Showing results for Batch: ${selectedBatch}`
                : "Select a batch to view report"}
              {selectedBatch === "2026" && (
                <span className="block mt-1 text-amber-700 dark:text-amber-300 font-medium">
                  Note: Batch 2026 contains offer records only (unplaced student roster is unavailable).
                </span>
              )}
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

            <Button disabled={!rows.length} onClick={handleExportCSV}>
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
                  {headerGroup.headers.map((header) => {
                    return (
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
                    );
                  })}
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
