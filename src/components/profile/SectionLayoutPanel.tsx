"use client";
import { Lock, RotateCcw } from "lucide-react";
import {
  RESUME_SECTIONS,
  type Resume,
  type ResumeSection,
  resolveSectionOrder,
} from "@/models/profile.model";
import { Button } from "../ui/button";
import { DragHandle, SortableList } from "./SortableList";

export const SECTION_TITLES: Record<ResumeSection, string> = {
  summary: "Summary",
  skills: "Skills",
  experience: "Experience",
  project: "Projects",
  education: "Education",
  certification: "Certifications",
};

/** How much a section holds, for the layout list: "3 entries", or empty. */
function sectionContent(resume: Resume, section: ResumeSection): string | null {
  const plural = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n} ${many}`);
  switch (section) {
    case "summary":
      return resume.summary?.replace(/<[^>]*>/g, "").trim() ? "Written" : null;
    case "skills":
      return resume.skills?.length ? plural(resume.skills.length, "category", "categories") : null;
    case "experience":
      return resume.experiences?.length ? plural(resume.experiences.length, "entry", "entries") : null;
    case "project":
      return resume.projects?.length ? plural(resume.projects.length, "project", "projects") : null;
    case "education":
      return resume.educations?.length ? plural(resume.educations.length, "entry", "entries") : null;
    case "certification":
      return resume.certifications?.length
        ? plural(resume.certifications.length, "certification", "certifications")
        : null;
  }
}

function Row({
  title,
  detail,
  muted,
  leading,
}: {
  title: string;
  detail: string;
  muted?: boolean;
  leading: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-card px-2 py-2">
      {leading}
      <span className="flex-1 text-sm font-medium">{title}</span>
      <span className={muted ? "text-xs text-muted-foreground/70" : "text-xs text-muted-foreground"}>
        {detail}
      </span>
    </div>
  );
}

/**
 * The order the resume's sections print in, rearranged by dragging (or with the
 * keyboard: Tab to a grip, Space, arrows, Space). Contact info is always the
 * header. Content is edited on the Content tab; this only arranges it.
 */
export function SectionLayoutPanel({
  resume,
  onChange,
}: {
  resume: Resume;
  onChange: (sectionOrder: ResumeSection[]) => void;
}) {
  const order = resolveSectionOrder(resume.sectionOrder);
  const isDefault = order.every((section, i) => section === RESUME_SECTIONS[i]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Drag sections to set the order they print in. Empty sections are left out of the PDF.
      </p>

      <Row
        title="Contact Info"
        detail="Always first"
        leading={
          <span className="flex h-6 w-5 items-center justify-center text-muted-foreground" aria-hidden>
            <Lock className="h-3.5 w-3.5" />
          </span>
        }
      />

      <SortableList
        items={order}
        getKey={(section) => section}
        onReorder={onChange}
        className="space-y-2"
        renderItem={(section, _index, handle) => {
          const detail = sectionContent(resume, section);
          return (
            <Row
              title={SECTION_TITLES[section]}
              detail={detail ?? "Empty, not printed"}
              muted={!detail}
              leading={<DragHandle handle={handle} label={`${SECTION_TITLES[section]} section`} />}
            />
          );
        }}
      />

      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs text-muted-foreground"
        disabled={isDefault}
        onClick={() => onChange([...RESUME_SECTIONS])}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset to default order
      </Button>
    </div>
  );
}
