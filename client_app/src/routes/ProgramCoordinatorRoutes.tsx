import { Route } from "react-router";
import ProgramCoordinatorLayout from "../pages/program_coordinator/layout";
import ProgramHome from "../pages/program_coordinator";
import Update from "../pages/program_coordinator/Update";
import Session from "../pages/program_coordinator/Session";
import Upload from "../pages/program_coordinator/Upload";
import Attendance from "../pages/program_coordinator/Attendance";
import TrainingPerformanceUpload from "../pages/program_coordinator/TrainingPerformanceUpload";

const ProgramCoordinatorRoutes = () => {
  return (
    <Route path="/program_coordinator" element={<ProgramCoordinatorLayout />}>
      <Route path="session-creation" element={<Session />} />
      <Route path="attendance-and-marks" element={<Attendance />} />
      <Route path="update-attendance" element={<Update />} />
      <Route path="upload-file" element={<Upload />} />
      <Route index element={<ProgramHome />} />
      <Route
        path="performance-upload"
        element={<TrainingPerformanceUpload />}
      />
    </Route>
  );
};

export default ProgramCoordinatorRoutes;
