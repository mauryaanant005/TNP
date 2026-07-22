/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import axios from "axios";
import { Box, Grid, Tabs, Tab } from "@mui/material";
import { getCookie } from "../../utils";
import { DashboardData } from "./types";

import LoadingState from "./components/LoadingState";
import ErrorState from "./components/ErrorState";
import EmptyState from "./components/EmptyState";
import MetricCard from "./components/MetricCard";
import OverallConsentChart from "./components/OverallConsent";
import TopCompaniesChart from "./components/TopCompaniesChart";
import TrainingRadarChart from "./components/TrainingRadarChart";
import BatchTrainingRadar from "./components/BatchTrainingRadar";
import SalaryDistributionChart from "./components/SalaryDistribution";
import ConsentBreakdownChart from "./components/ConsentBreakDown";
import CrossBatchComparison from "./components/CrossBatchComparison";
import InternshipChart from "./components/InternshipChart";
export default function DepartmentDashboard() {
  const csrfToken = getCookie("csrftoken");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          "/api/department_coordinator/dashboard-summary/",
          {
            headers: { "X-CSRFToken": csrfToken || "" },
            withCredentials: true,
          }
        );
        setDashboardData(res.data);
        const batches = Object.keys(res.data.summary_by_batch);
        if (batches.length) setSelectedBatch(batches[0]);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!dashboardData) return <EmptyState message="No data available" />;

  const batches = Object.keys(dashboardData.summary_by_batch).sort((a, b) =>
    b.localeCompare(a)
  );
  const currentBatchData = dashboardData.summary_by_batch[selectedBatch];

  return (
    <Box sx={{ bgcolor: "#f5f7fa", minHeight: "100vh", p: { xs: 2, md: 4 } }}>
      {/* Metric Cards */}
      {currentBatchData && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              label="Total Students"
              value={currentBatchData.total_students}
              gradient="linear-gradient(135deg,#667eea 0%,#764ba2 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              label="Average CGPA"
              value={currentBatchData.average_cgpa.toFixed(2)}
              gradient="linear-gradient(135deg,#f093fb 0%,#f5576c 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              label="Students Placed"
              value={currentBatchData.placement_stats.actual_placed_count}
              subtitle={`${((currentBatchData.placement_stats.actual_placed_count / currentBatchData.total_students) * 100).toFixed(1)}% placement`}
              gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            {" "}
            <MetricCard
              label="Highest Package"
              value={`₹${currentBatchData.placement_stats.highest_salary_lpa.toFixed(
                1
              )}L`}
              gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
            />{" "}
          </Grid>
        </Grid>
      )}

      {/* Charts */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <OverallConsentChart data={dashboardData.overall_consent_summary} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TopCompaniesChart data={dashboardData.overall_top_companies} />
        </Grid>
      </Grid>

      <TrainingRadarChart data={dashboardData.overall_training_summary} />

      {/* Tabs */}
      <Tabs
        value={selectedBatch}
        onChange={(_, v) => setSelectedBatch(v)}
        variant="scrollable"
        scrollButtons="auto"
      >
        {batches.map((b) => (
          <Tab key={b} value={b} label={`Batch ${b}`} />
        ))}
      </Tabs>

      {currentBatchData && (
        <>
          <BatchTrainingRadar data={currentBatchData.training_stats} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <SalaryDistributionChart data={currentBatchData} />
            </Grid>
            <Grid item xs={12} md={4}>
              <ConsentBreakdownChart
                data={currentBatchData.consent_breakdown}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <InternshipChart data={currentBatchData.internship_stats} />
            </Grid>
          </Grid>
        </>
      )}

      {batches.length > 1 && (
        <CrossBatchComparison data={dashboardData.summary_by_batch} />
      )}
    </Box>
  );
}
