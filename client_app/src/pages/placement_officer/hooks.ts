import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

/**
 * Fetches the batch dropdown options shared by every Placement Coordinator
 * report page, defaulting the selection to the first batch returned.
 * Previously duplicated identically across index.tsx, ConsolidatedReport.tsx,
 * BranchWiseReport.tsx and StudentPerformance.tsx.
 */
export function useBatchOptions() {
  const [batches, setBatches] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [batchesLoading, setBatchesLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setBatchesLoading(true);
    apiFetch("/api/staff/companies/batches/", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: string[]) => {
        setBatches(data);
        if (data.length > 0) {
          setSelectedBatch((prev) => prev || data[0]);
        }
      })
      .catch((err) => {
        if (err?.name !== "AbortError") console.error("Error fetching batches:", err);
      })
      .finally(() => setBatchesLoading(false));
    return () => controller.abort();
  }, []);

  return { batches, selectedBatch, setSelectedBatch, batchesLoading };
}

/**
 * Fetches the department dropdown options for the currently-selected batch.
 * Scoping by batch (rather than every department across every batch ever)
 * avoids offering a department with zero students in the selected batch,
 * which previously produced a confusing always-empty filter combination.
 */
export function useDepartmentOptions(batch: string) {
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    if (!batch) {
      setDepartments([]);
      return;
    }
    const controller = new AbortController();
    apiFetch(
      `/api/placement_officer/unique-departments/?batch=${encodeURIComponent(batch)}`,
      { signal: controller.signal }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.unique_departments) setDepartments(data.unique_departments);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") console.error("Error fetching departments:", err);
      });
    return () => controller.abort();
  }, [batch]);

  return departments;
}

interface UseRealOrSampleDataOptions<T> {
  /** Full request path, or null/empty to skip fetching (e.g. no batch selected yet). */
  url: string | null;
  sampleData: T;
  hasData: (data: T) => boolean;
  /** Extra values (besides `url`) that should trigger a re-fetch when they change. */
  deps: unknown[];
}

/**
 * Real-data-first, sample-data-fallback fetch used by every Placement
 * Coordinator analytics page. Cancels superseded in-flight requests (both on
 * a dependency change and on manual retry()), ignores a response that
 * resolves after a newer request has already started, and treats fetch
 * errors as non-fatal - the page keeps showing sample data with a banner
 * instead of losing previously-rendered content.
 */
export function useRealOrSampleData<T>({ url, sampleData, hasData, deps }: UseRealOrSampleDataOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isSampleData, setIsSampleData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(() => {
    controllerRef.current?.abort();

    if (!url) {
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);

    apiFetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status} ${response.statusText}`);
        }
        const json: T = await response.json();
        if (requestId !== requestIdRef.current) return;
        if (hasData(json)) {
          setData(json);
          setIsSampleData(false);
        } else {
          setData(sampleData);
          setIsSampleData(true);
        }
      })
      .catch((e) => {
        if (e?.name === "AbortError" || requestId !== requestIdRef.current) return;
        setError(e instanceof Error ? e.message : "An unknown error occurred");
        setData(sampleData);
        setIsSampleData(true);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  useEffect(() => {
    fetchData();
    return () => controllerRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  return { data, isSampleData, loading, error, retry: fetchData };
}
