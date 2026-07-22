import { Route } from "react-router";
import StudentLayout from "../pages/student/student_layout";
import SessionAttendance from "../pages/student/SessionAttendance";
import StudentPersonalInfo from "../pages/student/student-personal-info";
import PlacementRegistration from "../pages/student/PlacementRegistration";
import InternshipRegistration from "../pages/student/InternshipRegistration";
import StudentInternships from "../pages/student/InternshipSummary";
import Resume from "../pages/student/resume";
import ResumePreview from "../pages/student/resume-preview";
import PlacementCard from "../pages/student/placement-card";
import StudentTrainingPerformance from "../pages/student/StudentTrainingPerformance";

const StudentRoutes = () => {
  return (
    <>
      <Route path="/student" element={<StudentLayout />}>
        <Route path="session-attendance" element={<SessionAttendance />} />
        <Route
          path="training-performance"
          element={<StudentTrainingPerformance />}
        />
        <Route index element={<StudentPersonalInfo />} />
        <Route path="resume" element={<Resume />} />
        <Route path="resume-preview" element={<ResumePreview />} />
        <Route
          path="placement/registration/:id"
          element={<PlacementRegistration />}
        />
        <Route path="placement-card" element={<PlacementCard />} />
        <Route
          path="internship/registration/:id"
          element={<InternshipRegistration />}
        />
        <Route path="internships" element={<StudentInternships />} />
      </Route>
      <Route
        path="/student/student-training-performance"
        element={<StudentTrainingPerformance />}
      />
    </>
  );
};

export default StudentRoutes;
