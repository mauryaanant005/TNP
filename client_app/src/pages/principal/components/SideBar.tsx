import { NavLink } from "react-router"; // Import Link for routing
import "../../placement_officer/components/sidebar.css";
import { Building2, NotebookPen, Send } from "lucide-react";
import { logout, redirectToProfile } from "@/utils";
import Logo from "@/assets/img/logo.png";
import ProfileIcon from "@/assets/img/user_profile_new.png";
import LogoutIcon from "@/assets/img/logout_new.png";
import Stats from "@/assets/img/Placement_statics.png";
const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="logo-container">
        <img src={Logo} alt="TCET Logo" className="logo" />
        <h1 className="title">TCET - TNP</h1>
      </div>
      <ul className="menu">
        <NavLink to="" end className="menu-item">
          <img src={Stats} alt="Placement Statistics" className="menu-icon" />
          <p>Training</p>
        </NavLink>
        <NavLink to="placement" className="menu-item gap-3">
          <NotebookPen />
          <p>Placement</p>
        </NavLink>
        <NavLink to="internship" className="menu-item gap-3">
          <Building2 />
          <p>Internship</p>
        </NavLink>
        <NavLink to="/notifications/create" className="menu-item gap-3">
          <Send />
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
