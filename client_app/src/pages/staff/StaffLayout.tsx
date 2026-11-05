import React, { useEffect, useState, createContext, useContext } from "react";
import Sidebar from "./components/SideBar";
import { Typography } from "@mui/material";
import "../placement_officer/placement.css";
import { Outlet, useNavigate, useLocation } from "react-router";
import { useAtomValue } from "jotai";
import { authAtom } from "@/authAtom";
import { roleIsAllowed, ROLE_GROUPS } from "@/lib/roles";

export interface StaffLayoutContextType {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
}

export const StaffLayoutContext = createContext<StaffLayoutContextType>({
  isSidebarOpen: false,
  setIsSidebarOpen: () => {},
  toggleSidebar: () => {},
});

export const useStaffLayout = () => useContext(StaffLayoutContext);

const StaffLayout: React.FC = () => {
  const authUser = useAtomValue(authAtom);
  const navigate = useNavigate();
  const location = useLocation();

  // Notice Creation page is the root index route (/staff or /staff/)
  const isNoticePage = location.pathname === "/staff" || location.pathname === "/staff/";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authUser || !roleIsAllowed(authUser.role, ROLE_GROUPS.PLACEMENT_DRIVE)) {
      navigate("/");
    }
  }, [authUser, navigate]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const contextValue: StaffLayoutContextType = {
    isSidebarOpen,
    setIsSidebarOpen,
    toggleSidebar,
  };

  if (isNoticePage) {
    return (
      <StaffLayoutContext.Provider value={contextValue}>
        <div className="w-full min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
          {/* Overlay Navigation Drawer (closed by default) */}
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isOverlay={true}
          />
          {/* Full-width Workspace without 22% margin or restricted 70dvw */}
          <main className="w-full flex-1 flex flex-col min-w-0">
            <Outlet context={contextValue} />
          </main>
        </div>
      </StaffLayoutContext.Provider>
    );
  }

  // Non-notice standard layout for other staff routes
  return (
    <StaffLayoutContext.Provider value={contextValue}>
      <div className="ribbon">
        <div className="app">
          <Sidebar />
          <main className="main-content1">
            <Typography variant="h3" gutterBottom>
              <u>Staff</u>
            </Typography>
            <Outlet context={contextValue} />
          </main>
        </div>
      </div>
    </StaffLayoutContext.Provider>
  );
};

export default StaffLayout;
