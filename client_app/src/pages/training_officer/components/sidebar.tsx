import React from "react";
import { Link } from "react-router";
import { Box, Typography, IconButton } from "@mui/material";
import { styled } from "@mui/system";
import { logout, redirectToProfile } from "@/utils";
import LogoIcon from "@/assets/img/logo.png";
import UserProfileIcon from "@/assets/img/user_profile.png";
import UserLogoutIcon from "@/assets/img/logout.png";
import { Send } from "lucide-react";
import ImageIcon from "@/assets/img/image.png";
import StudentIcon from "@/assets/img/student.png";
const Sidebar = () => {
  return (
    <SidebarContainer>
      <LogoContainer>
        <Logo src={LogoIcon} alt="TCET Logo" />
        <Typography variant="h6" className="title">
          TCET - TNP
        </Typography>
      </LogoContainer>

      <Menu>
        <MenuItem
          to="/training_officer"
          label="Training Statistics"
          icon={StudentIcon}
        />
        <MenuItem to="notice" label="Notice Generation" icon={ImageIcon} />
        <MenuItem
          to="/notifications/create"
          label="Notification"
          icon={<Send />}
        />
      </Menu>

      <BottomMenu>
        <IconButton component={Link} to="/profile" onClick={redirectToProfile}>
          <ProfileIcon src={UserProfileIcon} alt="Profile" />
        </IconButton>
        <IconButton component={Link} to="/logout">
          <LogoutIcon src={UserLogoutIcon} alt="Logout" onClick={logout} />
        </IconButton>
      </BottomMenu>
    </SidebarContainer>
  );
};

// Styled components using Material-UI's `styled` API
const SidebarContainer = styled(Box)(() => ({
  width: "20%",
  backgroundColor: "white",
  color: "#153f74",
  padding: "20px",
  borderRadius: "24px",
  margin: "20px",
  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  position: "fixed",
  top: 0,
  left: 0,
  height: "96vh",
  border: "#000000",
}));

const LogoContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

const Logo = styled("img")({
  height: "80px",
  marginBottom: "10px",
});

const Menu = styled(Box)({
  listStyle: "none",
  padding: 0,
  margin: 0,
});

const MenuItemLink = styled(Link)(() => ({
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  marginBottom: "40px",
  color: "#153f74",
  fontSize: "1rem",
  transition: "color 0.3s ease",
  "&:hover": {
    color: "#1b4d96",
  },
}));

interface MenuItemProps {
  to: string;
  label: string;
  icon: string | React.ReactElement;
}

const MenuItem: React.FC<MenuItemProps> = ({ to, label, icon }) => (
  <MenuItemLink to={to}>
    {typeof icon === "string" ? (
      <img
        src={icon}
        alt={label}
        className="menu-icon"
        style={{ height: "1.5rem", marginRight: "10px" }}
      />
    ) : (
      <span style={{ marginRight: "10px" }}>{icon}</span>
    )}
    <Typography>{label}</Typography>
  </MenuItemLink>
);

const BottomMenu = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
});

const ProfileIcon = styled("img")({
  width: "50px",
  borderRadius: "12px",
  cursor: "pointer",
  "&:hover": {
    boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.2)",
  },
});

const LogoutIcon = styled("img")({
  width: "50px",
  borderRadius: "12px",
  cursor: "pointer",
  "&:hover": {
    boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.2)",
  },
});

export default Sidebar;
