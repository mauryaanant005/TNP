import { Button, Stack } from "@mui/material";
import {
  Save as SaveIcon,
  Download as DownloadIcon,
  ArrowLeft as ArrowBackIcon,
} from "lucide-react";

interface AttendanceActionsProps {
  onSave: () => void;
  onBack: () => void;
  onDownload: () => void;
}

export function AttendanceActions({
  onSave,
  onBack,
  onDownload,
}: AttendanceActionsProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      justifyContent="center"
    >
      <Button
        variant="contained"
        color="primary"
        startIcon={<SaveIcon />}
        onClick={onSave}
        size="large"
      >
        Save Data
      </Button>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        size="large"
      >
        Go Back
      </Button>
      <Button
        variant="contained"
        color="success"
        startIcon={<DownloadIcon />}
        onClick={onDownload}
        size="large"
      >
        Download CSV
      </Button>
    </Stack>
  );
}