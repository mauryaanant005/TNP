import React from "react";
import DutyChart from "./components/DutyChart/DutyChart";

const DutyChartPage: React.FC = () => {
  return (
    <div style={{ backgroundColor: "#f0f4f8", minHeight: "100vh", padding: "16px 0" }}>
      <DutyChart />
    </div>
  );
};

export default DutyChartPage;
