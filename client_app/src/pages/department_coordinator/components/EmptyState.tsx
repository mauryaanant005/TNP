import { Box, Alert } from "@mui/material";

export default function EmptyState({ message }: { message: string }) {
  return (
    <Box p={4} maxWidth="800px" mx="auto">
      <Alert severity="info" variant="outlined">
        {message}
      </Alert>
    </Box>
  );
}
