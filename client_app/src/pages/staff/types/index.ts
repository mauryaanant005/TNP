export interface Department {
  name: string;
}

export interface Student {
  id: string;
  uid: string;
  first_name: string;
  last_name: string;
  personal_email: string;
  contact: string;
  department: Department;
  cgpa: number;
}

export interface PlacementProgress {
  aptitude_test: boolean;
  coding_test: boolean;
  gd: boolean;
  technical_interview: boolean;
  hr_interview: boolean;
  final_result: "Pending" | "Selected" | "Rejected";
}

export interface InterestedStudentApplication {
  application_id: string;
  student: Student;
  progress: PlacementProgress;
}

// Type for the paginated API response
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}