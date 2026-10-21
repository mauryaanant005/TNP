import { NavLink } from "react-router";
import "./sidebar.css";
import { ClipboardList } from "lucide-react";
import { logout, redirectToProfile } from "@/utils";
import Logo from "@/assets/img/logo.png";
import ProfileIcon from "@/assets/img/user_profile_new.png";
import LogoutIcon from "@/assets/img/logout_new.png";
const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="logo-container">
        <img src={Logo} alt="TCET Logo" className="logo" />
        <h1 className="title">TCET - TNP</h1>
      </div>
      <ul className="menu">
        <NavLink to="" end className="menu-item">
          <p>Placement Statistics</p>
        </NavLink>
        <NavLink to="duty-chart" className="menu-item gap-3">
          <ClipboardList size={20} />
          <p>Duty Chart</p>
        </NavLink>
        <NavLink to="placement-consolidated-report" className="menu-item">
          <p>Consolidated Report</p>
        </NavLink>
        <NavLink to="branch-wise-report" className="menu-item">
          <p>Branch-wise Report</p>
        </NavLink>
        <NavLink to="student-performance" className="menu-item">
          <p>Student Performance</p>
        </NavLink>
        <NavLink to="upload-historical-data" className="menu-item">
          <p>Import Historical Data</p>
        </NavLink>
        <NavLink to="/notifications/create" className="menu-item gap-3">
          <p>Notification</p>
        </NavLink>
      </ul>
      <div className="bottom-menu">
        <button
          className="sidebar-action-button profile-icon bg-transparent hover:bg-transparent"
          onClick={redirectToProfile}
          aria-label="Profile"
        >
          <img src={ProfileIcon} alt="Profile" className="sidebar-action-icon" />
        </button>
        <button
          className="sidebar-action-button logout-icon bg-transparent hover:bg-transparent"
          onClick={logout}
          aria-label="Logout"
        >
          <img src={LogoutIcon} alt="Logout" className="sidebar-action-icon" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
