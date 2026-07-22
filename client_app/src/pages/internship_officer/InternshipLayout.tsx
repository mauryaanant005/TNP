import { useEffect } from "react";
import Sidebar from "./components/sidebar";
import { Typography } from "@mui/material";
import "../placement_officer/placement.css";
import { Outlet, useNavigate } from "react-router";
import { useAtomValue } from "jotai";
import { authAtom } from "@/authAtom";
const InternshipLayout = () => {
  const authUser = useAtomValue(authAtom);
  const navigate = useNavigate();
  useEffect(() => {
    if (!authUser || authUser.role !== "internship_officer") {
      navigate("/");
    }
  }, []);
  return (
    <div className="ribbon">
      <div className="app">
        <Sidebar />
        <main className="main-content1">
          <Typography variant="h3" gutterBottom>
            <u>Internship Coordinator</u>
          </Typography>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default InternshipLayout;
