import { useEffect } from "react";
import Sidebar from "./components/SideBar";
import { Typography } from "@mui/material";
import "../placement_officer/placement.css";
import { Outlet, useNavigate } from "react-router";
import { useAtomValue } from "jotai";
import { authAtom } from "@/authAtom";
import { roleIsAllowed, ROLE_GROUPS } from "@/lib/roles";
const StaffLayout = () => {
  const authUser = useAtomValue(authAtom);
  const navigate = useNavigate();
  useEffect(() => {
    if (!authUser || !roleIsAllowed(authUser.role, ROLE_GROUPS.PLACEMENT_DRIVE)) {
      navigate("/");
    }
  }, [authUser, navigate]);
  return (
    <div className="ribbon">
      <div className="app">
        <Sidebar />
        <main className="main-content1">
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
