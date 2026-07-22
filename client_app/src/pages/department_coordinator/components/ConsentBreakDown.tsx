import { Paper, Stack, Typography, alpha } from "@mui/material";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend, Cell } from "recharts";

const COLORS = ["#1976d2", "#2e7d32", "#ed6c02"];

interface Props {
  data: {
    placement: number;
    higher_studies: number;
    entrepreneurship: number;
  };
}

export default function ConsentBreakdownChart({ data }: Props) {
  const consentData = [
    { name: "Placement", value: data.placement },
    { name: "Higher Studies", value: data.higher_studies },
    { name: "Entrepreneurship", value: data.entrepreneurship },
  ].filter((d) => d.value > 0);

  if (consentData.length === 0) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        bgcolor: alpha("#2e7d32", 0.05),
        borderRadius: 2,
        border: "1px solid",
        borderColor: alpha("#2e7d32", 0.2),
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Typography variant="subtitle1" fontWeight="bold">
          Student Consent
        </Typography>
      </Stack>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={consentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label>
            {consentData.map((_entry, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
}
