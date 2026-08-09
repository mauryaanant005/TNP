import { Route } from "react-router";
import RequireRole from "../components/RequireRole";
import { ROLE_GROUPS } from "../lib/roles";
import PrincipalLayout from "../pages/principal/PrincipalLayout";
import TrainingStats from "../pages/training_officer/TrainingStats";
import Old from "../pages/placement_officer/Old";
import InternshipStats from "../pages/internship_officer/Stats";

const PrincipalRoutes = () => {
  return (
    <Route element={<RequireRole allowed={ROLE_GROUPS.PRINCIPAL} />}>
      <Route path="/principal" element={<PrincipalLayout />}>
        <Route index element={<TrainingStats />} />
        <Route
          path="placement"
          element={
            <div>
              <Old />
            </div>
          }
        />
        <Route path="internship" element={<InternshipStats />} />
      </Route>
    </Route>
  );
};

export default PrincipalRoutes;
