import React from "react";
import InternshipNotice from "../internship_officer/InternShipNotice";
import TrainingNotice from "../training_officer/TrainingNotice";
import InfrastructureBooking from "./components/Infrastructure/InfraNotice";
import DutyChart from "./components/DutyChart/DutyChart";
const StaffNotice = () => {
  const [noticeType, setNoticeType] = React.useState("internship");
  const noticeTypes = [
    "internship",
    "training",
    "Infrastructure",
    "Duty Chart",
  ];
  return (
    <div>
      {noticeTypes.map((type) => {
        return (
          <button
            onClick={() => setNoticeType(type)}
            className="border-white border-[2px] bg-orange-500"
            key={type}
          >
            {type}
          </button>
        );
      })}
      {noticeType === "internship" && <InternshipNotice />}
      {noticeType === "training" && <TrainingNotice />}
      {noticeType === "Infrastructure" && <InfrastructureBooking />}
      {noticeType === "Duty Chart" && <DutyChart />}
    </div>
  );
};

export default StaffNotice;
