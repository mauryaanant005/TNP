import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  Table as ReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./data-table-pagination";
import { Loader2 } from "lucide-react";
import { Input } from "./ui/input";
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  // Add all the other props from useReactTable
  [key: string]: any;
}
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "./ui/select";
export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  ...props
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
    ...props,
  });
  const [selectedColumn, setSelectedColumn] = useState<string>("uid");
  return (
    <div>
      <div className="rounded-md border">
        <div className="flex items-center p-4 gap-4">
          <Select value={selectedColumn} onValueChange={setSelectedColumn}>
            <SelectTrigger className="w-[180px] text-black bg-black/10 mb-2">
              <SelectValue placeholder="Select Column" />
            </SelectTrigger>
            <SelectContent>
              {table
                .getAllLeafColumns()
                .filter((col) => col.getCanFilter?.() ?? true)
                .map((col) => (
                  <SelectItem key={col.id} value={col.id as string}>
                    {String(col.columnDef.header)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Input
            placeholder={`Filter ${selectedColumn}...`}
            value={(table.getColumn(selectedColumn)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(selectedColumn)?.setFilterValue(event.target.value)
            }
            className="w-[260px] text-black mb-2"
          />
        </div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex justify-center items-center">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Loading data...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table as ReactTable<TData>} />
    </div>
  );
}
