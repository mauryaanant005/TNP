import { BranchWiseChart } from "./components/BranchWiseChart";
import { StipendChart } from "./components/StipendChart";
import { InternshipOpportunitiesChart } from "./components/InternShipOpportunity";
import "../department_coordinator/components/Charts";

const internshipData = {
  branch_data: [
    { label: "AIDS", value: 70 },
    { label: "IT-B", value: 70 },
    { label: "E&TC-A", value: 70 },
    { label: "AI&ML", value: 69 },
    { label: "IT-A", value: 69 },
    { label: "COMP-C", value: 69 },
    { label: "COMP-B", value: 69 },
    { label: "CIVIL A", value: 69 },
    { label: "E&TC-B", value: 69 },
    { label: "COMP-A", value: 69 },
    { label: "CIVIL B", value: 67 },
    { label: "ELEX", value: 63 },
    { label: "MECH A", value: 62 },
    { label: "MECH B", value: 62 },
    { label: "IOT", value: 33 },
  ],
  stipend_data: [
    { label: "Rs 95000", value: 24.87 },
    { label: "Rs 70000", value: 18.32 },
    { label: "Rs 40000", value: 10.47 },
    { label: "Rs 30000", value: 7.85 },
    { label: "Rs 25000", value: 6.54 },
    { label: "Rs 25000", value: 6.54 },
    { label: "Rs 25000", value: 6.54 },
    { label: "Rs 25000", value: 6.54 },
    { label: "Rs 25000", value: 6.54 },
    { label: "Rs 22000", value: 5.76 },
  ],
  internship_opportunities_data: [
    { label: "Vallinakart", value: 63 },
    { label: "Code Clause", value: 61 },
    { label: "Prodigiy Infotech", value: 54 },
    { label: "Oasis Infobye", value: 38 },
    { label: "Edunet Foundation", value: 22 },
    { label: "Lets Grow more", value: 13 },
    { label: "Udemy", value: 13 },
    { label: "AICTE-IKS", value: 12 },
    { label: "TechnoHacks EduTech", value: 11 },
    { label: "Bureau of Indian Standards", value: 9 },
  ],
};

export default function InternShipStats() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <BranchWiseChart data={internshipData.branch_data} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <StipendChart data={internshipData.stipend_data} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg md:col-span-2">
          <InternshipOpportunitiesChart
            data={internshipData.internship_opportunities_data}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg md:col-span-2">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">
              Total Internships Secured
            </h2>
            <p className="text-5xl font-bold text-blue-600 mt-4">296</p>
          </div>
        </div>
      </div>
    </div>
  );
}