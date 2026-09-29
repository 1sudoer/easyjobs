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
  /**
   * Order of the movable sections. Stored as given; read it through
   * `resolveSectionOrder`, which drops unknown keys and fills in missing ones.
   */
  sectionOrder?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  _count?: {
    Job?: number;
  };
}

/**
 * The resume sections that can be reordered, in their default order. Contact
 * info is not among them: it is always the header at the top.
 */
export const RESUME_SECTIONS = [
  "summary",
  "skills",
  "experience",
  "project",
  "education",
  "certification",
] as const;

export type ResumeSection = (typeof RESUME_SECTIONS)[number];

/**
 * Every movable section exactly once: the stored order first, with unknown
 * keys and duplicates dropped, then any sections it is missing in the default
 * order. An empty or absent order gives the default.
 */
export function resolveSectionOrder(order?: readonly string[] | null): ResumeSection[] {
  const known = new Set<string>(RESUME_SECTIONS);
  const seen = new Set<ResumeSection>();
  for (const key of order ?? []) {
    if (known.has(key)) seen.add(key as ResumeSection);
  }
  for (const key of RESUME_SECTIONS) seen.add(key);
  return [...seen];
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
