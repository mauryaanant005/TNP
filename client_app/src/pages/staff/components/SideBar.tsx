import React, { useEffect } from "react";
import { NavLink } from "react-router";
import "../../placement_officer/components/sidebar.css";
import { Building2, NotebookPen, Send, Verified, FileBarChart2, X } from "lucide-react";
import { logout, redirectToProfile } from "@/utils";
import { SERVER_URL } from "@/constant";
import Logo from "@/assets/img/logo.png";
import ProfileIcon from "@/assets/img/user_profile_new.png";
import LogoutIcon from "@/assets/img/logout_new.png";

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isOverlay?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose, isOverlay = false }) => {
  const handleLogout = async () => {
    await logout();
    window.location.href = `${SERVER_URL}/auth/login/`;
  };

  // Close on Escape key when overlay is active
  useEffect(() => {
    if (!isOverlay || !isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOverlay, isOpen, onClose]);

  // Prevent background scrolling when overlay sidebar is open
  useEffect(() => {
    if (!isOverlay) return;
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOverlay, isOpen]);

  const handleLinkClick = () => {
    if (isOverlay) {
      onClose?.();
    }
  };

  const navContent = (
    <>
      <div className="logo-container" style={{ position: "relative", width: "100%" }}>
        <img src={Logo} alt="TCET Logo" className="logo" />
        <h1 className="title">TCET - TNP</h1>
        {isOverlay && onClose && (
          <button
            onClick={onClose}
            className="absolute top-0 right-0 p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close sidebar navigation"
            title="Close sidebar"
            style={{ position: "absolute", top: 0, right: 0 }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      <ul className="menu" style={{ flex: 1, marginTop: "16px" }}>
        <NavLink to="" end className="menu-item gap-3" onClick={handleLinkClick}>
          <NotebookPen />
          <p>Notice Creation</p>
        </NavLink>
        <NavLink to="placement_companies" className="menu-item gap-3" onClick={handleLinkClick}>
          <Building2 />
          <p>Placement Companies</p>
        </NavLink>
        <NavLink to="internship/register" className="menu-item gap-3" onClick={handleLinkClick}>
          <Building2 />
          <p>InternShip Company Form</p>
        </NavLink>
        <NavLink to="internship/verify" className="menu-item gap-3" onClick={handleLinkClick}>
          <Verified />
          <p>Verify Internship</p>
        </NavLink>
        <NavLink to="student-management" className="menu-item gap-3" onClick={handleLinkClick}>
          <Verified />
          <p>Student Management</p>
        </NavLink>
        <NavLink to="batch-categorize" className="menu-item gap-3" onClick={handleLinkClick}>
          <Verified />
          <p>Student Category</p>
        </NavLink>
        <NavLink to="/notifications/create" className="menu-item gap-3" onClick={handleLinkClick}>
          <Send />
          <p>Notification</p>
        </NavLink>
        <NavLink to="reports" className="menu-item gap-3" onClick={handleLinkClick}>
          <FileBarChart2 />
          <p>Report</p>
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
          onClick={handleLogout}
          aria-label="Logout"
        >
          <img src={LogoutIcon} alt="Logout" className="sidebar-action-icon" />
        </button>
      </div>
    </>
  );

  if (isOverlay) {
    if (!isOpen) return null;
    return (
      <div
        className="fixed inset-0 z-50 flex"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
        style={{ position: "fixed", inset: 0, zIndex: 1300 }}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)" }}
        />

        {/* Drawer panel */}
        <aside
          className="relative flex flex-col justify-between bg-white shadow-2xl p-5"
          style={{
            position: "relative",
            width: "280px",
            maxWidth: "85vw",
            height: "100%",
            backgroundColor: "#ffffff",
            padding: "20px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            zIndex: 1301,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflowY: "auto",
          }}
        >
          {navContent}
        </aside>
      </div>
    );
  }

  // Standard non-overlay sidebar
  return <aside className="sidebar">{navContent}</aside>;
};

export default Sidebar;
