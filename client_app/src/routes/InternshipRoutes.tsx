import { Route } from "react-router";
import InternshipLayout from "../pages/internship_officer/InternshipLayout";
import InternShipNotice from "../pages/internship_officer/InternShipNotice";
import InternshipCompanyRegister from "../pages/internship_officer/InternshipCompanyRegister";
import InternShipVerify from "../pages/internship_officer/InternShipVerify";
import InternshipStats from "../pages/internship_officer/Stats";
import OnePageReport from "../pages/internship_officer/OnePageReport";
import InternshipReport from "../pages/internship_officer/internship_report";

const InternshipRoutes = () => {
  return (
    <Route path="/internship_officer" element={<InternshipLayout />}>
      <Route index element={<InternshipStats />} />
      <Route path="notice" element={<InternShipNotice />} />
      <Route path="company_register" element={<InternshipCompanyRegister />} />
      <Route path="verify" element={<InternShipVerify />} />
      <Route path="report" element={<OnePageReport />} />
      <Route path="internship-reports" element={<InternshipReport />} />
    </Route>
  );
};

export default InternshipRoutes;