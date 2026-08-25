import React from "react";
import Logo from "@/assets/tcet_logo_2.png";
import CampusBg from "@/assets/tcetcampus.png";
import { ShieldCheck } from "lucide-react";

interface AuthLayoutProps {
  leftTitle?: string;
  leftSubtitle?: string;
  badgeText?: string;
  cardTitle: string;
  cardSubtitle?: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  leftTitle = "Welcome Back!",
  leftSubtitle = "Sign in to continue to\nTCET Training & Placement Portal",
  badgeText = "Your Placement Journey Starts Here",
  cardTitle,
  cardSubtitle,
  children,
}) => {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-x-hidden font-sans select-none">
      {/* 1. TCET Campus Background Image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{
          backgroundImage: `url(${CampusBg})`,
        }}
      />

      {/* 2. Professional Navy Vignette & Daylight Overlay */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(21, 63, 116, 0.18) 40%, rgba(10, 30, 60, 0.72) 100%)",
        }}
      />

      {/* 3. Main Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex flex-col justify-between">
        {/* Top spacer */}
        <div className="h-4 sm:h-8" />

        {/* Center Split Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto">
          {/* Left Column: Campus Branding (Visible on large screens, simplified on tablet/mobile) */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center text-left py-4 sm:py-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight drop-shadow-sm leading-tight">
              {leftTitle}
            </h1>

            <p className="mt-3 sm:mt-4 text-base sm:text-lg lg:text-xl font-medium text-slate-800/90 max-w-lg leading-relaxed whitespace-pre-line drop-shadow-sm">
              {leftSubtitle}
            </p>

            {badgeText && (
              <div className="mt-6 sm:mt-8 inline-flex items-center gap-3.5 px-5 py-3 rounded-2xl bg-white/80 backdrop-blur-md border border-white/60 shadow-lg shadow-slate-900/5 max-w-fit">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#153f74] text-white shadow-inner">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide">
                  {badgeText}
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-slate-900/20 border border-white/80 transition-all duration-300">
              {/* Card TCET Crest Logo */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="h-16 w-16 mb-2 flex items-center justify-center">
                  <img
                    src={Logo}
                    alt="TCET Crest Logo"
                    className="h-full w-full object-contain filter drop-shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/tcet-logo.png";
                    }}
                  />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#153f74] tracking-tight">
                  {cardTitle}
                </h2>
                {cardSubtitle && (
                  <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-xs leading-relaxed">
                    {cardSubtitle}
                  </p>
                )}
              </div>

              {/* Form content */}
              {children}
            </div>
          </div>
        </div>

        {/* Bottom Attribution */}
        <div className="py-4 text-xs sm:text-sm font-semibold text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] text-center lg:text-left">
          Thakur College of Engineering &amp; Technology
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
