import { useCallback, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { useAtomValue } from "jotai";
import { toast } from "react-hot-toast";
import {
  UploadCloud,
  FileSpreadsheet,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Users,
  Building2,
  Handshake,
  FileWarning,
  ListChecks,
  RotateCcw,
} from "lucide-react";

import { authAtom } from "@/authAtom";
import { apiFetch } from "@/lib/api";
import { getCookie } from "@/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ---------------------------------------------------------------------------
// Types — mirror dataimport.report.ImportReport.to_dict()
// ---------------------------------------------------------------------------

interface RejectedRow {
  file: string;
  row: number;
  value: string;
}

interface ImportReportData {
  dry_run: boolean;
  files_processed: string[];
  rows_read: number;
  students_created: number;
  students_updated: number;
  students_unchanged: number;
  users_created: number;
  users_relinked: number;
  companies_created: number;
  notices_created: number;
  offers_created: number;
  offers_updated: number;
  attendance_created: number;
  training_performance_created: number;
  internships_created: number;
  sessions_created: number;
  duplicates_skipped: number;
  invalid_skipped: number;
  deleted: Record<string, number>;
  rejects: Record<string, RejectedRow[]>;
  anomalies: Record<string, string[]>;
  errors: string[];
}

interface TaskStatusResponse {
  status: string;
  report?: ImportReportData;
  error?: string;
}

const ACCEPTED_EXTENSIONS = [".xls", ".xlsx"];
const MAX_FILE_MB = 15;
const TERMINAL_STATES = new Set(["SUCCESS", "FAILURE"]);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function hasAcceptedExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

// ---------------------------------------------------------------------------
// Status polling — same idiom as ExportManager's useTaskPoller: the UI is
// derived straight from the SWR result, never copied into local state, so
// there is nothing to keep in sync and nothing that can go stale.
// ---------------------------------------------------------------------------

const statusFetcher = (url: string) => apiFetch(url).then((res) => res.json());

function useImportTaskPoller(taskId: string | null) {
  const { data, error } = useSWR<TaskStatusResponse>(
    taskId ? `/api/staff/historical-import/status/${taskId}/` : null,
    statusFetcher,
    { refreshInterval: (data) => (data && TERMINAL_STATES.has(data.status) ? 0 : 2500) }
  );
  return { data, isError: error };
}

// ---------------------------------------------------------------------------
// Report display
// ---------------------------------------------------------------------------

const STAT_TILES: { key: keyof ImportReportData; label: string; icon: typeof Users }[] = [
  { key: "students_created", label: "Students created", icon: Users },
  { key: "students_updated", label: "Students updated", icon: Users },
  { key: "companies_created", label: "Companies created", icon: Building2 },
  { key: "offers_created", label: "Offers created", icon: Handshake },
  { key: "offers_updated", label: "Offers updated", icon: Handshake },
  { key: "invalid_skipped", label: "Invalid rows skipped", icon: FileWarning },
];

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-semibold leading-tight tabular-nums">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function ImportReportView({
  report,
  onConfirm,
  confirming,
  onReset,
}: {
  report: ImportReportData;
  onConfirm: (() => void) | null;
  confirming: boolean;
  onReset: () => void;
}) {
  const rejectReasons = Object.entries(report.rejects);
  const anomalyReasons = Object.entries(report.anomalies);
  const deletedEntries = Object.entries(report.deleted);

  return (
    <div className="space-y-5">
      <Alert
        className={cn(
          report.dry_run
            ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
            : "border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200"
        )}
      >
        {report.dry_run ? (
          <ShieldAlert className="h-4 w-4" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        <AlertTitle>
          {report.dry_run ? "Preview complete — nothing was saved yet" : "Import complete"}
        </AlertTitle>
        <AlertDescription>
          {report.dry_run
            ? "These are the exact numbers a real import would produce. Review them, then confirm to commit."
            : `${report.files_processed.length} file(s) processed, ${report.rows_read} rows read.`}
        </AlertDescription>
      </Alert>

      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Files processed ({report.files_processed.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {report.files_processed.map((name) => (
            <Badge key={name} variant="secondary" className="font-normal">
              {name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {STAT_TILES.map(({ key, label, icon }) => (
          <StatTile key={key} label={label} value={report[key] as number} icon={icon} />
        ))}
      </div>

      {(deletedEntries.length > 0 ||
        rejectReasons.length > 0 ||
        anomalyReasons.length > 0 ||
        report.errors.length > 0) && (
        <Accordion type="multiple" className="rounded-lg border px-4">
          {deletedEntries.length > 0 && (
            <AccordionItem value="deleted">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4" /> Deleted (
                  {deletedEntries.reduce((n, [, c]) => n + c, 0)})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {deletedEntries.map(([reason, count]) => (
                    <li key={reason}>
                      {reason}: <span className="font-medium text-foreground">{count}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}

          {rejectReasons.length > 0 && (
            <AccordionItem value="rejects">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <FileWarning className="h-4 w-4 text-destructive" /> Rejected rows (
                  {rejectReasons.reduce((n, [, rows]) => n + rows.length, 0)})
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                {rejectReasons.map(([reason, rows]) => (
                  <div key={reason}>
                    <p className="text-sm font-medium">
                      {reason} <span className="text-muted-foreground">({rows.length})</span>
                    </p>
                    <ul className="mt-1 space-y-0.5 pl-4 text-xs text-muted-foreground">
                      {rows.map((r, i) => (
                        <li key={i} className="font-mono">
                          {r.file} · row {r.row}: {r.value}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}

          {anomalyReasons.length > 0 && (
            <AccordionItem value="anomalies">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-600" /> Anomalies — imported, but worth
                  checking ({anomalyReasons.reduce((n, [, items]) => n + items.length, 0)})
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                {anomalyReasons.map(([reason, items]) => (
                  <div key={reason}>
                    <p className="text-sm font-medium">
                      {reason} <span className="text-muted-foreground">({items.length})</span>
                    </p>
                    <ul className="mt-1 space-y-0.5 pl-4 text-xs text-muted-foreground">
                      {items.map((item, i) => (
                        <li key={i} className="font-mono">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}

          {report.errors.length > 0 && (
            <AccordionItem value="errors" className="border-b-0">
              <AccordionTrigger>
                <span className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" /> Errors ({report.errors.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1 text-sm text-destructive">
                  {report.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        {onConfirm && (
          <Button onClick={onConfirm} disabled={confirming}>
            {confirming ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Confirm &amp; Import
          </Button>
        )}
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          {onConfirm ? "Discard preview" : "Start new import"}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function UploadHistoricalData() {
  const authUser = useAtomValue(authAtom);
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: poll } = useImportTaskPoller(taskId);
  const stillRunning = Boolean(taskId) && (!poll || !TERMINAL_STATES.has(poll.status));
  const busy = uploading || stillRunning;

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const accepted: File[] = [];
    for (const f of Array.from(incoming)) {
      if (!hasAcceptedExtension(f.name)) {
        toast.error(`"${f.name}" is not a .xls/.xlsx file — skipped.`);
        continue;
      }
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(`"${f.name}" is larger than ${MAX_FILE_MB}MB — skipped.`);
        continue;
      }
      accepted.push(f);
    }
    if (accepted.length) {
      setFiles((prev) => {
        const existing = new Set(prev.map((f) => `${f.name}:${f.size}`));
        return [...prev, ...accepted.filter((f) => !existing.has(`${f.name}:${f.size}`))];
      });
    }
  }, []);

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const resetAll = () => {
    setFiles([]);
    setTaskId(null);
    setUploadError(null);
    setConfirming(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = async (dryRun: boolean) => {
    if (files.length === 0) {
      toast.error("Attach at least one file first.");
      return;
    }

    setUploadError(null);
    if (dryRun) setUploading(true);
    else setConfirming(true);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("dry_run", dryRun ? "true" : "false");

    try {
      const response = await apiFetch("/api/staff/historical-import/upload/", {
        method: "POST",
        body: formData,
        headers: { "X-CSRFToken": getCookie("csrftoken") || "" },
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setUploadError(body.error || "Upload was rejected.");
        return;
      }
      setTaskId(body.task_id);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not reach the server.");
    } finally {
      setUploading(false);
      setConfirming(false);
    }
  };

  const dropHandlers = useMemo(
    () => ({
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        if (!busy) setDragActive(true);
      },
      onDragLeave: (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        if (busy) return;
        if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
      },
    }),
    [addFiles, busy]
  );

  if (authUser && authUser.role !== "staff" && authUser.role !== "placement_officer") {
    return (
      <div className="p-4 md:p-8">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Not available for your role</AlertTitle>
          <AlertDescription>
            Importing historical placement data is restricted to the T&amp;P office and the
            Placement Officer.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Import Historical Batch Data</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a student roster or a "Students Placement Register" workbook for a past batch.
          Every import is previewed before anything is saved.
        </p>
      </div>

      {uploadError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Upload rejected</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{uploadError}</span>
            <Button size="sm" variant="outline" onClick={() => setUploadError(null)}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {taskId && poll?.status === "FAILURE" && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Import failed</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{poll.error || "An unknown error occurred."}</span>
            <Button size="sm" variant="outline" onClick={resetAll}>
              Start over
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {taskId && poll?.status === "SUCCESS" && poll.report ? (
        <Card>
          <CardHeader>
            <CardTitle>Import report</CardTitle>
            <CardDescription>
              {poll.report.dry_run
                ? "Preview of what would happen — nothing has been saved."
                : "This has been saved to the database."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImportReportView
              report={poll.report}
              confirming={confirming}
              onConfirm={poll.report.dry_run ? () => submit(false) : null}
              onReset={resetAll}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Spreadsheets</CardTitle>
            <CardDescription>
              .xls or .xlsx, up to {MAX_FILE_MB}MB each. The batch each row belongs to is read
              from the data itself — there's nothing to select.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stillRunning ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium">
                  {uploading ? "Uploading…" : "Processing your file(s)…"}
                </p>
                <p className="text-xs text-muted-foreground">
                  This can take a few minutes for a large register. You can leave this page open.
                </p>
              </div>
            ) : (
              <>
                <label
                  {...dropHandlers}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50"
                  )}
                >
                  <UploadCloud className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Drag &amp; drop files here, or{" "}
                    <span className="text-primary underline underline-offset-2">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    .xls, .xlsx — multiple files allowed
                  </p>
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept=".xls,.xlsx"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>

                {files.length > 0 && (
                  <ul className="space-y-2">
                    {files.map((file, index) => (
                      <li
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary" />
                          <span className="truncate text-sm">{file.name}</span>
                          <Badge variant="outline" className="shrink-0 font-normal">
                            {formatBytes(file.size)}
                          </Badge>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button onClick={() => submit(true)} disabled={files.length === 0}>
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Preview Import
                  </Button>
                  {files.length > 0 && (
                    <Button variant="ghost" onClick={resetAll}>
                      Clear
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
