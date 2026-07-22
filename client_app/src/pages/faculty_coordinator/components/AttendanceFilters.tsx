import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  SelectChangeEvent,
} from "@mui/material";

interface AttendanceFiltersProps {
  selectedBatch: string;
  batches: string[];
  onBatchChange: (e: SelectChangeEvent) => void;
  onSelectAllPresent: (action: "select" | "deselect") => void;
}

export function AttendanceFilters({
  selectedBatch,
  batches,
  onBatchChange,
  onSelectAllPresent,
}: AttendanceFiltersProps) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      alignItems="center"
    >
      <FormControl fullWidth sx={{ maxWidth: 300 }}>
        <InputLabel>Select Batch</InputLabel>
        <Select
          value={selectedBatch}
          label="Select Batch"
          onChange={onBatchChange}
        >
          <MenuItem value="">All Batches</MenuItem>
          {batches.map((batch, index) => (
            <MenuItem key={index} value={batch}>
              {batch}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ maxWidth: 300 }}>
        <InputLabel>Select All Present (Current Page)</InputLabel>
        <Select
          label="Select All Present (Current Page)"
          onChange={(e: SelectChangeEvent) =>
            onSelectAllPresent(e.target.value as "select" | "deselect")
          }
          defaultValue=""
        >
          <MenuItem value="">-- Select Option --</MenuItem>
          <MenuItem value="select">Select All</MenuItem>
          <MenuItem value="deselect">Deselect All</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
}