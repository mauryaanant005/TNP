import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { Lock, Key, CheckCircle2, AlertCircle, Eye, EyeOff, Check } from "lucide-react";
import { api } from "@/lib/api";
import { SERVER_URL } from "@/constant";
import toast from "react-hot-toast";
import { AuthLayout } from "@/components/AuthLayout";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const resetToken = location.state?.reset_token || "";
  const email = location.state?.email || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!resetToken) {
      navigate("/forgot-password");
    }
  }, [resetToken, navigate]);

  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const meetsAllRequirements = hasMinLength && hasUpper && hasLower && hasNumber;

  const strengthScore = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthProgress = (strengthScore / 5) * 100;

  const getStrengthColor = () => {
    if (strengthScore <= 2) return "bg-rose-500 text-rose-600";
    if (strengthScore <= 4) return "bg-amber-500 text-amber-600";
    return "bg-emerald-500 text-emerald-600";
  };

  const getStrengthLabel = () => {
    if (strengthScore <= 2) return "Weak";
    if (strengthScore <= 4) return "Medium";
    return "Strong";
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (!meetsAllRequirements) {
      setErrorMsg("Please meet all of the password requirements below.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      await api.post(
        "/auth/api/password_reset/confirm/",
        {
          reset_token: resetToken,
          new_password: password,
          confirm_password: confirmPassword,
        },
        {
          withCredentials: true,
        }
      );

      setSuccess(true);
      toast.success("Password reset successfully! Redirecting to login...");

      setTimeout(() => {
        window.location.href = `${SERVER_URL}/auth/login/`;
      }, 2500);
    } catch (err: any) {
      const msg =
        err.response?.data?.error || "Failed to reset password. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        leftTitle="Password Updated!"
        leftSubtitle="Your password has been changed successfully. You can now sign in with your new credentials."
        badgeText="Account Secured"
        cardTitle="Password Updated"
        cardSubtitle="Your account credentials have been securely updated."
      >
        <div className="text-center py-4 space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Your password has been updated. You will be redirected to the login portal shortly.
          </p>

          <button
            onClick={() => {
              window.location.href = `${SERVER_URL}/auth/login/`;
            }}
            className="w-full mt-2 rounded-xl bg-[#153f74] py-3 text-sm font-bold text-white shadow-md shadow-[#153f74]/20 transition hover:bg-[#0f2e55] cursor-pointer"
          >
            Go to Login Now
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      leftTitle="Almost Done!"
      leftSubtitle="Create a strong, secure new password for your TCET portal account."
      badgeText="Secure Password Setup"
      cardTitle="Reset Password"
      cardSubtitle={email ? `Account: ${email}` : "Set your new account password"}
    >
      {errorMsg && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleReset} className="space-y-3.5">
        {/* New Password Input */}
        <div>
          <label
            htmlFor="new-password-input"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            New Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="new-password-input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 transition focus:border-[#153f74] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#153f74]/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Password Strength Meter */}
        {password && (
          <div className="space-y-1 py-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-500">
              <span>Password Strength</span>
              <span className={getStrengthColor().split(" ")[1]}>
                {getStrengthLabel()}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full transition-all duration-300 ${getStrengthColor().split(" ")[0]}`}
                style={{ width: `${strengthProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Confirm Password Input */}
        <div>
          <label
            htmlFor="confirm-password-input"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            Confirm Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Key className="h-4 w-4" />
            </div>
            <input
              id="confirm-password-input"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 transition focus:border-[#153f74] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#153f74]/20"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword && confirmPassword !== password && (
            <p className="mt-1 text-[11px] text-rose-600 font-medium">
              Passwords do not match
            </p>
          )}
        </div>

        {/* Requirements Checklist */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Password Requirements:
          </p>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            <span className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-700 font-semibold" : "text-slate-500"}`}>
              {hasMinLength ? <Check className="h-3 w-3 text-emerald-600" /> : "•"} 8+ characters
            </span>
            <span className={`flex items-center gap-1 ${hasUpper ? "text-emerald-700 font-semibold" : "text-slate-500"}`}>
              {hasUpper ? <Check className="h-3 w-3 text-emerald-600" /> : "•"} 1 Uppercase (A-Z)
            </span>
            <span className={`flex items-center gap-1 ${hasLower ? "text-emerald-700 font-semibold" : "text-slate-500"}`}>
              {hasLower ? <Check className="h-3 w-3 text-emerald-600" /> : "•"} 1 Lowercase (a-z)
            </span>
            <span className={`flex items-center gap-1 ${hasNumber ? "text-emerald-700 font-semibold" : "text-slate-500"}`}>
              {hasNumber ? <Check className="h-3 w-3 text-emerald-600" /> : "•"} 1 Number (0-9)
            </span>
          </div>
        </div>

        <button
          id="reset-confirm-btn"
          type="submit"
          disabled={loading || !meetsAllRequirements || password !== confirmPassword}
          className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#153f74] py-3 text-sm font-bold text-white shadow-md shadow-[#153f74]/20 transition hover:bg-[#0f2e55] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          <span>{loading ? "Resetting Password..." : "Reset Password"}</span>
        </button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;

