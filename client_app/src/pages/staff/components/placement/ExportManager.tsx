"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Download,
  FileText,
  FileArchive,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { SERVER_URL } from "@/constant";
// This hook polls the task status
const taskFetcher = (url: string) => fetch(url).then((res) => res.json());

const useTaskPoller = (taskId: string | null) => {
  const { data, error } = useSWR(
    taskId ? `/api/staff/task-status/${taskId}/` : null,
    taskFetcher,
    {
      refreshInterval: (data) =>
        data?.status === "SUCCESS" || data?.status === "FAILURE" ? 0 : 3000,
    }
  );

  return {
    data,
    isLoading: !error && !data,
    isError: error,
  };
};

// This component shows the status of a single running task
function TaskStatus({
  taskId,
  onClose,
}: {
  taskId: string;
  onClose: () => void;
}) {
  const { data, isError } = useTaskPoller(taskId);
  const status = data?.status;
  const url = data?.url;
  const error = isError || data?.error;

  if (status === "SUCCESS") {
    return (
      <Alert variant="default" className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-700" />
        <AlertTitle className="text-green-800">Export Ready!</AlertTitle>
        <AlertDescription className="flex justify-between items-center">
          Your file is ready to download.
          <Button asChild variant="outline" size="sm">
            <a href={`${SERVER_URL}${url}`} download onClick={onClose}>
              <Download className="mr-2 h-4 w-4" /> Download
            </a>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "FAILURE") {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Export Failed</AlertTitle>
        <AlertDescription>
          {error || "An unknown error occurred."}
          <Button variant="link" size="sm" onClick={onClose} className="p-0 h-auto ml-2">
            Dismiss
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert>
      {status === "Pending" ? (
        <Info className="h-4 w-4" />
      ) : (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}
      <AlertTitle>
        {status === "Pending" ? "Task Queued..." : "Exporting..."}
      </AlertTitle>
      <AlertDescription>
        Your file is being generated. We'll provide a download link here when
        it's ready.
      </AlertDescription>
    </Alert>
  );
}

export function ExportManager({ companyId }: { companyId: string }) {
  const [tasks, setTasks] = useState<{ excel: string | null; resume: string | null }>(
    {
      excel: null,
      resume: null,
    }
  );
  const [isLoading, setIsLoading] = useState<"excel" | "resume" | null>(null);

  const triggerExport = async (type: "excel" | "resume") => {
    setIsLoading(type);
    const url =
      type === "excel"
        ? `/api/staff/company/${companyId}/trigger-excel-export/`
        : `/api/staff/company/${companyId}/trigger-resume-export/`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to start export task.");

      const { task_id } = await response.json();
      setTasks((prev) => ({ ...prev, [type]: task_id }));
      toast(`Started ${type} export...`);
    } catch (error) {
      toast(`Failed to start export: ${(error as Error).message}`);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={() => triggerExport("excel")}
          disabled={!!isLoading || !!tasks.excel}
        >
          {isLoading === "excel" || tasks.excel ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          Export Students (.xlsx)
        </Button>
        <Button
          onClick={() => triggerExport("resume")}
          disabled={!!isLoading || !!tasks.resume}
        >
          {isLoading === "resume" || tasks.resume ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileArchive className="mr-2 h-4 w-4" />
          )}
          Export Resumes (.zip)
        </Button>
      </div>

      {/* Render status alerts for active tasks */}
      {tasks.excel && (
        <TaskStatus
          taskId={tasks.excel}
          onClose={() => setTasks((prev) => ({ ...prev, excel: null }))}
        />
      )}
      {tasks.resume && (
        <TaskStatus
          taskId={tasks.resume}
          onClose={() => setTasks((prev) => ({ ...prev, resume: null }))}
        />
      )}
    </div>
  );
}