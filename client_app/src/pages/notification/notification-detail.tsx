import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Box,
  Typography,
  CircularProgress,
  Chip,
  Divider,
  Button,
  Paper,
} from "@mui/material";
import { ArrowLeft, FileText, Download } from "lucide-react";
import { getCookie } from "@/utils";

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------

interface NotificationDetail {
  id: number;
  title: string;
  message: string;
  category: string;
  creator_name: string;
  created_at: string;
  files?: string;
  is_read: boolean;
}

// -------------------------------------------------------------------------
// Category badge color mapping
// -------------------------------------------------------------------------

const CATEGORY_COLORS: Record<string, "default" | "primary" | "secondary" | "success" | "error" | "info" | "warning"> = {
  general: "default",
  training: "info",
  placement: "success",
  internship: "warning",
  resource: "secondary",
};

// -------------------------------------------------------------------------
// API helpers — both use session cookies (withCredentials: true)
// -------------------------------------------------------------------------

const fetchNotification = async (id: string): Promise<NotificationDetail> => {
  const response = await axios.get(`/api/notifications/${id}/`, {
    withCredentials: true,
  });
  return response.data;
};

const markNotificationRead = async (id: string): Promise<void> => {
  await axios.patch(
    `/api/notifications/${id}/mark-read/`,
    {},
    {
      withCredentials: true,
      headers: { "X-CSRFToken": getCookie("csrftoken") || "" },
    }
  );
};

// -------------------------------------------------------------------------
// File renderer
// -------------------------------------------------------------------------

const FileAttachment = ({ fileUrl }: { fileUrl: string }) => {
  const ext = fileUrl.split(".").pop()?.toLowerCase() ?? "";
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
  const isPdf = ext === "pdf";

  if (isImage) {
    return (
      <Box mb={2}>
        <img
          src={fileUrl}
          alt="Attachment"
          style={{ width: "100%", maxWidth: 520, height: "auto", borderRadius: 8 }}
        />
      </Box>
    );
  }

  if (isPdf) {
    return (
      <Box mb={2} display="flex" alignItems="center" gap={1}>
        <FileText size={20} />
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          View PDF
        </a>
      </Box>
    );
  }

  return (
    <Box mb={2} display="flex" alignItems="center" gap={1}>
      <Download size={20} />
      <a href={fileUrl} download>
        Download attachment
      </a>
    </Box>
  );
};

// -------------------------------------------------------------------------
// Main component
// -------------------------------------------------------------------------

const NotificationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: notification,
    isLoading,
    isError,
  } = useQuery<NotificationDetail>({
    queryKey: ["notification", id],
    queryFn: () => fetchNotification(id!),
    enabled: !!id,
    // The detail view on the backend already marks as read,
    // but we call mark-read explicitly below for the badge count update.
    staleTime: 0,
  });

  // Mark as read when the notification is opened
  useEffect(() => {
    if (id && notification && !notification.is_read) {
      markNotificationRead(id)
        .then(() => {
          // Invalidate the list and unread-count queries so the badge updates
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
        })
        .catch(() => {
          // Non-fatal — read status is best-effort
        });
    }
  }, [id, notification?.is_read]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
          mt: "90px",
        }}
      >
        <CircularProgress sx={{ color: "#d17a00" }} />
      </Box>
    );
  }

  // -----------------------------------------------------------------------
  // Error / not found state
  // -----------------------------------------------------------------------
  if (isError || !notification) {
    return (
      <Box sx={{ textAlign: "center", mt: "90px", px: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Notification not found.
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          It may have been deleted or you may not have permission to view it.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowLeft size={18} />}
          onClick={() => navigate("/notifications")}
          sx={{ mt: 2 }}
        >
          Back to Notifications
        </Button>
      </Box>
    );
  }

  // -----------------------------------------------------------------------
  // Notification detail
  // -----------------------------------------------------------------------
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        mt: "90px",
        px: 2,
        pb: 4,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 640,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {/* Header bar */}
        <Box
          sx={{
            backgroundColor: "#d17a00",
            px: 3,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" color="white" fontWeight="bold" noWrap>
            {notification.title}
          </Typography>
          <Chip
            label={
              notification.category.charAt(0).toUpperCase() + notification.category.slice(1)
            }
            color={CATEGORY_COLORS[notification.category] ?? "default"}
            size="small"
            sx={{ ml: 2, fontWeight: "bold" }}
          />
        </Box>

        {/* Body */}
        <Box sx={{ px: 3, pt: 3, pb: 2 }}>
          {/* File attachment */}
          {notification.files && <FileAttachment fileUrl={notification.files} />}

          {/* Message */}
          <Typography
            variant="body1"
            component="pre"
            sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit" }}
          >
            {notification.message}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Metadata */}
          <Typography variant="caption" color="textSecondary" display="block">
            Created by:{" "}
            <Box component="span" fontWeight="medium" color="#d17a00">
              {notification.creator_name}
            </Box>
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block">
            {formatDate(notification.created_at)}
          </Typography>
        </Box>
      </Paper>

      {/* Back button */}
      <Button
        variant="outlined"
        startIcon={<ArrowLeft size={18} />}
        onClick={() => navigate("/notifications")}
        sx={{ mt: 3 }}
      >
        Back to Notifications
      </Button>
    </Box>
  );
};

export default NotificationDetail;