import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import { ShieldCheck, RotateCcw, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import Logo from "@/assets/tcet_logo_2.png";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";
  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState<number>(location.state?.cooldown || 120);
  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  // Live 2-minute countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format seconds into MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newValues = [...otpValues];
    newValues[index] = value.slice(-1);
    setOtpValues(newValues);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split("");
    setOtpValues(digits);
    inputRefs.current[5]?.focus();
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = otpValues.join("");

    if (fullOtp.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit OTP.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await api.post("/auth/api/password_reset/verify_otp/", {
        email,
        otp: fullOtp,
      }, {
        withCredentials: true,
      });

      const { reset_token } = response.data;
      toast.success("OTP verified successfully!");

      navigate("/reset-password", {
        state: { email, reset_token },
      });
    } catch (err: any) {
      const msg = err.response?.data?.error || "Invalid or expired OTP code.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0 || resending) return;

    setErrorMsg(null);
    setResending(true);

    try {
      const response = await api.post("/auth/api/password_reset/resend_otp/", { email }, {
        withCredentials: true,
      });

      toast.success("New OTP code sent!");
      setOtpValues(["", "", "", "", "", ""]);
      setTimeLeft(response.data.expires_in_seconds || 120);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to resend OTP. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setResending(false);
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
            Verify OTP Code
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Sent to {email}
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleVerify}>
            <Typography variant="body2" color="textSecondary" mb={2} textAlign="center">
              Enter the 6-digit verification code:
            </Typography>

            {/* 6-digit OTP input boxes */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 1,
                mb: 3,
              }}
            >
              {otpValues.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleInputChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  style={{
                    width: "48px",
                    height: "56px",
                    fontSize: "24px",
                    fontWeight: "bold",
                    textAlign: "center",
                    borderRadius: "8px",
                    border: "2px solid #cbd5e1",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#4169e1")}
                  onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                />
              ))}
            </Box>

            {/* Live Countdown Timer & Resend */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                p: 1.5,
                backgroundColor: "#f8fafc",
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" color="textSecondary">
                Resend OTP in:{" "}
                <Box
                  component="span"
                  fontWeight="bold"
                  color={timeLeft > 0 ? "#4169e1" : "#ef4444"}
                >
                  {formatTime(timeLeft)}
                </Box>
              </Typography>

              <Button
                id="resend-otp-btn"
                variant="text"
                size="small"
                disabled={timeLeft > 0 || resending}
                onClick={handleResend}
                startIcon={resending ? <CircularProgress size={14} color="inherit" /> : <RotateCcw size={16} />}
                sx={{
                  fontWeight: "bold",
                  color: timeLeft === 0 ? "#4169e1" : "#94a3b8",
                }}
              >
                {resending ? "Sending..." : "Resend OTP"}
              </Button>
            </Box>

            <Button
              id="verify-otp-btn"
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || otpValues.join("").length !== 6}
              sx={{
                py: 1.4,
                backgroundColor: "#4169e1",
                fontWeight: "bold",
                fontSize: "1rem",
                "&:hover": { backgroundColor: "#3152b8" },
              }}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ShieldCheck size={20} />}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>

          <Box mt={3} textAlign="center">
            <Link
              to="/forgot-password"
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
              <ArrowLeft size={16} /> Change Email Address
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VerifyOTP;
