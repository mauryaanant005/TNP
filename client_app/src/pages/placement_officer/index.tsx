import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, MenuItem, Chip } from "@mui/material";
import { NavLink } from "react-router";
import { sampleDashboardData } from "./fallbackData";
import { useBatchOptions, useRealOrSampleData } from "./hooks";
import { ErrorBanner, NO_DATA_MESSAGE } from "./ErrorBanner";

interface DashboardData {
  placementsOverTime: { month: string; placements: number }[];
  departmentPerformance: {
    department: string;
    total: number;
    placed: number;
    avg_salary: number | null;
  }[];
  salaryDistribution: { range: string; count: number }[];
  offerCategoryBreakdown: { name: string; value: number }[];
  placementStatusFunnel: { name: string; value: number }[];
  topRecruiters: { company__name: string; hires: number }[];
  topJobRoles: { role: string; count: number }[];
}

const PIE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

function hasDashboardData(json: DashboardData): boolean {
  return Boolean(
    json.placementStatusFunnel?.some(
      (d) => d.name === "Total Students" && d.value > 0
    ) ||
      json.topRecruiters?.length > 0 ||
      json.departmentPerformance?.length > 0
  );
}

export function PlacementDashboard({
  showLegacyLink = true,
}: {
  /** The "Go to Old Placement Data" link is a relative route that only
   * exists under `/placement_officer/*` (PlacementRoutes.tsx). Principal
   * mounts this component directly under `/principal/placement` where that
   * route isn't registered, so it's hidden there. */
  showLegacyLink?: boolean;
} = {}) {
  const { batches, selectedBatch, setSelectedBatch } = useBatchOptions();
  const { data, isSampleData, loading, error, retry } =
    useRealOrSampleData<DashboardData>({
      url: selectedBatch
        ? `/api/placement_officer/dashboard/${selectedBatch}/`
        : null,
      sampleData: sampleDashboardData,
      hasData: hasDashboardData,
      deps: [],
    });

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div className="flex w-full max-w-sm items-center space-x-2 mt-10">
          <Select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            displayEmpty
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Select Batch</MenuItem>
            {batches.map((batch) => (
              <MenuItem key={batch} value={batch}>
                {batch}
              </MenuItem>
            ))}
          </Select>
        </div>
        <div className="flex items-center space-x-4 mt-10">
          {isSampleData && (
            <Chip
              label="Viewing Sample Data"
              color="warning"
              variant="outlined"
            />
          )}
          {showLegacyLink && (
            <NavLink to={'placement_old'} className={'bg-blue-600 text-white p-2 rounded'}>
              Go to Old Placement Data
            </NavLink>
          )}
        </div>
      </div>

      {/* Error */}
      {error && <ErrorBanner message={error} onRetry={retry} />}

      {selectedBatch === "2026" && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 p-4 rounded-lg text-sm">
          <strong>Cohort Note (Batch 2026):</strong> Batch 2026 data contains offer records only; unplaced student roster data is unavailable for this cohort.
        </div>
      )}

      {!loading && !data && (
        <p className="text-center text-muted-foreground py-8">{NO_DATA_MESSAGE}</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard title="Placement Status" loading={loading}>
          {data && (
            <PlacementStatusChart
              data={data.placementStatusFunnel.filter(
                (d) => d.name !== "Total Students"
              )}
            />
          )}
        </DashboardCard>

        <DashboardCard title="Offer Type Breakdown" loading={loading}>
          {data && <OfferCategoryChart data={data.offerCategoryBreakdown} />}
        </DashboardCard>

        <DashboardCard title="Salary Distribution" loading={loading}>
          {data && <SalaryDistributionChart data={data.salaryDistribution} />}
        </DashboardCard>

        <DashboardCard
          title="Placements Over Time"
          className="lg:col-span-3"
          loading={loading}
        >
          {data && <PlacementsTimeChart data={data.placementsOverTime} />}
        </DashboardCard>

        <DashboardCard
          title="Department Performance"
          className="lg:col-span-3"
          loading={loading}
        >
          {data && <DepartmentChart data={data.departmentPerformance} />}
        </DashboardCard>
        <div className="w-full flex gap-3 col-span-3">
          <DashboardCard
            title="Top 10 Job Roles"
            className="w-full "
            loading={loading}
          >
            {data && <TopRolesChart data={data.topJobRoles} />}
          </DashboardCard>

          <DashboardCard
            title="Top 10 Recruiters"
            className="w-full"
            loading={loading}
          >
            {data && <TopRecruitersChart data={data.topRecruiters} />}
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  children,
  className = "",
  loading,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  loading: boolean;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <div className="h-[300px] w-full min-h-[300px]">
            {children ? (
              <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={300}>
                {children as React.ReactElement}
              </ResponsiveContainer>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * The width/height `ResponsiveContainer` injects into its child.
 *
 * The container measures itself, then `cloneElement`s its child with the
 * result - that is the only way a Recharts chart learns its own size. Each
 * wrapper below sits *between* the container and the chart, so it has to pass
 * those props through: a component declaring only `data` silently swallows
 * them, the chart renders at zero size, and the card shows an empty
 * `<div class="recharts-responsive-container">` with no `<svg>` inside.
 */
type InjectedChartSize = { width?: number; height?: number };

function PlacementStatusChart({
  data,
  ...size
}: {
  data: { name: string; value: number }[];
} & InjectedChartSize) {
  return (
    <BarChart
      data={data}
      {...size}
      margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar
        dataKey="value"
        fill="#8884d8"
        name="Count"
        radius={[6, 6, 0, 0]}
      />
    </BarChart>
  );
}

function OfferCategoryChart({
  data,
  ...size
}: {
  data: { name: string; value: number }[];
} & InjectedChartSize) {
  return (
    <BarChart data={data} {...size} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="value" name="Offers">
        {data.map((_, index) => (
          <Cell
            key={`cell-${index}`}
            fill={PIE_COLORS[index % PIE_COLORS.length]}
          />
        ))}
      </Bar>
    </BarChart>
  );
}

function SalaryDistributionChart({
  data,
  ...size
}: {
  data: { range: string; count: number }[];
} & InjectedChartSize) {
  return (
    <BarChart data={data} {...size} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="range" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="count" fill="#8884d8" name="Students" />
    </BarChart>
  );
}

function PlacementsTimeChart({
  data,
  ...size
}: {
  data: { month: string; placements: number }[];
} & InjectedChartSize) {
  return (
    <LineChart
      data={data}
      {...size}
      margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line
        type="monotone"
        dataKey="placements"
        stroke="#8884d8"
        activeDot={{ r: 6 }}
      />
    </LineChart>
  );
}

function DepartmentChart({
  data,
  ...size
}: {
  data: { department: string; total: number; placed: number }[];
} & InjectedChartSize) {
  return (
    <BarChart data={data} {...size} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="department" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="total" fill="#82ca9d" name="Total Students" />
      <Bar dataKey="placed" fill="#8884d8" name="Placed" />
    </BarChart>
  );
}

function TopRolesChart({
  data,
  ...size
}: { data: { role: string; count: number }[] } & InjectedChartSize) {
  return (
    <BarChart
      data={data}
      {...size}
      layout="vertical"
      margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" />
      <YAxis dataKey="role" type="category" width={100} tick={{ fontSize: 11 }} />
      <Tooltip />
      <Bar dataKey="count" fill="#0088FE" name="Count" radius={[0, 4, 4, 0]} />
    </BarChart>
  );
}

function TopRecruitersChart({
  data,
  ...size
}: {
  data: { company__name: string; hires: number }[];
} & InjectedChartSize) {
  return (
    <BarChart
      data={data}
      {...size}
      layout="vertical"
      margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" />
      <YAxis dataKey="company__name" type="category" width={100} tick={{ fontSize: 11 }} />
      <Tooltip />
      <Bar dataKey="hires" fill="#00C49F" name="Hires" radius={[0, 4, 4, 0]} />
    </BarChart>
  );
}
