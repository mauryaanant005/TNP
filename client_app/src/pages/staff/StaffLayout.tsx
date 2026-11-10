import { useEffect, useState } from "react";
import Sidebar from "./components/SideBar";
import { Typography } from "@mui/material";
import "../placement_officer/placement.css";
import { Outlet, useNavigate, useLocation } from "react-router";
import { useAtomValue } from "jotai";
import { authAtom } from "@/authAtom";
import { roleIsAllowed, ROLE_GROUPS } from "@/lib/roles";

const StaffLayout = () => {
  const authUser = useAtomValue(authAtom);
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!authUser || !roleIsAllowed(authUser.role, ROLE_GROUPS.PLACEMENT_DRIVE)) {
      navigate("/");
    }
  }, [authUser, navigate]);

  // Auto-collapse sidebar when on the index /staff route (notice creation page)
  useEffect(() => {
    if (location.pathname === "/staff" || location.pathname === "/staff/") {
      setIsSidebarCollapsed(true);
    } else {
      setIsSidebarCollapsed(false);
    }
  }, [location.pathname]);

  const sidebarMargin = isSidebarCollapsed ? "95px" : "22%";

  return (
    <div className="ribbon">
      <div
        className="app"
        style={{
          marginLeft: sidebarMargin,
          width: isSidebarCollapsed ? "calc(100vw - 110px)" : "auto",
          transition: "margin-left 0.25s ease, width 0.25s ease",
        }}
      >
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        />
        <main
          className="main-content1"
          style={{
            width: isSidebarCollapsed ? "100%" : "70dvw",
            maxWidth: isSidebarCollapsed ? "100%" : undefined,
            margin: isSidebarCollapsed ? "20px 10px 20px 0" : "20px",
            transition: "all 0.25s ease",
          }}
        >
          <Typography variant="h3" gutterBottom>
            <u>Staff</u>
          </Typography>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;
