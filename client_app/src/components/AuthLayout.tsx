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
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-x-hidden font-sans select-none bg-[#0c1e38]">
      {/* 1. TCET Campus Background Image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-left sm:bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${CampusBg})`,
          imageRendering: "crisp-edges",
        }}
      />

      {/* 2. Professional Navy Scrim for 100% Left Text Legibility */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(90deg, rgba(10, 25, 50, 0.90) 0%, rgba(15, 40, 75, 0.75) 45%, rgba(10, 28, 55, 0.45) 70%, rgba(10, 25, 50, 0.70) 100%),
            linear-gradient(180deg, rgba(10, 25, 50, 0.30) 0%, rgba(15, 35, 65, 0.15) 50%, rgba(8, 20, 40, 0.80) 100%)
          `,
        }}
      />

      {/* 3. Main Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex flex-col justify-between">
        {/* Top spacer */}
        <div className="h-4 sm:h-6" />

        {/* Center Split Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto w-full">
          {/* Left Column: Campus Branding (Visible on desktop & tablet) */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center text-left py-4">
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight"
              style={{
                textShadow: "0 3px 12px rgba(0, 0, 0, 0.8), 0 1px 3px rgba(0, 0, 0, 0.9)",
              }}
            >
              {leftTitle}
            </h1>

            <p
              className="mt-3 sm:mt-4 text-base sm:text-lg lg:text-xl font-medium text-slate-100 max-w-lg leading-relaxed whitespace-pre-line"
              style={{
                textShadow: "0 2px 8px rgba(0, 0, 0, 0.8)",
              }}
            >
              {leftSubtitle}
            </p>

            {badgeText && (
              <div
                className="mt-6 sm:mt-8 inline-flex items-center gap-3.5 px-5 py-3 rounded-2xl border max-w-fit"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderColor: "rgba(255, 255, 255, 1)",
                  boxShadow: "0 12px 30px -5px rgba(0, 0, 0, 0.4)",
                }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#153f74] text-white shadow-md">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide">
                  {badgeText}
                </span>
              </div>
            )}
          </div>

          {/* Right Column: SOLID OPAQUE WHITE Authentication Card */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end">
            <div
              className="w-full max-w-md rounded-3xl p-6 sm:p-8 border transition-all duration-300"
              style={{
                backgroundColor: "#ffffff",
                borderColor: "#e2e8f0",
                boxShadow: "0 25px 60px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.8)",
              }}
            >
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
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-xs leading-relaxed">
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
        <div
          className="py-4 text-xs sm:text-sm font-semibold text-white text-center lg:text-left"
          style={{ textShadow: "0 2px 6px rgba(0, 0, 0, 0.9)" }}
        >
          Thakur College of Engineering &amp; Technology
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
