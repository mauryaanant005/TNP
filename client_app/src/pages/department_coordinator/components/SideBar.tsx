import { NavLink } from "react-router"; // Import Link for routing
import "../../placement_officer/components/sidebar.css";
import { logout, redirectToProfile } from "@/utils";
import Logo from "@/assets/img/logo.png";
import ProfileIcon from "@/assets/img/user_profile.png";
import LogoutIcon from "@/assets/img/logout.png";
const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="logo-container">
        <img src={Logo} alt="TCET Logo" className="logo" />
        <h1 className="title">TCET - TNP</h1>
      </div>
      <ul className="menu">
        <NavLink to="/department_coordinator" className="menu-item">
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
          className="profile-icon bg-transparent hover:bg-transparent"
          onClick={redirectToProfile}
        >
          <img src={ProfileIcon} alt="Profile" />
        </button>
        <button
          className="logout-icon bg-transparent hover:bg-transparent"
          onClick={logout}
        >
          <img src={LogoutIcon} alt="Logout" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
