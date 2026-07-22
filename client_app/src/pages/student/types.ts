// src/type.ts

export type Education = {
  id: string;
  degree: string;
  institution: string;
  percentage: string;
  start_date: string;
  end_date: string;
};

export interface Project {
  id: string;
  title: string;
  description: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  start_date: string;
  end_date: string;
  description: string;
}


export interface Activity {
  id: string;
  title: string;
  description: string;
}

export interface ResumeData {
  name: string;
  email: string;
  phone_no?: string;
  address?: string;

  // sections
  education?: Education[];
  skills?: string[];
  projects?: Project[];
  workExperience?: WorkExperience[];
  activitiesAndAchievements?: Activity[];
  contacts?: string[];

  // assets
  profile_image?: string;
}

export type StudentFormData = {
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
};
