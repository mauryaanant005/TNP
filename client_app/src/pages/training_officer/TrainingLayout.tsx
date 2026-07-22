import { useEffect } from "react";
import Sidebar from "./components/sidebar";
import { Box, Typography } from "@mui/material";
import { Outlet, useNavigate } from "react-router";
import { useAtomValue } from "jotai";
import { authAtom } from "@/authAtom";
const TrainingLayout = () => {
  const authUser = useAtomValue(authAtom);
  const navigate = useNavigate();
  useEffect(() => {
    if (!authUser || authUser.role !== "training_officer") {
      navigate("/");
    }
  }, [authUser]);
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        width: "97dvw",
      }}
    >
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "royalblue",
          padding: "2rem",
          overflowY: "auto",
          marginLeft: "26dvw",
          transition: "margin-left 0.3s",
          marginTop: "20px",
          borderRadius: "20px",
          height: "auto", // Remove fixed height
        }}
      >
        <Box
          sx={{
            backgroundColor: "royalblue",
            color: "#fff",
            padding: "1.5rem 3rem",
            borderRadius: "15px",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
            marginBottom: "2rem",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: "bold",
              letterSpacing: "1px",
              textAlign: "center",
              textTransform: "uppercase",
              fontFamily: "'Roboto', sans-serif",
              lineHeight: 1.3,
            }}
          >
            Training Officer
          </Typography>
        </Box>
        <Outlet />
      </Box>
    </Box>
  );
};

export default TrainingLayout;
