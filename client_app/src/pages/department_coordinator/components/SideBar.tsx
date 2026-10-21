import { NavLink } from "react-router"; // Import Link for routing
import "../../placement_officer/components/sidebar.css";
import { logout, redirectToProfile } from "@/utils";
import { useAtomValue } from "jotai";
import { authAtom } from "@/authAtom";
import Logo from "@/assets/img/logo.png";
import ProfileIcon from "@/assets/img/user_profile_new.png";
import LogoutIcon from "@/assets/img/logout_new.png";

const Sidebar = () => {
  const auth = useAtomValue(authAtom);
  return (
    <aside className="sidebar">
      <div className="logo-container">
        <img src={Logo} alt="TCET Logo" className="logo" />
        <h1 className="title">TCET - TNP</h1>
      </div>
      <ul className="menu">
        <NavLink to="/faculty_coordinator" className="menu-item" style={{ color: "#0f766e" }}>
          <p>← Session Attendance</p>
        </NavLink>
        {auth?.program && (
          <NavLink to="/program_coordinator" className="menu-item" style={{ color: "#4338ca" }}>
            <p>Program Portal</p>
          </NavLink>
        )}
        <hr style={{ margin: "8px 0", borderColor: "#e2e8f0" }} />
        <NavLink to="/department_coordinator" end className="menu-item">
          <p>Students Data</p>
        </NavLink>
        <NavLink to="attendance" className="menu-item">
          <p>Attendance and Marks</p>
        </NavLink>
         <NavLink to="upload-inhouse-internship" className="menu-item gap-3">
          <p>Upload Inhouse Internship Data</p>
        </NavLink>
        <NavLink to="department_stats" className="menu-item">
          <p>Dashboard Summary</p>
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
