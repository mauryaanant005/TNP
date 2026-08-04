import React from "react";
import { Link, useLocation } from "react-router";
import { Box, Typography, IconButton, Divider } from "@mui/material";
import { styled } from "@mui/material/styles";
import { MessageCircle, Users, BarChart3, Calendar, Upload, AlertCircle} from "lucide-react";
import { logout, redirectToProfile } from "@/utils";
import { SERVER_URL } from "@/constant";
import LogoIcon from "@/assets/img/logo.png";
import ProfileUserIcon from "@/assets/img/user_profile.png";
import LogoutUserIcon from "@/assets/img/logout.png";

const Sidebar = () => {
  const handleLogout = async () => {
    await logout();
    window.location.href = `${SERVER_URL}/auth/login/`;
  };

  const location = useLocation();

  const menuItems = [
    {
      to: "/program_coordinator/",
      label: "Student Data",
      icon: <Users size={20} />,
    },
    {
      to: "/program_coordinator/attendance-and-marks",
      label: "Attendance & Marks",
      icon: <BarChart3 size={20} />,
    },
    {
      to: "/program_coordinator/session-creation",
      label: "Session Creation",
      icon: <Calendar size={20} />,
    },
    {
      to: "performance-upload",
      label: "Training Performance",
      icon: <Upload size={20} />,
    },
    {
      to: "/program_coordinator/update-attendance",
      label: "Grievance",
      icon: <AlertCircle size={20} />,
    },
    {
      to: "/notifications/create",
      label: "Create Notification",
      icon: <MessageCircle size={20} />,
    },
  ];

  return (
    <SidebarContainer>
      <Box sx={{ overflowY: "auto", flex: 1, "&::-webkit-scrollbar": { width: "6px" }, "&::-webkit-scrollbar-thumb": { backgroundColor: "#e0e0e0", borderRadius: "3px" } }}>
        <LogoContainer>
          <Logo src={LogoIcon} alt="TCET Logo" />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#153f74",
              marginTop: "8px",
              fontSize: "1.1rem",
              letterSpacing: "0.5px"
            }}
          >
            TCET - TNP
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#64748b",
              marginTop: "4px",
              fontSize: "0.75rem"
            }}
          >
            Program Coordinator
          </Typography>
        </LogoContainer>

        <Divider sx={{ margin: "24px 0", opacity: 0.6 }} />

        <Menu>
          {menuItems.map((item) => (
            <MenuItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              isActive={location.pathname === item.to}
            />
          ))}
        </Menu>
      </Box>

      <Box>
        <Divider sx={{ marginBottom: "16px", opacity: 0.6 }} />
        <BottomMenu>
          <ActionButton

            component={Link}
            to="/profile"
            onClick={redirectToProfile}
            title="Profile"
          >
            <ProfileIcon src={ProfileUserIcon} alt="Profile" />
          </ActionButton>
          <ActionButton
            component={Link}
            to="/logout"
            onClick={handleLogout}
            title="Logout"
          >
            <LogoutIcon src={LogoutUserIcon} alt="Logout" />
          </ActionButton>
        </BottomMenu>
      </Box>
    </SidebarContainer>
  );
};

// Styled components
const SidebarContainer = styled(Box)(() => ({
  width: "280px",
  backgroundColor: "#ffffff",
  padding: "24px 16px",
  borderRadius: "0",
  boxShadow: "2px 0 12px rgba(0, 0, 0, 0.08)",
  display: "flex",
  flexDirection: "column",
  position: "fixed",
  top: 0,
  left: 0,
  height: "100vh",
  zIndex: 1200,
  borderRight: "1px solid #e5e7eb",
}));

const LogoContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  paddingTop: "8px",
});

const Logo = styled("img")({
  height: "70px",
  objectFit: "contain",
});

const Menu = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "4px",
});

const MenuItemLink = styled(Link, {
  shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive?: boolean }>(({ isActive }) => ({
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  padding: "12px 16px",
  color: isActive ? "#667eea" : "#64748b",
  fontSize: "0.9rem",
  fontWeight: isActive ? 600 : 500,
  borderRadius: "12px",
  transition: "all 0.2s ease",
  backgroundColor: isActive ? "#f0f4ff" : "transparent",
  position: "relative",
  "&:hover": {
    backgroundColor: isActive ? "#f0f4ff" : "#f8fafc",
    color: isActive ? "#667eea" : "#153f74",
    transform: "translateX(4px)",
  },
  "&::before": {
    content: '""',
    position: "absolute",
    left: 0,
    top: "50%",
    transform: "translateY(-50%)",
    width: "3px",
    height: isActive ? "60%" : "0%",
    backgroundColor: "#667eea",
    borderRadius: "0 3px 3px 0",
    transition: "height 0.2s ease",
  },
}));

const MenuItem = ({
  to,
  label,
  icon,
  isActive,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
}) => {
  return (
    <MenuItemLink to={to} isActive={isActive}>
      <Box sx={{
        marginRight: "12px",
        display: "flex",
        alignItems: "center",
        color: "inherit"
      }}>
        {icon}
      </Box>
      <Typography sx={{
        fontSize: "0.9rem",
        fontWeight: "inherit",
        color: "inherit"
      }}>
        {label}
      </Typography>
    </MenuItemLink>
  );
};

const BottomMenu = styled(Box)({
  display: "flex",
  justifyContent: "space-around",
  gap: "12px",
  padding: "8px 0",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ActionButton = styled(IconButton)<any>({
  padding: "8px",
  borderRadius: "12px",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "#f8fafc",
    transform: "scale(1.05)",
  },
});

const ProfileIcon = styled("img")({
  width: "40px",
  height: "40px",
  borderRadius: "10px",
  objectFit: "cover",
  transition: "all 0.2s ease",
});

const LogoutIcon = styled("img")({
  width: "40px",
  height: "40px",
  borderRadius: "10px",
  objectFit: "cover",
  transition: "all 0.2s ease",
});

export default Sidebar;