import { Route } from "react-router";
import TrainingLayout from "../pages/training_officer/TrainingLayout";
import TrainingStats from "../pages/training_officer/TrainingStats";
import TrainingNotice from "../pages/training_officer/TrainingNotice";

const TrainingRoutes = () => {
  return (
    <Route path="/training_officer" element={<TrainingLayout />}>
      <Route index element={<TrainingStats />} />
      <Route path="notice" element={<TrainingNotice />} />
    </Route>
  );
};

export default TrainingRoutes;
