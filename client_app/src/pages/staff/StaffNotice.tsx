import React from "react";
import InternshipNotice from "../internship_officer/InternShipNotice";
import TrainingNotice from "../training_officer/TrainingNotice";
import InfrastructureBooking from "./components/Infrastructure/InfraNotice";
import DutyChart from "./components/DutyChart/DutyChart";
import PlacementNotice from "./components/PlacementNotice";

type NoticeTab = "placement" | "internship" | "training" | "Infrastructure" | "Duty Chart";

const TABS: { key: NoticeTab; label: string }[] = [
  { key: "placement", label: "Placement" },
  { key: "internship", label: "Internship" },
  { key: "training", label: "Training" },
  { key: "Infrastructure", label: "Infrastructure" },
  { key: "Duty Chart", label: "Duty Chart" },
];

const StaffNotice = () => {
  const [activeTab, setActiveTab] = React.useState<NoticeTab>("placement");

  return (
    <div
      style={{
        backgroundColor: "#f0f4f8",
        minHeight: "100vh",
        padding: "24px 16px",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: 700,
            color: "#1a2844",
          }}
        >
          Notice Management
        </h1>
        <p style={{ margin: "4px 0 0", color: "#6b7a99", fontSize: "14px" }}>
          Create and manage placement, internship, training, and other notices.
        </p>
      </div>

      {/* White card container */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            padding: "12px 16px 0",
            borderBottom: "1px solid #e8ecf4",
            backgroundColor: "#fafbfd",
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px 10px 0 0",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                  color: isActive ? "#2563eb" : "#6b7a99",
                  background: isActive ? "#ffffff" : "transparent",
                  boxShadow: isActive
                    ? "0 -2px 0 #2563eb inset, 0 2px 8px rgba(37,99,235,0.08)"
                    : "none",
                  borderBottom: isActive ? "2px solid #2563eb" : "2px solid transparent",
                  outline: "none",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                }}
                aria-selected={isActive}
                role="tab"
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ padding: "0" }}>
          {activeTab === "placement" && <PlacementNotice />}
          {activeTab === "internship" && <InternshipNotice />}
          {activeTab === "training" && <TrainingNotice />}
          {activeTab === "Infrastructure" && <InfrastructureBooking />}
          {activeTab === "Duty Chart" && <DutyChart />}
        </div>
      </div>
    </div>
  );
};

export default StaffNotice;
