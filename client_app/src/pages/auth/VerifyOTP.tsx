import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router";
import { ShieldCheck, RotateCcw, ArrowLeft, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { AuthLayout } from "@/components/AuthLayout";

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
      const response = await api.post(
        "/auth/api/password_reset/verify_otp/",
        {
          email,
          otp: fullOtp,
        },
        {
          withCredentials: true,
        }
      );

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
      const response = await api.post(
        "/auth/api/password_reset/resend_otp/",
        { email },
        {
          withCredentials: true,
        }
      );

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
    <AuthLayout
      leftTitle="Security Check"
      leftSubtitle="Enter the 6-digit OTP verification code sent to your email to continue."
      badgeText="Identity Verification"
      cardTitle="Verify Your Identity"
      cardSubtitle={`Sent to ${email}`}
    >
      {errorMsg && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <p className="text-xs text-slate-700 text-center font-bold">
          Enter the 6-digit verification code:
        </p>

        {/* 6-digit OTP input boxes */}
        <div className="flex justify-between gap-2 py-1">
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
              className="h-12 w-11 sm:h-14 sm:w-12 text-center text-lg sm:text-xl font-extrabold rounded-xl border-2 border-slate-300 bg-slate-50 text-slate-900 outline-none transition focus:border-[#153f74] focus:bg-white focus:ring-2 focus:ring-[#153f74]/20"
              style={{ backgroundColor: "#f8fafc", color: "#0f172a", borderColor: "#cbd5e1" }}
            />
          ))}
        </div>

        {/* Countdown & Resend */}
        <div
          className="flex items-center justify-between rounded-xl border p-3 text-xs"
          style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
        >
          <span className="text-slate-700 font-medium">
            Resend in:{" "}
            <strong className={timeLeft > 0 ? "text-[#153f74]" : "text-rose-600"}>
              {formatTime(timeLeft)}
            </strong>
          </span>

          <button
            id="resend-otp-btn"
            type="button"
            disabled={timeLeft > 0 || resending}
            onClick={handleResend}
            className="flex items-center gap-1 font-bold text-[#153f74] hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer"
            style={{ color: timeLeft > 0 ? "#153f74" : "#dc2626" }}
          >
            {resending ? (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#153f74] border-t-transparent" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            <span>{resending ? "Sending..." : "Resend OTP"}</span>
          </button>
        </div>

        <button
          id="verify-otp-btn"
          type="submit"
          disabled={loading || otpValues.join("").length !== 6}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#153f74] py-3 text-sm font-bold text-white shadow-md shadow-[#153f74]/20 transition hover:bg-[#0f2e55] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          style={{ backgroundColor: "#153f74", color: "#ffffff" }}
        >
          {loading ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          <span>{loading ? "Verifying..." : "Verify OTP"}</span>
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#153f74] hover:text-[#0f2e55] hover:underline transition"
          style={{ color: "#153f74" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Change Email Address</span>
        </Link>
      </div>
    </AuthLayout>
  );
};

export default VerifyOTP;

