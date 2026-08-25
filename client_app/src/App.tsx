import { apiFetch } from "@/lib/api";
import { BrowserRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { authAtom, authStatusAtom } from "./authAtom";
import { getCookie } from "./utils";
import { SERVER_URL } from "./constant";
import Home from "./pages/home";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyOTP from "./pages/auth/VerifyOTP";
import ResetPassword from "./pages/auth/ResetPassword";
import MobileDeviceWarning from "./components/MobileDeviceWarning";

// Route Components
import NotificationRoutes from "./routes/NotificationRoutes";
import ProgramCoordinatorRoutes from "./routes/ProgramCoordinatorRoutes";
import StudentRoutes from "./routes/StudentRoutes";
import FacultyRoutes from "./routes/FacultyRoutes";
import DepartmentRoutes from "./routes/DepartmentRoutes";
import PlacementRoutes from "./routes/PlacementRoutes";
import TrainingRoutes from "./routes/TrainingRoutes";
import InternshipRoutes from "./routes/InternshipRoutes";
import PrincipalRoutes from "./routes/PrincipalRoutes";
import StaffRoutes from "./routes/StaffRoutes";

const queryClient = new QueryClient();

const PUBLIC_AUTH_PATHS = ["/forgot-password", "/verify-otp", "/reset-password"];

const App = () => {
  const setUser = useSetAtom(authAtom);
  const setAuthStatus = useSetAtom(authStatusAtom);

  useEffect(() => {
    const onAuthenticate = async () => {
      const isPublicPath = PUBLIC_AUTH_PATHS.some((path) =>
        window.location.pathname.startsWith(path)
      );

      try {
        if (getCookie("is_logged_in") !== "true") {
          setAuthStatus("anonymous");
          if (!isPublicPath && window.location.pathname !== "/") {
            window.location.replace(`${SERVER_URL}/auth/login/`);
          }
          return;
        }

        const res = await apiFetch("/api/", {
          method: "GET",
          credentials: "include",
          headers: {
            "X-CSRFToken": getCookie("csrftoken") || "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
          // Set last: RequireRole reads both atoms, and flipping the status
          // before the user is in place would let one render see
          // "authenticated" with a null user.
          setAuthStatus("authenticated");
        } else {
          setAuthStatus("anonymous");
          if (!isPublicPath && window.location.pathname !== "/") {
            window.location.replace(`${SERVER_URL}/auth/login/`);
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setAuthStatus("anonymous");
        if (!isPublicPath && window.location.pathname !== "/") {
          window.location.replace(`${SERVER_URL}/auth/login/`);
        }
      }
    };

    onAuthenticate();
  }, [setUser, setAuthStatus]);

  return (
    <QueryClientProvider client={queryClient}>
      <MobileDeviceWarning />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {NotificationRoutes()}
          {ProgramCoordinatorRoutes()}
          {StudentRoutes()}
          {FacultyRoutes()}
          {DepartmentRoutes()}
          {PlacementRoutes()}
          {TrainingRoutes()}
          {InternshipRoutes()}
          {PrincipalRoutes()}
          {StaffRoutes()}
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;