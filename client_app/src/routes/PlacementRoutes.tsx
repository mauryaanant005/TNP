import { Route } from "react-router";
import RequireRole from "../components/RequireRole";
import { ROLE_GROUPS } from "../lib/roles";
import PlacementLayout from "../pages/placement_officer/PlacementLayout";
import { CategoryDataStatistics } from "../pages/placement_officer/CategoryData";
import { PlacementDashboard } from "../pages/placement_officer";
import Old from "../pages/placement_officer/Old";
import { BranchWiseReport } from "../pages/placement_officer/BranchWiseReport";
import { StudentStatusReport } from "../pages/placement_officer/StudentPerformance";
import { ConsolidationReportPage } from "../pages/placement_officer/ConsolidatedReport";
import CategoryRuleForm from "../pages/placement_officer/CategoryRuleForm";
import CategoryRuleList from "../pages/placement_officer/CategoryRuleList";
import StudentByCategory from "../pages/placement_officer/StudentByCategory";

const PlacementRoutes = () => {
  return (
    <Route element={<RequireRole allowed={ROLE_GROUPS.PLACEMENT_REPORTS} />}>
      <Route path="/placement_officer" element={<PlacementLayout />}>
        <Route index element={<PlacementDashboard />} />
        <Route path="branch-wise-report" element={<BranchWiseReport />} />
        <Route path="student-performance" element={<StudentStatusReport />} />
        <Route
          path="placement-consolidated-report"
          element={<ConsolidationReportPage />}
        />
        <Route
          path="comparative_Placement_Statistics"
          element={
            <div>
              <CategoryDataStatistics />
            </div>
          }
        />
        <Route path="placement_old" element={<Old />} />
      </Route>
      {/* Top-level paths outside the layout. The category rules decide which
          students a company may see, so they belong behind the same guard. */}
      <Route path="/category-rule-form" element={<CategoryRuleForm />} />
      <Route path="/category-rules/list" element={<CategoryRuleList />} />
      <Route
        path="/category-rules/students/:category/:batch"
        element={<StudentByCategory />}
      />
    </Route>
  );
};

export default PlacementRoutes;
