import React, { useState } from "react";
import { useNavigate } from "react-router";
import { KeyRound, ArrowLeft, Mail, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { SERVER_URL } from "@/constant";
import toast from "react-hot-toast";
import { AuthLayout } from "@/components/AuthLayout";

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
      const response = await api.post(
        "/auth/api/password_reset/request/",
        { email },
        {
          withCredentials: true,
        }
      );

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
      const msg =
        err.response?.data?.error || "Failed to send reset code. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      leftTitle="No worries!"
      leftSubtitle="Enter your registered email and we will send you a verification code."
      badgeText="Secure Password Recovery"
      cardTitle="Forgot Password"
      cardSubtitle="Enter your registered email address below. We will send a 6-digit OTP code to verify your identity."
    >
      {errorMsg && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email-input"
            className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@tcetmumbai.in"
              required
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder-slate-500 transition focus:border-[#153f74] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#153f74]/20 disabled:bg-slate-100"
              style={{ backgroundColor: "#f8fafc", color: "#0f172a", borderColor: "#cbd5e1" }}
            />
          </div>
        </div>

        <button
          id="send-otp-btn"
          type="submit"
          disabled={loading}
          className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#153f74] py-3 text-sm font-bold text-white shadow-md shadow-[#153f74]/20 transition hover:bg-[#0f2e55] active:scale-[0.99] disabled:opacity-70 cursor-pointer"
          style={{ backgroundColor: "#153f74", color: "#ffffff" }}
        >
          {loading ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          <span>{loading ? "Sending OTP..." : "Send Verification Code"}</span>
        </button>
      </form>

      <div className="mt-6 text-center">
        <a
          href={`${SERVER_URL}/auth/login/`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#153f74] hover:text-[#0f2e55] hover:underline transition"
          style={{ color: "#153f74" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Login</span>
        </a>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;

