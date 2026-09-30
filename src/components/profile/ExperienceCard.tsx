"use client";
import { WorkExperience } from "@/models/profile.model";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";
import { deleteExperience } from "@/actions/profile.actions";
import { toast } from "../ui/use-toast";
import AddExperience from "./AddExperience";
import { DragHandle, SortableList } from "./SortableList";
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
  /** Grip for reordering the whole section. */
  dragHandle?: ReactNode;
}

function ExperienceCard({ resumeId, experiences, onLocalChange, dragHandle }: ExperienceCardProps) {
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
      <SectionHeaderRow title="Experience" onAdd={toggleAdd} dragHandle={dragHandle} />

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
            <Card className="group flex items-start gap-1 py-2 pl-1 pr-1">
              <DragHandle
                handle={handle}
                label={exp.company || exp.jobTitle}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{exp.company}</p>
                <p className="truncate text-sm">{exp.jobTitle}</p>
                {details && (
                  <p className="truncate text-xs text-muted-foreground">{details}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  aria-label={`Edit ${exp.company || exp.jobTitle}`}
                  onClick={() => toggleEdit(index)}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  aria-label={`Delete ${exp.company || exp.jobTitle}`}
                  disabled={isPending}
                  onClick={() => handleDelete(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
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
