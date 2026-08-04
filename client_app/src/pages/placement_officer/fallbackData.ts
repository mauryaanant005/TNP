export const sampleDashboardData = {
  placementsOverTime: [
    { month: "Jan 2024", placements: 10 },
    { month: "Feb 2024", placements: 25 },
    { month: "Mar 2024", placements: 45 },
    { month: "Apr 2024", placements: 80 },
    { month: "May 2024", placements: 120 },
    { month: "Jun 2024", placements: 150 },
  ],
  departmentPerformance: [
    { department: "COMP", total: 120, placed: 105, avg_salary: "8.5" },
    { department: "IT", total: 100, placed: 85, avg_salary: "7.8" },
    { department: "E&TC", total: 80, placed: 60, avg_salary: "6.5" },
    { department: "AI&DS", total: 60, placed: 55, avg_salary: "9.2" },
  ],
  salaryDistribution: [
    { range: "0-5 LPA", count: 20 },
    { range: "5-7 LPA", count: 45 },
    { range: "7-10 LPA", count: 85 },
    { range: "10-15 LPA", count: 40 },
    { range: "15+ LPA", count: 15 },
  ],
  offerCategoryBreakdown: [
    { name: "Normal", value: 65 },
    { name: "Dream", value: 125 },
    { name: "Super Dream", value: 55 },
  ],
  placementStatusFunnel: [
    { name: "Eligible", value: 360 },
    { name: "Applied", value: 320 },
    { name: "Interviewed", value: 280 },
    { name: "Selected", value: 245 },
  ],
  topRecruiters: [
    { company__name: "Tech Corp", hires: 45 },
    { company__name: "Data Systems", hires: 35 },
    { company__name: "Innovate AI", hires: 25 },
    { company__name: "Global IT", hires: 20 },
    { company__name: "Cloud Net", hires: 15 },
  ],
  topJobRoles: [
    { role: "Software Engineer", count: 85 },
    { role: "Data Analyst", count: 45 },
    { role: "System Admin", count: 30 },
    { role: "QA Engineer", count: 25 },
    { role: "Product Manager", count: 15 },
  ],
};

export const sampleConsolidatedData = [
  {
    form__notice__date: "2024-03-15T00:00:00Z",
    form__name: "Tech Corp",
    role: "Software Engineer",
    employee_type: "Dream",
    salary: 850000,
    applied_comp: 120,
    selected_comp: 45,
    applied_it: 80,
    selected_it: 35,
    applied_aids: 40,
    selected_aids: 20,
  },
  {
    form__notice__date: "2024-04-10T00:00:00Z",
    form__name: "Innovate AI",
    role: "Data Scientist",
    employee_type: "Super Dream",
    salary: 1250000,
    applied_comp: 60,
    selected_comp: 10,
    applied_it: 45,
    selected_it: 8,
    applied_aids: 30,
    selected_aids: 15,
  },
  {
    form__notice__date: "2024-05-22T00:00:00Z",
    form__name: "Global IT",
    role: "System Admin",
    employee_type: "Normal",
    salary: 450000,
    applied_comp: 85,
    selected_comp: 25,
    applied_it: 60,
    selected_it: 20,
    applied_etc: 40,
    selected_etc: 15,
  },
];

export const sampleBranchWiseData = {
  company_headers: [
    { id: 1, name: "Tech Corp" },
    { id: 2, name: "Innovate AI" },
    { id: 3, name: "Global IT" },
  ],
  progress_fields: ["registered", "aptitude_test", "coding_test", "technical_interview", "hr_interview", "gd", "final"],
  report_data: [
    {
      department: "COMP",
      company_1_registered: 120, company_1_aptitude_test: 100, company_1_coding_test: 80, company_1_technical_interview: 60, company_1_hr_interview: 50, company_1_gd: 48, company_1_final: 45,
      company_2_registered: 60, company_2_aptitude_test: 40, company_2_coding_test: 30, company_2_technical_interview: 20, company_2_hr_interview: 15, company_2_gd: 12, company_2_final: 10,
      company_3_registered: 85, company_3_aptitude_test: 70, company_3_coding_test: 60, company_3_technical_interview: 45, company_3_hr_interview: 35, company_3_gd: 30, company_3_final: 25,
    },
    {
      department: "IT",
      company_1_registered: 80, company_1_aptitude_test: 70, company_1_coding_test: 60, company_1_technical_interview: 45, company_1_hr_interview: 40, company_1_gd: 38, company_1_final: 35,
      company_2_registered: 45, company_2_aptitude_test: 35, company_2_coding_test: 25, company_2_technical_interview: 15, company_2_hr_interview: 10, company_2_gd: 9, company_2_final: 8,
      company_3_registered: 60, company_3_aptitude_test: 50, company_3_coding_test: 45, company_3_technical_interview: 30, company_3_hr_interview: 25, company_3_gd: 22, company_3_final: 20,
    }
  ]
};

export const sampleStudentDetailData = {
  count: 2,
  next: null,
  previous: null,
  company_headers: [
    { id: 1, name: "Tech Corp" },
    { id: 2, name: "Innovate AI" }
  ],
  progress_fields: ["eligible", "registered", "aptitude_test", "coding_test", "technical_interview", "gd", "hr_interview", "selected"],
  student_data: [
    {
      uid: "2024COMP1001",
      student_name: "Aarav Sharma",
      department: "COMP",
      gender: "Male",
      cgpa: 8.9,
      is_kt: false,
      placed_in: "Tech Corp",
      all_offers_list: ["Tech Corp"],
      company_1_eligible: true, company_1_registered: true, company_1_aptitude_test: true, company_1_coding_test: true, company_1_technical_interview: true, company_1_gd: true, company_1_hr_interview: true, company_1_selected: true,
      company_2_eligible: true, company_2_registered: true, company_2_aptitude_test: false, company_2_coding_test: false, company_2_technical_interview: false, company_2_gd: false, company_2_hr_interview: false, company_2_selected: false,
    },
    {
      uid: "2024IT1002",
      student_name: "Diya Patel",
      department: "IT",
      gender: "Female",
      cgpa: 9.2,
      is_kt: false,
      placed_in: "Innovate AI",
      all_offers_list: ["Innovate AI"],
      company_1_eligible: true, company_1_registered: false, company_1_aptitude_test: false, company_1_coding_test: false, company_1_technical_interview: false, company_1_gd: false, company_1_hr_interview: false, company_1_selected: false,
      company_2_eligible: true, company_2_registered: true, company_2_aptitude_test: true, company_2_coding_test: true, company_2_technical_interview: true, company_2_gd: true, company_2_hr_interview: true, company_2_selected: true,
    }
  ]
};

export const sampleCategoryData = [
  { current_category: "A", count: 45 },
  { current_category: "B", count: 35 },
  { current_category: "C", count: 15 },
  { current_category: "D", count: 5 },
];
