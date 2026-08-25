import React from "react";
import { Loader2, RefreshCw, LogIn, AlertCircle } from "lucide-react";
import Logo from "@/assets/tcet_logo_2.png";
import { SERVER_URL } from "@/constant";

interface GlobalBootScreenProps {
  message?: string;
  subMessage?: string;
  error?: string | null;
  onRetry?: () => void;
}

export const GlobalBootScreen: React.FC<GlobalBootScreenProps> = ({
  message = "Verifying session & loading dashboard...",
  subMessage = "Thakur College of Engineering & Technology",
  error = null,
  onRetry,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4 font-sans text-slate-800">
      <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50 text-center transition-all">
        {/* TCET Header / Emblem */}
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-white p-2 shadow-md border border-slate-100">
          <img
            src={Logo}
            alt="TCET Logo"
            className="h-full w-full object-contain"
            onError={(e) => {
              // Fallback to root public icon if needed
              (e.target as HTMLImageElement).src = "/tcet-logo.png";
            }}
          />
          {!error && (
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#153f74] text-white ring-4 ring-white">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-[#153f74] tracking-tight sm:text-2xl">
          T&amp;P Automation Portal
        </h1>
        <p className="mt-1 text-xs font-medium text-slate-500 uppercase tracking-wider">
          {subMessage}
        </p>

        <div className="my-6 h-px w-3/4 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {error ? (
          <div className="w-full space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-left text-sm text-rose-800">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div className="flex-1">
                <p className="font-semibold">Unable to connect to portal</p>
                <p className="mt-0.5 text-xs text-rose-700">{error}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#153f74] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#153f74]/90 active:scale-[0.98]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              )}
              <a
                href={`${SERVER_URL}/auth/login/`}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
              >
                <LogIn className="h-4 w-4" />
                Go to Login
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-[#153f74]" />
              <span className="text-sm font-medium text-slate-700">{message}</span>
            </div>
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-1/2 animate-[shimmer_1.5s_infinite] rounded-full bg-[#153f74]" />
            </div>
          </div>
        )}

        <div className="mt-8 text-[11px] text-slate-400">
          Training &amp; Placement Cell &bull; TCET Mumbai
        </div>
      </div>
    </div>
  );
};

export default GlobalBootScreen;
