import { useEffect } from "react";
import Sidebar from "./components/SideBar";
import { Typography, Button, Box } from "@mui/material";
import { ArrowLeft, ArrowRight } from "lucide-react";
import "../placement_officer/placement.css";
import { Outlet, useNavigate } from "react-router";
import { useAtomValue } from "jotai";
import { authAtom } from "@/authAtom";

const PlacementLayout = () => {
  const authUser = useAtomValue(authAtom);
  const navigate = useNavigate();
  useEffect(() => {
    if (!authUser || authUser.role !== "faculty" || !authUser.department) {
      navigate("/");
    }
  }, []);
  return (
    <div className="ribbon">
      <div className="app">
        <Sidebar />
        <main className="main-content1">
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/faculty_coordinator")}
              startIcon={<ArrowLeft size={16} />}
              sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 600 }}
            >
              Session Attendance
            </Button>
            {authUser?.program && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate("/program_coordinator")}
                endIcon={<ArrowRight size={16} />}
                sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 600 }}
              >
                Program Portal
              </Button>
            )}
          </Box>
          <Typography variant="h3" gutterBottom>
            <u>Department Coordinator</u>
          </Typography>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PlacementLayout;
