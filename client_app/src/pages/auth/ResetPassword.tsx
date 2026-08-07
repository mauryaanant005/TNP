import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  LinearProgress,
} from "@mui/material";
import { Key, Lock, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { SERVER_URL } from "@/constant";
import toast from "react-hot-toast";
import Logo from "@/assets/tcet_logo_2.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const resetToken = location.state?.reset_token || "";
  const email = location.state?.email || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!resetToken) {
      navigate("/forgot-password");
    }
  }, [resetToken, navigate]);

  // Password strength validation
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const strengthScore = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthProgress = (strengthScore / 5) * 100;

  const getStrengthColor = () => {
    if (strengthScore <= 2) return "#ef4444"; // red
    if (strengthScore <= 4) return "#f59e0b"; // yellow
    return "#10b981"; // green
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (strengthScore < 3) {
      setErrorMsg("Please choose a stronger password matching the requirements below.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      await api.post("/auth/api/password_reset/confirm/", {
        reset_token: resetToken,
        new_password: password,
        confirm_password: confirmPassword,
      }, {
        withCredentials: true,
      });

      setSuccess(true);
      toast.success("Password reset successfully! Redirecting to login...");

      setTimeout(() => {
        window.location.href = `${SERVER_URL}/auth/login/`;
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to reset password. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f4f6f9",
          px: 2,
        }}
      >
        <Card sx={{ width: "100%", maxWidth: 460, borderRadius: 3, p: 4, textAlign: "center" }}>
          <CheckCircle2 size={64} color="#10b981" style={{ margin: "0 auto 16px" }} />
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Password Reset Successful!
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={3}>
            Your password has been updated. You can now log in using your new credentials.
          </Typography>
          <Button
            onClick={() => { window.location.href = `${SERVER_URL}/auth/login/`; }}
            variant="contained"
            fullWidth
            sx={{ py: 1.4, backgroundColor: "#4169e1", fontWeight: "bold" }}
          >
            Go to Login
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f4f6f9",
        px: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 480,
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            backgroundColor: "#4169e1",
            py: 3,
            px: 4,
            textAlign: "center",
            color: "white",
          }}
        >
          <img src={Logo} alt="TCET Logo" style={{ height: 48, marginBottom: 8 }} />
          <Typography variant="h5" fontWeight="bold">
            Set New Password
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Account: {email}
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleReset}>
            <TextField
              id="new-password-input"
              label="New Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              sx={{ mb: 1.5 }}
              InputProps={{
                startAdornment: <Lock size={18} style={{ marginRight: 10, color: "#64748b" }} />,
              }}
            />

            {/* Strength indicator */}
            {password && (
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" color="textSecondary">
                    Password Strength
                  </Typography>
                  <Typography variant="caption" fontWeight="bold" color={getStrengthColor()}>
                    {strengthScore <= 2 ? "Weak" : strengthScore <= 4 ? "Medium" : "Strong"}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={strengthProgress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "#e2e8f0",
                    "& .MuiLinearProgress-bar": { backgroundColor: getStrengthColor() },
                  }}
                />
              </Box>
            )}

            <TextField
              id="confirm-password-input"
              label="Confirm New Password"
              type="password"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              error={confirmPassword.length > 0 && confirmPassword !== password}
              helperText={
                confirmPassword.length > 0 && confirmPassword !== password
                  ? "Passwords do not match"
                  : ""
              }
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: <Key size={18} style={{ marginRight: 10, color: "#64748b" }} />,
              }}
            />

            {/* Checklist */}
            <Box mb={3} p={2} sx={{ backgroundColor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
              <Typography variant="caption" fontWeight="bold" color="textSecondary" display="block" mb={1}>
                Password Requirements:
              </Typography>

              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={0.5}>
                <Typography variant="caption" color={hasMinLength ? "success.main" : "text.secondary"}>
                  {hasMinLength ? "✓" : "•"} At least 8 characters
                </Typography>
                <Typography variant="caption" color={hasUpper ? "success.main" : "text.secondary"}>
                  {hasUpper ? "✓" : "•"} One uppercase letter
                </Typography>
                <Typography variant="caption" color={hasLower ? "success.main" : "text.secondary"}>
                  {hasLower ? "✓" : "•"} One lowercase letter
                </Typography>
                <Typography variant="caption" color={hasNumber ? "success.main" : "text.secondary"}>
                  {hasNumber ? "✓" : "•"} One number
                </Typography>
              </Box>
            </Box>

            <Button
              id="reset-confirm-btn"
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || strengthScore < 3 || password !== confirmPassword}
              sx={{
                py: 1.4,
                backgroundColor: "#4169e1",
                fontWeight: "bold",
                fontSize: "1rem",
                "&:hover": { backgroundColor: "#3152b8" },
              }}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Lock size={20} />}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResetPassword;
