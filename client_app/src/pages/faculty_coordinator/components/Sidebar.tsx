import { Link } from "react-router"; // Import Link for routing
import "./Sidebar.css";
import { authAtom } from "@/authAtom";
import { useAtomValue } from "jotai";
import { logout, redirectToProfile } from "@/utils";
import Logo from "@/assets/img/logo.png";
import MessageIcon from "@/assets/img/Training_Programme_Statistics.png";
import LogoutIcon from "@/assets/img/logout_new.png";
import ProfileIcon from "@/assets/img/user_profile_new.png";
const Sidebar = () => {
  const auth = useAtomValue(authAtom);
  return (
    <aside className={`sidebar `}>
      <div className="logo-container">
        <img src={Logo} alt="TCET Logo" className="logo" />

        <h1 className="title" style={{ color: "#153f74" }}>
          TCET - TNP
        </h1>
      </div>
      <ul className="menu">
        <Link to="/faculty_coordinator" className="menu-item">
          <img src={MessageIcon} alt="Student Data" className="menu-icon" />
          <p>Session Attendance</p>
        </Link>
        {auth?.department && (
          <Link to={"/department_coordinator"} className="menu-item">
            <img src={MessageIcon} alt="Student Data" className="menu-icon" />
            Department
          </Link>
        )}
        {auth?.program && (
          <Link to={"/program_coordinator"} className="menu-item">
            <img src={MessageIcon} alt="Student Data" className="menu-icon" />
            Program
          </Link>
        )}
      </ul>
      <div className="footer"></div>
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
