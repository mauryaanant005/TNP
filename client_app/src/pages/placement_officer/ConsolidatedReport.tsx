import { useEffect, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { DEPARTMENTS_TO_DISPLAY } from "@/constant";
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

type ReportData = {
  id: number;
  role: string;
  salary: string;
  form__name: string;
  form__notice__date: string;
  employee_type?: string;
  [key: string]: any;
};

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

const columns: ColumnDef<ReportData>[] = [
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
  ...DEPARTMENTS_TO_DISPLAY.map((dept) => {
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

export function ConsolidationReportPage() {
  const [data, setData] = useState<ReportData[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [batches, setBatches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/staff/companies/batches/")
      .then((res) => res.json())
      .then((data) => setBatches(data))
      .catch((err) => console.error("Error fetching batches:", err));
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!selectedBatch) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/placement_officer/get_data_by_year/${selectedBatch}/`
        );
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error("Failed to fetch report data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedBatch]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleExportCSV = () => {
    if (!data.length) {
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

    DEPARTMENTS_TO_DISPLAY.forEach((dept) => {
      topHeader.push(dept, ""); // two columns per dept
      subHeader.push("Appeared & Register", "Selected");
    });
    const dataRows = data.map((item, index) => {
      const row = [
        index + 1,
        item.form__notice__date
          ? new Date(item.form__notice__date).toLocaleDateString("en-IN")
          : "N/A",
        `${item.form__name} (${item.role})`,
        item.employee_type || "N/A",
        item.salary || "N/A",
      ];

      DEPARTMENTS_TO_DISPLAY.forEach((dept) => {
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
            <CardTitle>Consolidation Report</CardTitle>
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

            <Button disabled={!data.length} onClick={handleExportCSV}>
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
                    No data found
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
