import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, MenuItem } from "@mui/material";
import { NavLink } from "react-router";

interface DashboardData {
  placementsOverTime: { month: string; placements: number }[];
  departmentPerformance: {
    department: string;
    total: number;
    placed: number;
    avg_salary: string | null;
  }[];
  salaryDistribution: { range: string; count: number }[];
  offerCategoryBreakdown: { name: string; value: number }[];
  placementStatusFunnel: { name: string; value: number }[];
  topRecruiters: { company__name: string; hires: number }[];
  topJobRoles: { role: string; count: number }[];
}

const PIE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export function PlacementDashboard() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = React.useState<string>("");
  const [batches, setBatches] = React.useState<string[]>([]);

  React.useEffect(() => {
    fetch("/api/staff/companies/batches/")
      .then((res) => res.json())
      .then((data) => setBatches(data))
      .catch((err) => console.error("Error fetching batches:", err));
  }, []);
  React.useEffect(() => {
    async function fetchData(batchToFetch: string) {
      if (!batchToFetch) return;

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/placement_officer/dashboard/${batchToFetch}/`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const jsonData: DashboardData = await response.json();
        setData(jsonData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "An unknown error occurred");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData(selectedBatch);
  }, [selectedBatch]);

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
        <NavLink to={'placement_old'} className={'bg-orange-600 text-white p-2 '}>Go to Old Placement Data</NavLink>
      </div>

      {/* Error */}
      {error && (
        <Card className="bg-destructive text-destructive-foreground">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load dashboard data: {error}</p>
          </CardContent>
        </Card>
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
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <>{children}</>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlacementStatusChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width={250} height={250}>
      <BarChart
        data={data}
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
    </ResponsiveContainer>
  );
}

function OfferCategoryChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <BarChart data={data} height={250} width={200} style={{ margin: "0 auto" }}>
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
}: {
  data: { range: string; count: number }[];
}) {
  return (
    <BarChart data={data} height={250} width={200} style={{ margin: "0 auto" }}>
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
}: {
  data: { month: string; placements: number }[];
}) {
  return (
    <LineChart
      data={data}
      height={250}
      width={200}
      style={{ margin: "0 auto" }}
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
}: {
  data: { department: string; total: number; placed: number }[];
}) {
  return (
    <BarChart data={data} height={250} width={200} style={{ margin: "0 auto" }}>
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

function TopRolesChart({ data }: { data: { role: string; count: number }[] }) {
  return (
    <PieChart height={250} width={200} style={{ margin: "0 auto" }}>
      <Pie
        data={data}
        dataKey="count"
        nameKey="role"
        cx="50%"
        cy="50%"
        outerRadius={80}
        label
      >
        {data.map((_, index) => (
          <Cell
            key={`cell-${index}`}
            fill={PIE_COLORS[index % PIE_COLORS.length]}
          />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  );
}

function TopRecruitersChart({
  data,
}: {
  data: { company__name: string; hires: number }[];
}) {
  return (
    <PieChart height={250} width={200} style={{ margin: "0 auto" }}>
      <Pie
        data={data}
        dataKey="hires"
        nameKey="company__name"
        cx="50%"
        cy="50%"
        outerRadius={80}
        label
      >
        {data.map((_, index) => (
          <Cell
            key={`cell-${index}`}
            fill={PIE_COLORS[index % PIE_COLORS.length]}
          />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  );
}
