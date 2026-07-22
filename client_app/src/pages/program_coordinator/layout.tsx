import { Box, Typography } from "@mui/material";
import Sidebar from "./components/sidebar";
import { useAtomValue } from "jotai";
import { authAtom } from "@/authAtom";
import { Outlet, useNavigate } from "react-router";
import { useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ProgramCoordinatorLayout = () => {
  const authUser = useAtomValue(authAtom);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authUser || authUser.role !== "faculty" || !authUser.program) {
      navigate("/");
    }
  }, [authUser, navigate]);

  return (
    <div>
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "#f5f7fa"
        }}
      >
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            padding: { xs: "1rem", sm: "1.5rem", md: "2rem" },
            marginLeft: { xs: 0, md: "330px" },
            transition: "margin-left 0.3s ease-in-out",
            width: "100%",
            maxWidth: "100%",
            overflowX: "hidden"
          }}
        >
          {/* Header Card */}
          <Box
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              padding: { xs: "1.5rem 2rem", md: "2rem 3rem" },
              borderRadius: "16px",
              boxShadow: "0 10px 30px rgba(102, 126, 234, 0.3)",
              marginBottom: "2.5rem",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                right: 0,
                width: "200px",
                height: "200px",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "50%",
                transform: "translate(50%, -50%)",
              }
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                letterSpacing: "0.5px",
                textAlign: "center",
                fontFamily: "'Inter', 'Roboto', sans-serif",
                fontSize: { xs: "1.75rem", md: "2.5rem" },
                position: "relative",
                zIndex: 1
              }}
            >
              Program Coordinator
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                textAlign: "center",
                marginTop: "0.5rem",
                opacity: 0.9,
                fontSize: { xs: "0.875rem", md: "1rem" },
                position: "relative",
                zIndex: 1
              }}
            >
              Manage and oversee program activities
            </Typography>
          </Box>

          {/* Content Area */}
          <Box
            sx={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: { xs: "1.5rem", md: "2rem" },
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              minHeight: "400px"
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default ProgramCoordinatorLayout;