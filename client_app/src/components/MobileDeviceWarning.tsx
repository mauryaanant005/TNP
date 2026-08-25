import React, { useState, useEffect } from "react";
import { Monitor, Smartphone, ChevronDown, ChevronUp, X, CheckCircle2 } from "lucide-react";
import { useDeviceDetect } from "@/hooks/useDeviceDetect";

const SESSION_STORAGE_KEY = "tcet_mobile_notice_seen";

export const MobileDeviceWarning: React.FC = () => {
  const { isMobile, os } = useDeviceDetect();
  const [isOpen, setIsOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Only show if on mobile and user hasn't dismissed it this session
    if (isMobile) {
      const hasSeen = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!hasSeen) {
        setIsOpen(true);
      }
    }
  }, [isMobile]);

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
    setIsOpen(false);
  };

  if (!isOpen || !isMobile) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in slide-in-from-bottom-6 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-notice-title"
      >
        {/* Top brand accent */}
        <div className="h-1.5 w-full bg-[#153f74]" />

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#153f74] border border-blue-100">
                <Monitor className="h-6 w-6" />
              </div>
              <div>
                <h2 id="mobile-notice-title" className="text-base font-bold text-slate-900 leading-tight">
                  Best Experience on Desktop
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">TCET T&amp;P Automation Portal</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss notice"
              className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Description */}
          <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            This portal is designed for desktop and laptop screens with detailed placement data tables, analytics charts, student rosters, and Excel workflows.
          </p>

          {/* Tips Box */}
          <div className="mt-3.5 rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-700 space-y-2">
            <div className="flex items-center justify-between font-semibold text-slate-900">
              <span className="flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-[#153f74]" />
                Using a phone? Enable Desktop Mode:
              </span>
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-[#153f74] hover:underline flex items-center gap-0.5 text-xs font-medium"
              >
                {showInstructions ? "Hide Guide" : "View Guide"}
                {showInstructions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            {showInstructions && (
              <div className="pt-2 border-t border-slate-200/70 space-y-2.5 text-slate-600">
                {/* Android / Chrome */}
                <div className={`p-2 rounded-lg ${os === "android" ? "bg-blue-50/70 border border-blue-200/60" : "bg-white"}`}>
                  <div className="font-semibold text-slate-800 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#153f74]" />
                    Android (Chrome / Edge / Firefox):
                  </div>
                  <p className="text-[11px] mt-0.5 text-slate-600 pl-4">
                    Tap the menu (<strong>⋮</strong> in top-right) &rarr; check <strong>Desktop site</strong>.
                  </p>
                </div>

                {/* iOS / Safari */}
                <div className={`p-2 rounded-lg ${os === "ios" ? "bg-blue-50/70 border border-blue-200/60" : "bg-white"}`}>
                  <div className="font-semibold text-slate-800 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#153f74]" />
                    iPhone / iPad (Safari):
                  </div>
                  <p className="text-[11px] mt-0.5 text-slate-600 pl-4">
                    Tap <strong>aA</strong> in the address bar &rarr; tap <strong>Request Desktop Website</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#153f74] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#153f74]/90 active:scale-[0.98] transition"
            >
              Continue on Mobile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDeviceWarning;
