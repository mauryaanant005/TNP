import { Route } from "react-router";
import FacultyLayout from "../pages/faculty_coordinator/FacultyLayout";
import FacultyHome from "../pages/faculty_coordinator/FacultyHome";
import FacultyTablePage from "../pages/faculty_coordinator/FacultyAttendanceTable";

const FacultyRoutes = () => {
  return (
    <Route path="/faculty_coordinator" element={<FacultyLayout />}>
      <Route index element={<FacultyHome />} />
      <Route path="attendance" element={<FacultyTablePage />} />
    </Route>
  );
};

export default FacultyRoutes;
