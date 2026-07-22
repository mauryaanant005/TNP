import { Paper, Stack, Typography, alpha, Box, Chip } from "@mui/material";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend, Cell } from "recharts";

interface Props {
  data: {
    total_internships: number;
    in_house: number;
    outhouse: number;
  };
}

export default function InternshipChart({ data }: Props) {
  const internshipData = [
    { name: "In-House", value: data.in_house, color: "#2e7d32" },
    { name: "Outhouse", value: data.outhouse, color: "#1976d2" },
  ].filter((d) => d.value > 0);

  if (internshipData.length === 0) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        bgcolor: alpha("#ed6c02", 0.05),
        borderRadius: 2,
        border: "1px solid",
        borderColor: alpha("#ed6c02", 0.2),
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Typography variant="subtitle1" fontWeight="bold">
          Internship Distribution
        </Typography>
      </Stack>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={internshipData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {internshipData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <Box textAlign="center" mt={2}>
        <Chip label={`Total: ${data.total_internships}`} color="warning" sx={{ fontWeight: "bold" }} />
      </Box>
    </Paper>
  );
}
