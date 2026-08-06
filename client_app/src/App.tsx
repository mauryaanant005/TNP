import { apiFetch } from "@/lib/api";
import { BrowserRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { authAtom } from "./authAtom";
import { getCookie } from "./utils";
import { SERVER_URL } from "./constant";
import Home from "./pages/home";

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

// Module-level singleton: there is exactly one App instance in this app, and
// creating the client inside the component body would tear down and
// recreate React Query's entire cache/subscriptions on every re-render of
// App (e.g. once the auth-check effect below calls setUser).
const queryClient = new QueryClient();

const App = () => {
  const setUser = useSetAtom(authAtom);
  useEffect(() => {
    const onAuthenticate = async () => {
      if (getCookie("is_logged_in") !== "true") {
        window.location.href = `${SERVER_URL}/auth/login/`;
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
      } else {
        window.open(`${SERVER_URL}/auth/login/`, "_self");
      }
    };
    onAuthenticate();
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
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
// force rebuild// cache bust 2