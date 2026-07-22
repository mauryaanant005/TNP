import {
  Typography,
  Chip,
  Stack,
  IconButton,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import {
  ArrowLeft as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
} from "lucide-react";

interface AttendanceHeaderProps {
  program: string;
  dateSession: string;
  year: string;
  totalStudents: number;
  presentCount: number;
  lateCount: number;
  onBackClick: () => void;
}

export function AttendanceHeader({
  program,
  dateSession,
  year,
  totalStudents,
  presentCount,
  lateCount,
  onBackClick,
}: AttendanceHeaderProps) {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <IconButton onClick={onBackClick} color="primary">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Attendance Management
          </Typography>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
          <Chip label={`Program: ${program}`} color="primary" />
          <Chip label={`Session: ${dateSession}`} color="secondary" />
          <Chip label={`Year: ${year}`} color="info" />
          <Chip
            label={`Total Students: ${totalStudents}`}
            variant="outlined"
          />
          <Chip
            icon={<CheckCircleIcon />}
            label={`Present: ${presentCount}`}
            color="success"
            variant="outlined"
          />
          <Chip
            label={`Late: ${lateCount}`}
            color="warning"
            variant="outlined"
          />
        </Stack>
      </CardContent>
    </Card>
  );
}