import { Card, CardContent, Typography } from "@mui/material";

interface MetricCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  gradient: string;
}

export default function MetricCard({
  label,
  value,
  subtitle,
  gradient,
}: MetricCardProps) {
  return (
    <Card
      elevation={2}
      sx={{
        height: "100%",
        borderRadius: 3,
        background: gradient,
        color: "white",
        transition: "0.3s",
        "&:hover": { transform: "translateY(-8px)", boxShadow: 6 },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
          {label}
        </Typography>
        <Typography variant="h3" fontWeight="bold" sx={{ mb: 0.5 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
