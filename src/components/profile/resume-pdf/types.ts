import type { ReactElement } from "react";
import type { Resume } from "@/models/profile.model";

/** The subset of a resume the PDF actually renders — no title, ids or timestamps. */
export type ResumeDocumentData = Pick<
  Resume,
  | "summary"
  | "contactInfo"
  | "skills"
  | "experiences"
  | "educations"
  | "projects"
  | "certifications"
>;

/**
 * Rich-text fields pre-converted to react-pdf nodes. The conversion needs a DOM,
 * so it happens on the client before the document is rendered.
 */
export type ResumeHtmlNodes = {
  summary: ReactElement[];
  experiences: ReactElement[][];
  educations: ReactElement[][];
  projects: ReactElement[][];
};
