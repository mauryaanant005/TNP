import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import { KeyRound, ArrowLeft, Mail } from "lucide-react";
import { api } from "@/lib/api";
import { SERVER_URL } from "@/constant";
import toast from "react-hot-toast";
import Logo from "@/assets/tcet_logo_2.png";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await api.post("/auth/api/password_reset/request/", { email }, {
        withCredentials: true,
      });

      const { expires_in_seconds, cooldown_seconds } = response.data;
      toast.success("Verification code sent to your email!");
      
      // Navigate to verify OTP page with state
      navigate("/verify-otp", {
        state: {
          email,
          expires_in: expires_in_seconds || 120,
          cooldown: cooldown_seconds || 120,
        },
      });
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to send reset code. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

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
            Forgot Password
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Training & Placement Portal
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <Typography variant="body2" color="textSecondary" mb={3} textAlign="center">
            Enter your registered email address below. We will send a 6-digit OTP code to verify your identity.
          </Typography>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              id="email-input"
              label="Email Address"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@tcetmumbai.in"
              required
              disabled={loading}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <Mail size={18} style={{ marginRight: 10, color: "#64748b" }} />,
              }}
            />

            <Button
              id="send-otp-btn"
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                py: 1.4,
                backgroundColor: "#4169e1",
                fontWeight: "bold",
                fontSize: "1rem",
                "&:hover": { backgroundColor: "#3152b8" },
              }}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <KeyRound size={20} />}
            >
              {loading ? "Sending OTP..." : "Send Verification Code"}
            </Button>
          </form>

          <Box mt={3} textAlign="center">
            <a
              href={`${SERVER_URL}/auth/login/`}
              style={{
                textDecoration: "none",
                color: "#4169e1",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 500,
                fontSize: "0.9rem",
              }}
            >
              <ArrowLeft size={16} /> Back to Login
            </a>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgotPassword;
