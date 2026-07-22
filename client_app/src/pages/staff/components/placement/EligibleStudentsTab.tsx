import {
  InterestedStudentApplication,
  PaginatedResponse,
} from "../../types/index";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  PaginationState,
  RowSelectionState,
  ColumnDef,
} from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";

const notInterestedStudentColumns: ColumnDef<InterestedStudentApplication>[] = [
  {
    accessorKey: "uid",
    header: "UID",
  },
  {
    header: "Name",
    accessorKey: "full_name",
  },
  {
    accessorKey: "personal_email",
    header: "Email",
  },
  {
    accessorKey: "department",
    header: "Department",
  },
  {
    accessorKey: "cgpa",
    header: "CGPA",
  },
];
const fetchStudents = async (
  companyId: string,
  page: number,
  pageSize: number
): Promise<PaginatedResponse<InterestedStudentApplication>> => {
  const response = await fetch(
    `/api/staff/company/${companyId}/eligible-not-registered/?page=${
      page + 1
    }&page_size=${pageSize}/`
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const data = await response.json();
  return data;
};

const EligibleStudentsTab = ({ companyId }: { companyId: string }) => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "not-registered",
      companyId,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: () =>
      fetchStudents(companyId, pagination.pageIndex, pagination.pageSize),
  });
  const pageCount = data ? Math.ceil(data.count / pagination.pageSize) : 0;
  return (
    <div className="py-6 space-y-4">
      {isError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load student data. Please try again.
          </AlertDescription>
        </Alert>
      )}
      <DataTable
        columns={notInterestedStudentColumns}
        data={data?.results || []}
        isLoading={isLoading}
        manualPagination
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        state={{
          pagination,
          rowSelection,
        }}
      />
    </div>
  );
};

export default EligibleStudentsTab;
