"use client";
import { useState } from "react";
import {
  ContactInfo,
  Education,
  LicenseOrCertification,
  Project,
  Resume,
  ResumeSection,
  SkillCategory,
  WorkExperience,
  RESUME_SECTIONS,
} from "@/models/profile.model";
import { SectionHeaderRow } from "./SectionHeaderRow";
import { SectionLayoutPanel } from "./SectionLayoutPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
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

/** Contact info plus the sections that can be reordered. */
type SectionKey = "contactInfo" | ResumeSection;

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

  const [tab, setTab] = useState<"content" | "layout">("content");

  const { contactInfo, summary, skills, experiences, projects, educations, certifications } =
    localResume;


  const toggleForm = (section: SectionKey, index?: number) =>
    setActiveForm((prev) =>
      prev?.type === section && prev?.index === index
        ? null
        : ({ type: section, ...(index !== undefined ? { index } : {}) } as ActiveForm),
    );

  const openForm = (section: SectionKey, index?: number) =>
    setActiveForm({ type: section, ...(index !== undefined ? { index } : {}) } as ActiveForm);

  const closeForm = () => setActiveForm(null);

  /** One section of the Content tab. */
  const renderSection = (section: ResumeSection) => {
    switch (section) {
      case "summary":
        return (
          <>
            {activeForm?.type !== "summary" &&
              (summary ? (
                <SummarySectionCard
                  summary={summary}
                  onEdit={() => openForm("summary")}
                />
              ) : (
                <SectionHeaderRow
                  title="Summary"
                  onAction={() => toggleForm("summary")}
                />
              ))}
            {activeForm?.type === "summary" && (
              <AddResumeSummary
                resumeId={resumeId}
                summaryContent={summary}
                onClose={closeForm}
                onLocalSave={(s: string) => updateLocal({ summary: s })}
              />
            )}
          </>
        );

      case "skills":
        return (
          <>
            <SkillsCard
              resumeId={resumeId ?? ""}
              skills={skills ?? []}
              onEdit={(_sc: SkillCategory, index: number) => openForm("skills", index)}
              onAdd={() => toggleForm("skills")}
              onLocalDelete={(index: number) =>
                updateLocal({ skills: (skills ?? []).filter((_, i) => i !== index) })
              }
              onReorder={(next: SkillCategory[]) => updateLocal({ skills: next })}
              // The form edits by index, so the order must hold while it is open.
              reorderDisabled={activeForm?.type === "skills"}
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
        );

      case "experience":
        return (
          <ExperienceCard
            resumeId={resumeId ?? ""}
            experiences={experiences ?? []}
            onLocalChange={(exps: WorkExperience[]) => updateLocal({ experiences: exps })}
          />
        );

      case "project":
        return (
          <ProjectCard
            resumeId={resumeId ?? ""}
            projects={projects ?? []}
            onLocalChange={(next: Project[]) => updateLocal({ projects: next })}
          />
        );

      case "education":
        return (
          <EducationCard
            resumeId={resumeId ?? ""}
            educations={educations ?? []}
            onLocalChange={(edus: Education[]) => updateLocal({ educations: edus })}
          />
        );

      case "certification":
        return (
          <>
            <CertificationCard
              certifications={certifications ?? []}
              onEdit={(index: number) => openForm("certification", index)}
              onAdd={() => toggleForm("certification")}
              onDelete={(index: number) =>
                updateLocal({
                  certifications: (certifications ?? []).filter((_, i) => i !== index),
                })
              }
              onReorder={(next: LicenseOrCertification[]) =>
                updateLocal({ certifications: next })
              }
              reorderDisabled={activeForm?.type === "certification"}
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
        );
    }
  };

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as "content" | "layout")}
      className="w-[380px] xl:w-[430px] shrink-0 flex flex-col gap-3 min-h-0"
    >
      <TabsList className="grid w-full grid-cols-2 shrink-0">
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="layout">Layout</TabsTrigger>
      </TabsList>

      {/* Every section is always listed, in a fixed order so the editor never
          shifts under the user; the Layout tab sets the order they print in.
          Entries inside a section are still reordered by dragging. */}
      <TabsContent value="content" className="mt-0 flex-1 overflow-y-auto space-y-3 pr-1">
        {/* Contact Info */}
        {activeForm?.type !== "contactInfo" &&
          (contactInfo ? (
            <ContactInfoCard contactInfo={contactInfo} onEdit={() => openForm("contactInfo")} />
          ) : (
            <SectionHeaderRow title="Contact Info" onAction={() => toggleForm("contactInfo")} />
          ))}
        {activeForm?.type === "contactInfo" && (
          <AddContactInfo
            resumeId={resumeId}
            contactInfoToEdit={contactInfo}
            onClose={closeForm}
            onLocalSave={(info: ContactInfo) => updateLocal({ contactInfo: info })}
          />
        )}

        {RESUME_SECTIONS.map((section) => (
          // A section can be several siblings (header, entries, open form).
          <div key={section} className="space-y-3">
            {renderSection(section)}
          </div>
        ))}
      </TabsContent>

      <TabsContent value="layout" className="mt-0 flex-1 overflow-y-auto pr-1">
        <SectionLayoutPanel
          resume={localResume}
          onChange={(next) => updateLocal({ sectionOrder: next })}
        />
      </TabsContent>
    </Tabs>
  );
}
