import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useAtomValue } from "jotai";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormHelperText,
  Box,
  OutlinedInput,
  Checkbox,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { authAtom } from "@/authAtom";
import { getCookie } from "@/utils";
import { DEPARTMENTS_TO_DISPLAY } from "@/constant";

// -------------------------------------------------------------------------
// Constants matching backend CATEGORY_CHOICES and TARGET_AUDIENCE_CHOICES
// -------------------------------------------------------------------------

const CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "training", label: "Training" },
  { value: "placement", label: "Placement" },
  { value: "internship", label: "Internship" },
  { value: "resource", label: "Resource" },
];

const ACADEMIC_YEAR_OPTIONS = ["FE", "SE", "TE", "BE"];

// Target audience options available per role
const AUDIENCE_OPTIONS_BY_ROLE: Record<string, { value: string; label: string }[]> = {
  system_admin: [
    { value: "all_students", label: "All Students" },
    { value: "all_faculty", label: "All Faculty" },
    { value: "all_staff", label: "All Staff" },
    { value: "all_placement_officers", label: "All Placement Officers" },
    { value: "all_training_officers", label: "All Training Officers" },
    { value: "all_internship_officers", label: "All Internship Officers" },
    { value: "department_students", label: "Department-specific Students" },
    { value: "year_students", label: "Year-specific Students" },
    { value: "department_faculty", label: "Department-specific Faculty" },
    { value: "all_users", label: "All Users" },
  ],
  principal: [
    { value: "all_students", label: "All Students" },
    { value: "all_faculty", label: "All Faculty" },
    { value: "all_staff", label: "All Staff" },
    { value: "all_placement_officers", label: "All Placement Officers" },
    { value: "all_training_officers", label: "All Training Officers" },
    { value: "all_internship_officers", label: "All Internship Officers" },
    { value: "department_students", label: "Department-specific Students" },
    { value: "year_students", label: "Year-specific Students" },
    { value: "department_faculty", label: "Department-specific Faculty" },
    { value: "all_users", label: "All Users" },
  ],
  staff: [
    { value: "all_students", label: "All Students" },
    { value: "department_students", label: "Department-specific Students" },
    { value: "year_students", label: "Year-specific Students" },
    { value: "all_faculty", label: "All Faculty" },
    { value: "department_faculty", label: "Department-specific Faculty" },
    { value: "all_users", label: "All Users" },
  ],
  placement_officer: [
    { value: "all_students", label: "All Students" },
    { value: "department_students", label: "Department-specific Students" },
    { value: "year_students", label: "Year-specific Students" },
  ],
  training_officer: [
    { value: "all_students", label: "All Students" },
    { value: "department_students", label: "Department-specific Students" },
    { value: "year_students", label: "Year-specific Students" },
    { value: "all_faculty", label: "All Faculty" },
    { value: "department_faculty", label: "Department-specific Faculty" },
  ],
  internship_officer: [
    { value: "all_students", label: "All Students" },
    { value: "department_students", label: "Department-specific Students" },
    { value: "year_students", label: "Year-specific Students" },
  ],
  faculty: [
    { value: "department_students", label: "Students in My Department" },
  ],
};

// Audiences that require a department selection
const NEEDS_DEPARTMENT = new Set([
  "department_students",
  "department_faculty",
]);

// Audiences that require a year selection
const NEEDS_YEAR = new Set(["year_students"]);

// -------------------------------------------------------------------------
// Form types
// -------------------------------------------------------------------------

interface NotificationFormValues {
  title: string;
  message: string;
  category: string;
  target_audience: string;
  target_departments: string[];
  target_academic_years: string[];
  files: FileList | null;
}

// -------------------------------------------------------------------------
// API mutation
// -------------------------------------------------------------------------

const createNotification = async (formData: FormData): Promise<unknown> => {
  const csrfToken = getCookie("csrftoken");
  const response = await axios.post("/api/notifications/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-CSRFToken": csrfToken || "",
    },
    withCredentials: true,
  });
  return response.data;
};

// -------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------

