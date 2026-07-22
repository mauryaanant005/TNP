import { Route } from "react-router";
import DepartmentParent from "../pages/department_coordinator/DepartmentParent";
import DepartmentStudentData from "../pages/department_coordinator/DepartmentStudentData";
import DepartmentAttendance from "../pages/department_coordinator/DepartmentAttendance";
import UploadInhouseInternship from "../pages/department_coordinator/UploadInhouseInternship";
import DepartmentDashboard from "../pages/department_coordinator/DepartmentStats";

const DepartmentRoutes = () => {
  return (
    <Route path="/department_coordinator" element={<DepartmentParent />}>
      <Route path="attendance" element={<DepartmentAttendance />} />
      <Route path="" element={<DepartmentStudentData />} />
      <Route
        path="upload-inhouse-internship"
        element={<UploadInhouseInternship />}
      />
      <Route path="department_stats" element={<DepartmentDashboard />} />
    </Route>
  );
};

export default DepartmentRoutes;
