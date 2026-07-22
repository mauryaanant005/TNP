import { Card, CardContent, Typography, Stack, Alert } from "@mui/material";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend, Cell } from "recharts";

const COLORS = ["#1976d2", "#2e7d32", "#ed6c02", "#9c27b0", "#d32f2f"];

export default function OverallConsentChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <Card elevation={2} sx={{ borderRadius: 3, height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={3}>
          <Typography variant="h6" fontWeight="bold">
            Overall Consent Distribution
          </Typography>
        </Stack>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((_entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Alert severity="info">No consent data available</Alert>
        )}
      </CardContent>
    </Card>
  );
}
