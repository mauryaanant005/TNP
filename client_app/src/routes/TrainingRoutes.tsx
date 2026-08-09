import { Route } from "react-router";
import RequireRole from "../components/RequireRole";
import { ROLE_GROUPS } from "../lib/roles";
import TrainingLayout from "../pages/training_officer/TrainingLayout";
import TrainingStats from "../pages/training_officer/TrainingStats";
import TrainingNotice from "../pages/training_officer/TrainingNotice";

const TrainingRoutes = () => {
  return (
    <Route element={<RequireRole allowed={ROLE_GROUPS.TRAINING_OVERSIGHT} />}>
      <Route path="/training_officer" element={<TrainingLayout />}>
        <Route index element={<TrainingStats />} />
        <Route path="notice" element={<TrainingNotice />} />
      </Route>
    </Route>
  );
};

export default TrainingRoutes;
