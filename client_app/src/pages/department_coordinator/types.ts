export type SemesterPerformance = {
  semester: string;
  performance: number;
};

export type SemesterAttendance = {
  semester: string;
  attendance: number;
};


export type DeptStudentFormData = {
  personal_email: string | number | null | undefined;
  contact: string | number | null | undefined;
  dob: string | number | null | undefined;
  gender: string | number | null | undefined;
  division: string | number | null | undefined;
  cgpa: number | null | undefined;
  attendance: number | null | undefined;
  tenth_grade: number | null | undefined;
  higher_secondary_grade: number | null | undefined;
  is_kt: boolean;
  is_blacklisted: boolean;
  joined_company: boolean;
  is_dse_student: boolean;
  offers: [];
  applications: [];
  card: string;
  uid: string;
  user_id: string;
  user: {
    id: string;
    email: string;
    full_name: string;
  };
  department: string;
  academic_year: string;
  current_category: string;
  is_student_coordinator: boolean;
  consent: string;
  batch: string;
  is_pli: boolean;

  academic_performance?: SemesterPerformance[];
  academic_attendance?: SemesterAttendance[];
  training_performance: []
};

export interface BatchData {
  total_students: number;
  average_cgpa: number;
  students_with_kt: number;
  consent_breakdown: {
    placement: number;
    higher_studies: number;
    entrepreneurship: number;
  };
  placement_stats: {
    actual_placed_count: number;
    average_salary_lpa: number;
    median_salary_lpa: number;
    highest_salary_lpa: number;
  };
  internship_stats: {
    total_internships: number;
    in_house: number;
    outhouse: number;
  };
  training_stats: Record<string, number>;
}

export interface DashboardData {
  department_name: string;
  summary_by_batch: Record<string, BatchData>;
  overall_consent_summary: Array<{ name: string; value: number }>;
  overall_top_companies: Array<{ company_name: string; hires: number }>;
  overall_training_summary: Record<string, number>;
}
