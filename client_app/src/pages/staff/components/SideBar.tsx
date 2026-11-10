import { NavLink } from "react-router"; // Import Link for routing
import "../../placement_officer/components/sidebar.css";
import { Building2, NotebookPen, Send, Verified, FileBarChart2, ChevronRight, ChevronLeft } from "lucide-react";
import { logout, redirectToProfile } from "@/utils";
import { SERVER_URL } from "@/constant";
import Logo from "@/assets/img/logo.png";
import ProfileIcon from "@/assets/img/user_profile_new.png";
import LogoutIcon from "@/assets/img/logout_new.png";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar = ({ isCollapsed = false, onToggle }: SidebarProps) => {
  const handleLogout = async () => {
    await logout();
    window.location.href = `${SERVER_URL}/auth/login/`;
  };

  const sidebarStyle: React.CSSProperties = {
    width: isCollapsed ? "76px" : "20%",
    minWidth: isCollapsed ? "76px" : undefined,
    padding: isCollapsed ? "16px 8px" : "20px",
    transition: "all 0.25s ease",
    overflow: "hidden",
    position: "fixed",
    top: 0,
    left: 0,
    height: "90vh",
    zIndex: 100,
    boxSizing: "border-box",
  };

  return (
    <aside className="sidebar" style={sidebarStyle}>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        style={{
          position: "absolute",
          top: "10px",
          right: isCollapsed ? "8px" : "12px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "#153f74",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px",
          borderRadius: "6px",
          zIndex: 10,
        }}
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <div className="logo-container" style={{ paddingTop: isCollapsed ? "20px" : "8px" }}>
        <img
          src={Logo}
          alt="TCET Logo"
          className="logo"
          style={{
            height: isCollapsed ? "44px" : "80px",
            width: isCollapsed ? "44px" : "auto",
            objectFit: "contain",
            marginBottom: isCollapsed ? "8px" : "10px",
            transition: "all 0.25s ease",
          }}
        />
        {!isCollapsed && <h1 className="title">TCET - TNP</h1>}
      </div>
      <ul className="menu">
        <NavLink
          to=""
          end
          className="menu-item gap-3"
          title="Notice Creation"
          style={{ justifyContent: isCollapsed ? "center" : "flex-start", padding: isCollapsed ? "10px 0" : undefined }}
        >
          <NotebookPen />
          {!isCollapsed && <p>Notice Creation</p>}
        </NavLink>
        <NavLink
          to="placement_companies"
          className="menu-item gap-3"
          title="Placement Companies"
          style={{ justifyContent: isCollapsed ? "center" : "flex-start", padding: isCollapsed ? "10px 0" : undefined }}
        >
          <Building2 />
          {!isCollapsed && <p>Placement Companies</p>}
        </NavLink>
        <NavLink
          to="internship/register"
          className="menu-item gap-3"
          title="InternShip Company Form"
          style={{ justifyContent: isCollapsed ? "center" : "flex-start", padding: isCollapsed ? "10px 0" : undefined }}
        >
          <Building2 />
          {!isCollapsed && <p>InternShip Company Form</p>}
        </NavLink>
        <NavLink
          to="internship/verify"
          className="menu-item gap-3"
          title="Verify Internship"
          style={{ justifyContent: isCollapsed ? "center" : "flex-start", padding: isCollapsed ? "10px 0" : undefined }}
        >
          <Verified />
          {!isCollapsed && <p>Verify Internship</p>}
        </NavLink>
        <NavLink
          to="student-management"
          className="menu-item gap-3"
          title="Student Management"
          style={{ justifyContent: isCollapsed ? "center" : "flex-start", padding: isCollapsed ? "10px 0" : undefined }}
        >
          <Verified />
          {!isCollapsed && <p>Student Management</p>}
        </NavLink>
        <NavLink
          to="batch-categorize"
          className="menu-item gap-3"
          title="Student Category"
          style={{ justifyContent: isCollapsed ? "center" : "flex-start", padding: isCollapsed ? "10px 0" : undefined }}
        >
          <Verified />
          {!isCollapsed && <p>Student Category</p>}
        </NavLink>
        <NavLink
          to="/notifications/create"
          className="menu-item gap-3"
          title="Notification"
          style={{ justifyContent: isCollapsed ? "center" : "flex-start", padding: isCollapsed ? "10px 0" : undefined }}
        >
          <Send />
          {!isCollapsed && <p>Notification</p>}
        </NavLink>
        <NavLink
          to="reports"
          className="menu-item gap-3"
          title="Report"
          style={{ justifyContent: isCollapsed ? "center" : "flex-start", padding: isCollapsed ? "10px 0" : undefined }}
        >
          <FileBarChart2 />
          {!isCollapsed && <p>Report</p>}
        </NavLink>
      </ul>
      <div
        className="bottom-menu"
        style={{
          display: "flex",
          flexDirection: isCollapsed ? "column" : "row",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
          gap: isCollapsed ? "8px" : "0",
          width: "100%",
        }}
      >
        <button
          className="sidebar-action-button profile-icon bg-transparent hover:bg-transparent"
          onClick={redirectToProfile}
          aria-label="Profile"
          style={{
            width: isCollapsed ? "42px" : "60px",
            height: isCollapsed ? "42px" : "60px",
          }}
        >
          <img
            src={ProfileIcon}
            alt="Profile"
            className="sidebar-action-icon"
            style={{
              width: isCollapsed ? "34px" : "52px",
              height: isCollapsed ? "34px" : "52px",
            }}
          />
        </button>
        <button
          className="sidebar-action-button logout-icon bg-transparent hover:bg-transparent"
          onClick={handleLogout}
          aria-label="Logout"
          style={{
            width: isCollapsed ? "42px" : "60px",
            height: isCollapsed ? "42px" : "60px",
          }}
        >
          <img
            src={LogoutIcon}
            alt="Logout"
            className="sidebar-action-icon"
            style={{
              width: isCollapsed ? "34px" : "52px",
              height: isCollapsed ? "34px" : "52px",
            }}
          />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
