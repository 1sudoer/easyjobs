export interface Resume {
  id?: string;
  userId?: string;
  jobProfileId?: string;
  title: string;
  summary?: string;
  contactInfo?: ContactInfo;
  skills?: SkillCategory[];
  experiences?: WorkExperience[];
  educations?: Education[];
  projects?: Project[];
  certifications?: LicenseOrCertification[];
  createdAt?: Date;
  updatedAt?: Date;
  _count?: {
    Job?: number;
  };
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  headline?: string;
  phone?: string;
  address?: string;
  github?: string;
  linkedin?: string;
}

export interface SkillCategory {
  label: string;
  details: string[];
}

export interface WorkExperience {
  company: string;
  jobTitle: string;
  location: string;
  startDate: string;
  endDate?: string | null;
  currentJob?: boolean;
  description?: string;
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  location: string;
  startDate:  string;
  endDate?: string | null;
  cgpa?: string;
  description?: string;
}

export interface Project {
  name: string;
  /** Rich text (HTML), same as WorkExperience/Education descriptions. */
  description?: string;
  startDate?: string;
  endDate?: string | null;
  current?: boolean;
  technologies?: string[];
  url?: string;
  githubUrl?: string;
}

export interface LicenseOrCertification {
  title: string;
  organization: string;
  issueDate?: Date | string | null;
  expirationDate?: Date | string | null;
  credentialUrl?: string;
}

export interface CoverLetter {
  id?: string;
  userId?: string;
  title: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
  _count?: {
    Job?: number;
  };
}
