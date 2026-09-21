"use client";
import { useState } from "react";
import {
  ContactInfo,
  Education,
  LicenseOrCertification,
  Project,
  Resume,
  SkillCategory,
  WorkExperience,
} from "@/models/profile.model";
import AddResumeSection, { SectionKey } from "./AddResumeSection";
import { SectionEmptyRow } from "./SectionEmptyRow";
import ContactInfoCard from "./ContactInfoCard";
import SummarySectionCard from "./SummarySectionCard";
import SkillsCard from "./SkillsCard";
import ExperienceCard from "./ExperienceCard";
import ProjectCard from "./ProjectCard";
import EducationCard from "./EducationCard";
import CertificationCard from "./CertificationCard";
import AddContactInfo from "./AddContactInfo";
import AddResumeSummary from "./AddResumeSummary";
import AddSkills from "./AddSkills";
import AddCertification from "./AddCertification";

type ActiveForm =
  | { type: "contactInfo"; index?: undefined }
  | { type: "summary"; index?: undefined }
  | { type: "skills"; index?: number }
  | { type: "experience"; index?: number }
  | { type: "project"; index?: number }
  | { type: "education"; index?: number }
  | { type: "certification"; index?: number };

export interface ResumeEditorPanelProps {
  /** undefined when creating a new resume before it has been persisted */
  resumeId: string | undefined;
  localResume: Resume;
  updateLocal: (updates: Partial<Resume>) => void;
}

export function ResumeEditorPanel({
  resumeId,
  localResume,
  updateLocal,
}: ResumeEditorPanelProps) {
  const [activeForm, setActiveForm] = useState<ActiveForm | null>(null);

  const [addedSections, setAddedSections] = useState<Set<SectionKey>>(() => {
    const s = new Set<SectionKey>();
    if (localResume.contactInfo) s.add("contactInfo");
    if (localResume.summary) s.add("summary");
    if (localResume.skills?.length) s.add("skills");
    if (localResume.experiences?.length) s.add("experience");
    if (localResume.projects?.length) s.add("project");
    if (localResume.educations?.length) s.add("education");
    if (localResume.certifications?.length) s.add("certification");
    return s;
  });

  const { contactInfo, summary, skills, experiences, projects, educations, certifications } =
    localResume;

  const addSection = (section: SectionKey) =>
    setAddedSections((prev) => new Set([...prev, section]));

  const toggleForm = (section: SectionKey, index?: number) =>
    setActiveForm((prev) =>
      prev?.type === section && prev?.index === index
        ? null
        : ({ type: section, ...(index !== undefined ? { index } : {}) } as ActiveForm),
    );

  const openForm = (section: SectionKey, index?: number) =>
    setActiveForm({ type: section, ...(index !== undefined ? { index } : {}) } as ActiveForm);

  const closeForm = () => setActiveForm(null);

  return (
    <div className="w-[380px] xl:w-[430px] shrink-0 flex flex-col gap-3 min-h-0">
      {/* Panel header */}
      <div className="flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Editor
        </span>
        <AddResumeSection addedSections={addedSections} onOpen={addSection} />
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">

        {/* Contact Info */}
        {addedSections.has("contactInfo") && (
          <>
            {contactInfo
              ? activeForm?.type !== "contactInfo" && (
                  <ContactInfoCard
                    contactInfo={contactInfo}
                    onEdit={() => openForm("contactInfo")}
                  />
                )
              : activeForm?.type !== "contactInfo" && (
                  <SectionEmptyRow
                    title="Contact Info"
                    onAdd={() => toggleForm("contactInfo")}
                  />
                )}
            {activeForm?.type === "contactInfo" && (
              <AddContactInfo
                resumeId={resumeId}
                contactInfoToEdit={contactInfo}
                onClose={closeForm}
                onLocalSave={(info: ContactInfo) => updateLocal({ contactInfo: info })}
              />
            )}
          </>
        )}

        {/* Summary */}
        {addedSections.has("summary") && (
          <>
            {summary
              ? activeForm?.type !== "summary" && (
                  <SummarySectionCard
                    summary={summary}
                    onEdit={() => openForm("summary")}
                  />
                )
              : activeForm?.type !== "summary" && (
                  <SectionEmptyRow title="Summary" onAdd={() => toggleForm("summary")} />
                )}
            {activeForm?.type === "summary" && (
              <AddResumeSummary
                resumeId={resumeId}
                summaryContent={summary}
                onClose={closeForm}
                onLocalSave={(s: string) => updateLocal({ summary: s })}
              />
            )}
          </>
        )}

        {/* Skills */}
        {addedSections.has("skills") && (
          <>
            <SkillsCard
              resumeId={resumeId ?? ""}
              skills={skills ?? []}
              onEdit={(_sc: SkillCategory, index: number) => openForm("skills", index)}
              onAdd={() => toggleForm("skills")}
              onLocalDelete={(index: number) =>
                updateLocal({ skills: (skills ?? []).filter((_, i) => i !== index) })
              }
            />
            {activeForm?.type === "skills" && (
              <AddSkills
                resumeId={resumeId}
                skillToEdit={activeForm.index !== undefined ? skills?.[activeForm.index] : null}
                skillIndex={activeForm.index}
                onClose={closeForm}
                onLocalSave={(skill: SkillCategory, index?: number) => {
                  const arr = skills ?? [];
                  updateLocal({
                    skills:
                      index !== undefined
                        ? arr.map((s, i) => (i === index ? skill : s))
                        : [...arr, skill],
                  });
                }}
              />
            )}
          </>
        )}

        {/* Experience */}
        {addedSections.has("experience") && (
          <ExperienceCard
            resumeId={resumeId ?? ""}
            experiences={experiences ?? []}
            onLocalChange={(exps: WorkExperience[]) => updateLocal({ experiences: exps })}
          />
        )}

        {/* Projects */}
        {addedSections.has("project") && (
          <ProjectCard
            resumeId={resumeId ?? ""}
            projects={projects ?? []}
            onLocalChange={(next: Project[]) => updateLocal({ projects: next })}
          />
        )}

        {/* Education */}
        {addedSections.has("education") && (
          <EducationCard
            resumeId={resumeId ?? ""}
            educations={educations ?? []}
            onLocalChange={(edus: Education[]) => updateLocal({ educations: edus })}
          />
        )}

        {/* Certifications */}
        {addedSections.has("certification") && (
          <>
            <CertificationCard
              certifications={certifications ?? []}
              onEdit={(index: number) => openForm("certification", index)}
              onAdd={() => toggleForm("certification")}
            />
            {activeForm?.type === "certification" && (
              <AddCertification
                resumeId={resumeId}
                certificationIndex={activeForm.index}
                certifications={certifications}
                onClose={closeForm}
                onLocalSave={(cert: LicenseOrCertification, index?: number) => {
                  const arr = certifications ?? [];
                  updateLocal({
                    certifications:
                      index !== undefined
                        ? arr.map((c, i) => (i === index ? cert : c))
                        : [...arr, cert],
                  });
                }}
              />
            )}
          </>
        )}

      </div>
    </div>
  );
}
