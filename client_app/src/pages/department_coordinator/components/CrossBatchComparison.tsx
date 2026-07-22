import { Box, Typography } from "@mui/material";
import { ResponsiveContainer, BarChart, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from "recharts";
import { BatchData } from "../types";

interface Props {
  data: Record<string, BatchData>;
}

export default function CrossBatchComparison({ data }: Props) {
  const batches = Object.keys(data).sort((a, b) => b.localeCompare(a));

  const comparisonData = batches.map((batch) => {
    const d = data[batch];
    return {
      batch,
      students: d.total_students,
      placed: d.placement_stats.actual_placed_count,
      avgSalary: d.placement_stats.average_salary_lpa,
      placementRate: (d.placement_stats.actual_placed_count / d.total_students) * 100,
    };
  });

  return (
    <Box mt={5}>
      <Typography variant="h6" fontWeight="bold" mb={3} color="primary">
        Cross-Batch Performance Comparison
      </Typography>

      <Box mb={4}>
        <Typography variant="subtitle2" mb={2} color="text.secondary">
          Placement Success Rate (%)
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="batch" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
            <Legend />
            <Bar dataKey="placementRate" fill="#2e7d32" name="Placement Rate (%)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Box>
        <Typography variant="subtitle2" mb={2} color="text.secondary">
          Trends Across Batches
        </Typography>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="batch" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="students" stroke="#1976d2" strokeWidth={3} name="Total Students" dot={{ r: 6 }} />
            <Line yAxisId="left" type="monotone" dataKey="placed" stroke="#2e7d32" strokeWidth={3} name="Placed Students" dot={{ r: 6 }} />
            <Line yAxisId="right" type="monotone" dataKey="avgSalary" stroke="#ed6c02" strokeWidth={3} name="Avg Salary (LPA)" dot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
