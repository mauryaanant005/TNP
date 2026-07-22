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

const App = () => {
  const setUser = useSetAtom(authAtom);
  useEffect(() => {
    const onAuthenticate = async () => {
      const res = await fetch("/api/", {
        method: "GET",
        credentials: "include",
        headers: {
          "X-CSRF-Token": getCookie("csrftoken") || "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        console.log(data);
        setUser(data);
      } else {
        window.open(`${SERVER_URL}/auth/login/`, "_self");
      }
    };
    onAuthenticate();
  }, []);
  const queryClient = new QueryClient();
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
