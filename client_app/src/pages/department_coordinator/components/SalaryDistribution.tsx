import { Paper, Stack, Typography, alpha } from "@mui/material";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from "recharts";

interface Props {
  data: {
    placement_stats: {
      highest_salary_lpa: number;
      average_salary_lpa: number;
      median_salary_lpa: number;
    };
  };
}

export default function SalaryDistributionChart({ data }: Props) {
  const salaryData = [
    { name: "Highest", value: data.placement_stats.highest_salary_lpa, color: "#2e7d32" },
    { name: "Average", value: data.placement_stats.average_salary_lpa, color: "#1976d2" },
    { name: "Median", value: data.placement_stats.median_salary_lpa, color: "#ed6c02" },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        bgcolor: alpha("#1976d2", 0.05),
        borderRadius: 2,
        border: "1px solid",
        borderColor: alpha("#1976d2", 0.2),
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Typography variant="subtitle1" fontWeight="bold">
          Salary Distribution
        </Typography>
      </Stack>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={salaryData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={80} />
          <Tooltip formatter={(value: number) => `₹${value}L`} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]}>
            {salaryData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}
