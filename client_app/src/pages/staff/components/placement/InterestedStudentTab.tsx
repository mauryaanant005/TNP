/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { XCircle } from "lucide-react";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  PaginationState,
  RowSelectionState,
} from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { interestedStudentColumns } from "./interested-student-column";
import { BulkUpdateDialog } from "./BulkUpdateDialog";
import { ExportManager } from "./ExportManager";
import {
  InterestedStudentApplication,
  PaginatedResponse,
} from "../../types/index";

const fetchStudents = async (
  companyId: string,
  page: number,
  pageSize: number
): Promise<PaginatedResponse<InterestedStudentApplication>> => {
  const response = await fetch(
    `/api/staff/company/${companyId}/interested-students/?page=${page + 1}&page_size=${pageSize}`
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const data = await response.json();
  return data;
};

function InterestedStudentsTabContent({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient(); // Get client from context
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "interestedStudents",
      companyId,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: () =>
      fetchStudents(companyId, pagination.pageIndex, pagination.pageSize),
  });
  const selectedApplicationIds = Object.keys(rowSelection)
    .map((index) => data?.results[Number(index)]?.application_id)
    .filter((id): id is string => Boolean(id));

  const pageCount = data
    ? Math.ceil(data.count / pagination.pageSize)
    : 0;

  return (
    <div className="py-6 space-y-4">
      <ExportManager companyId={companyId} />

      <BulkUpdateDialog
        applicationIds={selectedApplicationIds as any}
        onSuccess={() => {
          setRowSelection({});
          queryClient.invalidateQueries({ queryKey: ["interestedStudents"] });
        }}
      />

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
        columns={interestedStudentColumns}
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
}

export function InterestedStudentsTab({ companyId }: { companyId: string }) {
  return (
      <InterestedStudentsTabContent companyId={companyId} />
  );
}