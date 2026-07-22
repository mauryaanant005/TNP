import { Box, Typography } from "@mui/material";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
} from "recharts";

interface Props {
  data: Record<string, number>;
}

export default function BatchTrainingRadar({ data }: Props) {
  const formattedData = Object.entries(data).map(([subject, score]) => ({
    subject,
    score,
    fullMark: 100,
  }));

  if (formattedData.length === 0) return null;

  return (
    <Box mb={4}>
      <Typography variant="subtitle1" fontWeight="bold" mb={2} color="primary">
        Training Performance
      </Typography>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={formattedData}>
          <PolarGrid stroke="#e0e0e0" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar name="Batch Average" dataKey="score" stroke="#2e7d32" fill="#2e7d32" fillOpacity={0.6} />
          <Tooltip />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
}
