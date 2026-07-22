import { Box, Stack, CircularProgress, Typography } from "@mui/material";

export default function LoadingState() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
      <Stack alignItems="center" spacing={3}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary">
          Loading Dashboard...
        </Typography>
      </Stack>
    </Box>
  );
}
