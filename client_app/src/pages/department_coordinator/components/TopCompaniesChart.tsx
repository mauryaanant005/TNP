import { Card, CardContent, Typography, Stack, Alert } from "@mui/material";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";

const COLORS = ["#1976d2", "#2e7d32", "#ed6c02", "#9c27b0", "#d32f2f"];

interface Props {
  data: Array<{ company_name: string; hires: number }>;
}

export default function TopCompaniesChart({ data }: Props) {
  return (
    <Card elevation={2} sx={{ borderRadius: 3, height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={3}>
          <Typography variant="h6" fontWeight="bold">
            Top Recruiting Companies
          </Typography>
        </Stack>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="company_name" angle={-20} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              />
              <Legend />
              <Bar dataKey="hires" fill="#1976d2" radius={[8, 8, 0, 0]}>
                {data.map((_entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Alert severity="info">No company data available</Alert>
        )}
      </CardContent>
    </Card>
  );
}
