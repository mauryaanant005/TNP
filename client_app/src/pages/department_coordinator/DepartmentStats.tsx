/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [isDummy, setIsDummy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(
          "/api/department_coordinator/dashboard-summary/",
          {
            headers: { "X-CSRFToken": csrfToken || "" },
            withCredentials: true,
          }
        );
        if (!res.data.summary_by_batch || Object.keys(res.data.summary_by_batch).length === 0) {
            throw new Error("Empty data");
        }
        setDashboardData(res.data);
        const batches = Object.keys(res.data.summary_by_batch);
        if (batches.length) setSelectedBatch(batches[0]);
      } catch (err: any) {
        // Fallback to dummy data
        setIsDummy(true);
        const dummyData: DashboardData = {
          department_name: "Computer Engineering (Dummy)",
          summary_by_batch: {
            "2024": {
              total_students: 120,
              average_cgpa: 8.5,
              students_with_kt: 5,
              consent_breakdown: { placement: 80, higher_studies: 30, entrepreneurship: 10 },
              placement_stats: { actual_placed_count: 75, average_salary_lpa: 6.5, highest_salary_lpa: 15.0, median_salary_lpa: 5.5 },
              internship_stats: { total_internships: 100, in_house: 40, outhouse: 60 },
              training_stats: { Aptitude: 80, Technical: 75, Coding: 85 }
            },
            "2025": {
              total_students: 130,
              average_cgpa: 8.2,
              students_with_kt: 8,
              consent_breakdown: { placement: 90, higher_studies: 25, entrepreneurship: 15 },
              placement_stats: { actual_placed_count: 85, average_salary_lpa: 7.0, highest_salary_lpa: 20.0, median_salary_lpa: 6.0 },
              internship_stats: { total_internships: 110, in_house: 50, outhouse: 60 },
              training_stats: { Aptitude: 78, Technical: 82, Coding: 80 }
            }
          },
          overall_consent_summary: [
            { name: "Placement", value: 170 },
            { name: "Higher Studies", value: 55 },
            { name: "Entrepreneurship", value: 25 }
          ],
          overall_top_companies: [
            { company_name: "TCS", hires: 40 },
            { company_name: "Infosys", hires: 35 },
            { company_name: "Accenture", hires: 30 },
            { company_name: "Cognizant", hires: 25 }
          ],
          overall_training_summary: {
            Aptitude: 79,
            Technical: 78.5,
            Coding: 82.5
          }
        };
        setDashboardData(dummyData);
        setSelectedBatch("2024");
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
      {isDummy && (
        <Box sx={{ mb: 3, p: 2, bgcolor: "#fff3cd", color: "#856404", borderRadius: 1, border: "1px solid #ffeeba" }}>
          <strong>Note:</strong> Showing sample fallback data because no actual department stats are available.
        </Box>
      )}

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