const CreateNotification = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authUser = useAtomValue(authAtom);

  const role = authUser?.role ?? "staff";
  const audienceOptions = AUDIENCE_OPTIONS_BY_ROLE[role] ?? AUDIENCE_OPTIONS_BY_ROLE["staff"];

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<NotificationFormValues>({
    defaultValues: {
      title: "",
      message: "",
      category: "general",
      target_audience: audienceOptions[0]?.value ?? "all_students",
      target_departments: [],
      target_academic_years: [],
      files: null,
    },
  });

  const selectedAudience = watch("target_audience");
  const showDepartments = NEEDS_DEPARTMENT.has(selectedAudience);
  const showYears =
    NEEDS_YEAR.has(selectedAudience) ||
    selectedAudience === "all_students" ||
    selectedAudience === "department_students";

  const mutation = useMutation({
    mutationFn: createNotification,
    onSuccess: () => {
      toast.success("Notification created successfully");
      reset();
      // Invalidate list cache so the new notification appears immediately on redirect
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      navigate("/notifications");
    },
    onError: (err: unknown) => {
      const msg =
        axios.isAxiosError(err)
          ? err.response?.data?.error ?? "Failed to create notification"
          : "Failed to create notification";
      toast.error(msg);
    },
  });

  const onSubmit = (data: NotificationFormValues) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("message", data.message);
    formData.append("category", data.category);
    formData.append("target_audience", data.target_audience);

    // Multi-value fields — append each value separately for Django's QueryDict
    data.target_departments.forEach((d) => formData.append("target_departments", d));
    data.target_academic_years.forEach((y) => formData.append("target_academic_years", y));

    if (data.files && data.files[0]) {
      formData.append("files", data.files[0]);
    }

    mutation.mutate(formData);
  };

  return (
    <Card
      sx={{
        width: "100%",
        maxWidth: 560,
        mx: "auto",
        mt: "12vh",
        mb: 4,
        boxShadow: 4,
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Create Notification
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
          noValidate
        >
          {/* Title */}
          <TextField
            id="notification-title"
            label="Title"
            fullWidth
            {...register("title", { required: "Title is required." })}
            error={!!errors.title}
            helperText={errors.title?.message}
          />

          {/* Message */}
          <TextField
            id="notification-message"
            label="Message"
            multiline
            rows={4}
            fullWidth
            {...register("message", { required: "Message is required." })}
            error={!!errors.message}
            helperText={errors.message?.message}
          />

          {/* Category */}
          <Controller
            name="category"
            control={control}
            rules={{ required: "Category is required." }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.category}>
                <InputLabel id="category-label">Category</InputLabel>
                <Select labelId="category-label" id="category-select" label="Category" {...field}>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && (
                  <FormHelperText>{errors.category.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />

          {/* Target Audience */}
          <Controller
            name="target_audience"
            control={control}
            rules={{ required: "Target audience is required." }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.target_audience}>
                <InputLabel id="audience-label">Target Audience</InputLabel>
                <Select
                  labelId="audience-label"
                  id="audience-select"
                  label="Target Audience"
                  {...field}
                >
                  {audienceOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.target_audience && (
                  <FormHelperText>{errors.target_audience.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />

          {/* Departments — shown when audience requires it */}
          {showDepartments && (
            role === "faculty" ? (
              <TextField
                label="Departments"
                fullWidth
                disabled
                value={authUser?.department || "Assigned Department"}
                helperText="Department Coordinators can only notify their assigned department."
              />
            ) : (
              <Controller
                name="target_departments"
                control={control}
                rules={{
                  validate: (v) =>
                    showDepartments && v.length === 0
                      ? "Select at least one department."
                      : true,
                }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.target_departments}>
                    <InputLabel id="dept-label">Departments</InputLabel>
                    <Select
                      labelId="dept-label"
                      id="dept-select"
                      multiple
                      {...field}
                      input={<OutlinedInput label="Departments" />}
                      renderValue={(selected) => (selected as string[]).join(", ")}
                    >
                      {DEPARTMENTS_TO_DISPLAY.map((dept) => (
                        <MenuItem key={dept} value={dept}>
                          <Checkbox checked={(field.value as string[]).includes(dept)} />
                          <ListItemText primary={dept} />
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.target_departments && (
                      <FormHelperText>{errors.target_departments.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            )
          )}

          {/* Academic Years — shown when audience requires it */}
          {showYears && (
            <Controller
              name="target_academic_years"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel id="year-label">Academic Years (optional)</InputLabel>
                  <Select
                    labelId="year-label"
                    id="year-select"
                    multiple
                    {...field}
                    input={<OutlinedInput label="Academic Years (optional)" />}
                    renderValue={(selected) => (selected as string[]).join(", ")}
                  >
                    {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                      <MenuItem key={yr} value={yr}>
                        <Checkbox checked={(field.value as string[]).includes(yr)} />
                        <ListItemText primary={yr} />
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    Leave empty to include all years for the selected audience.
                  </FormHelperText>
                </FormControl>
              )}
            />
          )}

          {/* File attachment */}
          <Box>
            <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>
              Attachment (optional)
            </Typography>
            <input
              id="notification-file"
              type="file"
              {...register("files")}
              style={{ display: "block" }}
            />
          </Box>

          {/* Submit */}
          <Button
            id="create-notification-btn"
            type="submit"
            variant="contained"
            fullWidth
            disabled={mutation.isPending}
            sx={{
              mt: 1,
              backgroundColor: "#4169e1",
              "&:hover": { backgroundColor: "#b86800" },
            }}
            startIcon={mutation.isPending ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {mutation.isPending ? "Creating…" : "Create Notification"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CreateNotification;