import { Box, Alert } from "@mui/material";

export default function ErrorState({ message }: { message: string }) {
  return (
    <Box p={4} maxWidth="800px" mx="auto">
      <Alert severity="error" variant="filled">
        {message}
      </Alert>
    </Box>
  );
}
