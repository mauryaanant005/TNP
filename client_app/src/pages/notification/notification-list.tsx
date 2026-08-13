import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Box,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
  Skeleton,
} from "@mui/material";
import { BellOff, Plus } from "lucide-react";
import { api, buildWebSocketUrl, toList } from "@/lib/api";
import { useAtomValue } from "jotai";
import { authAtom } from "@/authAtom";

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  creator_name: string;
  created_at: string;
  category: string;
  is_read: boolean;
}

// -------------------------------------------------------------------------
// Constants matching backend CATEGORY_CHOICES
// -------------------------------------------------------------------------

const CATEGORY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "general", label: "General" },
  { value: "training", label: "Training" },
  { value: "placement", label: "Placement" },
  { value: "internship", label: "Internship" },
  { value: "resource", label: "Resource" },
];

const CATEGORY_COLORS: Record<string, "default" | "primary" | "secondary" | "success" | "error" | "info" | "warning"> = {
  general: "default",
  training: "info",
  placement: "success",
  internship: "warning",
  resource: "secondary",
};

// -------------------------------------------------------------------------
// API helper — uses session cookies (credentials: include), NOT Bearer tokens
// -------------------------------------------------------------------------

const fetchNotifications = async (category?: string): Promise<NotificationItem[]> => {
  const params = category && category !== "all" ? { category } : {};
  const response = await api.get("/api/notifications/", {
    params,
    withCredentials: true, // use session cookie, not localStorage token
  });
  // Paginated since T-15; older builds returned a bare array.
  return toList<NotificationItem>(response.data);
};

// -------------------------------------------------------------------------
// Skeleton loader while fetching
// -------------------------------------------------------------------------

const NotificationSkeleton = () => (
  <Grid container spacing={2} direction="column" sx={{ maxWidth: 680, width: "100%" }}>
    {[1, 2, 3].map((i) => (
      <Grid item key={i}>
        <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
          <CardContent>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="90%" />
            <Skeleton variant="text" width="40%" />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

// -------------------------------------------------------------------------
// Main component
// -------------------------------------------------------------------------

const NotificationList = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authUser = useAtomValue(authAtom);

  // Roles that can create notifications
  const canCreate = authUser?.role && authUser.role !== "student";

  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
  } = useQuery<NotificationItem[]>({
    queryKey: ["notifications", selectedCategory],
    queryFn: () => fetchNotifications(selectedCategory),
    // Fast polling removed, using WebSockets for real-time updates
    refetchOnWindowFocus: true,
    staleTime: 2000,
  });

  useEffect(() => {
    const socket = new WebSocket(buildWebSocketUrl("/ws/notifications/"));

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_notification") {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    return () => {
      socket.close();
    };
  }, [queryClient]);

  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    setSelectedCategory(event.target.value);
  };

  const handleViewNotification = (id: number) => {
    navigate(`/notifications/${id}`);
    // Optimistically invalidate so the list refreshes is_read status on back-navigation
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Box
      sx={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "80px",
        minHeight: "50vh",
      }}
    >
      {/* Header row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: 680,
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            backgroundColor: "#153f74",
            padding: "10px 20px",
            borderRadius: "8px",
            color: "white",
          }}
        >
          Notifications
        </Typography>

        {canCreate && (
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => navigate("/notifications/create")}
            sx={{ backgroundColor: "#153f74", "&:hover": { backgroundColor: "#b86800" } }}
          >
            Create
          </Button>
        )}
      </Box>

      {/* Category filter */}
      <FormControl sx={{ mb: 3, minWidth: 200, alignSelf: "flex-start", maxWidth: 680 }}>
        <InputLabel id="category-select-label">Filter by Category</InputLabel>
        <Select
          labelId="category-select-label"
          id="category-select"
          value={selectedCategory}
          label="Filter by Category"
          onChange={handleCategoryChange}
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Loading state */}
      {isLoading && <NotificationSkeleton />}

      {/* Error state */}
      {isError && (
        <Box sx={{ textAlign: "center", color: "error.main", mt: 4 }}>
          <Typography variant="h6">Failed to load notifications.</Typography>
          <Typography variant="body2" color="textSecondary">
            {(error as Error)?.message ?? "Unknown error"}
          </Typography>
        </Box>
      )}

      {/* Empty state */}
      {!isLoading && !isError && notifications.length === 0 && (
        <Box
          sx={{
            textAlign: "center",
            mt: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            color: "text.secondary",
          }}
        >
          <BellOff size={56} strokeWidth={1.2} />
          <Typography variant="h6">No notifications yet.</Typography>
          <Typography variant="body2">
            {selectedCategory !== "all"
              ? `No ${selectedCategory} notifications found. Try a different category.`
              : "You don't have any notifications at the moment."}
          </Typography>
        </Box>
      )}

      {/* Notification cards */}
      {!isLoading && !isError && notifications.length > 0 && (
        <Grid container spacing={2} direction="column" sx={{ maxWidth: 680, width: "100%" }}>
          {notifications.map((notification) => (
            <Grid item key={notification.id}>
              <Card
                sx={{
                  boxShadow: notification.is_read ? 1 : 4,
                  borderRadius: 2,
                  borderLeft: notification.is_read
                    ? "4px solid transparent"
                    : "4px solid #153f74",
                  opacity: notification.is_read ? 0.85 : 1,
                  transition: "box-shadow 0.2s",
                }}
              >
                <CardActionArea onClick={() => handleViewNotification(notification.id)}>
                  <CardContent>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        {notification.title}
                      </Typography>
                      <Box display="flex" gap={1} alignItems="center">
                        {!notification.is_read && (
                          <Chip label="Unread" color="warning" size="small" />
                        )}
                        <Chip
                          label={
                            notification.category.charAt(0).toUpperCase() +
                            notification.category.slice(1)
                          }
                          color={CATEGORY_COLORS[notification.category] ?? "default"}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>

                    <Typography variant="body2" color="textSecondary" gutterBottom noWrap>
                      {notification.message}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Typography variant="caption" color="textSecondary" display="block">
                      Created by:{" "}
                      <Box component="span" fontWeight="medium" color="#153f74">
                        {notification.creator_name}
                      </Box>
                    </Typography>

                    <Typography variant="caption" color="textSecondary" display="block">
                      {formatDate(notification.created_at)}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default NotificationList;
