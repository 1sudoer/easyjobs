"use client";
import { WorkExperience } from "@/models/profile.model";
import { useState, useTransition } from "react";
import { deleteExperience } from "@/actions/profile.actions";
import { toast } from "../ui/use-toast";
import AddExperience from "./AddExperience";
import { SortableList } from "./SortableList";
import { EntryCard } from "./EntryCard";
import { SectionHeaderRow } from "./SectionHeaderRow";

/** The year of a free-text date such as "Jan 2022"; the text itself when it has none. */
function yearOf(date: string | null | undefined): string {
  const text = date?.trim() ?? "";
  return text.match(/\b(19|20)\d{2}\b/)?.[0] ?? text;
}

function yearRange(exp: WorkExperience): string {
  const start = yearOf(exp.startDate);
  const end = exp.currentJob || !exp.endDate?.trim() ? "Present" : yearOf(exp.endDate);
  return start ? `${start} – ${end}` : end;
}

type ActiveAction = { mode: "add" } | { mode: "edit"; index: number } | null;

interface ExperienceCardProps {
  resumeId: string;
  experiences: WorkExperience[];
  onLocalChange?: (experiences: WorkExperience[]) => void;
}

function ExperienceCard({ resumeId, experiences, onLocalChange }: ExperienceCardProps) {
  const [action, setAction] = useState<ActiveAction>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (index: number) => {
    if (onLocalChange) {
      onLocalChange(experiences.filter((_, i) => i !== index));
      return;
    }
    startTransition(async () => {
      const res = await deleteExperience(index, resumeId);
      if (!res?.success) {
        toast({ variant: "destructive", title: "Failed to delete experience." });
      }
    });
  };

  const handleLocalSave = (exp: WorkExperience, index?: number) => {
    if (!onLocalChange) return;
    onLocalChange(
      index !== undefined
        ? experiences.map((e, i) => (i === index ? exp : e))
        : [...experiences, exp],
    );
  };

  const toggleAdd = () =>
    setAction((prev) => (prev?.mode === "add" ? null : { mode: "add" }));

  const toggleEdit = (index: number) =>
    setAction((prev) =>
      prev?.mode === "edit" && prev.index === index ? null : { mode: "edit", index }
    );

  return (
    <>
      <SectionHeaderRow title="Experience" onAction={toggleAdd} />

      <SortableList
        items={experiences}
        // Entries are addressed by index, so reordering under an open form
        // would point the form at a different entry.
        disabled={action !== null || !onLocalChange}
        onReorder={(next) => onLocalChange?.(next)}
        className="space-y-2"
        renderItem={(exp, index, handle) => {
          if (action?.mode === "edit" && action.index === index) {
            return (
              <AddExperience
                resumeId={resumeId}
                experienceIndex={index}
                experiences={experiences}
                onClose={() => setAction(null)}
                onLocalSave={onLocalChange ? handleLocalSave : undefined}
              />
            );
          }

          const details = [yearRange(exp), exp.location?.trim()].filter(Boolean).join(" · ");

          return (
            <EntryCard
              handle={handle}
              name={exp.company || exp.jobTitle}
              title={exp.company}
              subtitle={exp.jobTitle}
              details={details}
              onEdit={() => toggleEdit(index)}
              onDelete={() => handleDelete(index)}
              deleteDisabled={isPending}
            />
          );
        }}
      />

      {action?.mode === "add" && (
        <AddExperience
          resumeId={resumeId}
          experienceIndex={undefined}
          experiences={experiences}
          onClose={() => setAction(null)}
          onLocalSave={onLocalChange ? handleLocalSave : undefined}
        />
      )}
    </>
  );
}

export default ExperienceCard;
