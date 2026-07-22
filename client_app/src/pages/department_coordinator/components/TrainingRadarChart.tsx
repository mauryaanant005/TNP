import { Card, CardContent, Stack, Typography } from "@mui/material";
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

export default function TrainingRadarChart({ data }: Props) {
  const formattedData = Object.entries(data).map(([subject, score]) => ({
    subject,
    score,
    fullMark: 100,
  }));

  if (formattedData.length === 0) return null;

  return (
    <Card elevation={2} sx={{ borderRadius: 3, mb: 4 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={3}>
          <Typography variant="h6" fontWeight="bold">
            Overall Training Performance Analysis
          </Typography>
        </Stack>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={formattedData}>
            <PolarGrid stroke="#e0e0e0" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar name="Department Average" dataKey="score" stroke="#1976d2" fill="#1976d2" fillOpacity={0.6} />
            <Tooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
