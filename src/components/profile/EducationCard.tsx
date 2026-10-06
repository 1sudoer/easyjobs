"use client";
import { Education } from "@/models/profile.model";
import { useState, useTransition } from "react";
import { deleteEducation } from "@/actions/profile.actions";
import { toast } from "../ui/use-toast";
import { SortableList } from "./SortableList";
import { EntryCard } from "./EntryCard";
import { SectionHeaderRow } from "./SectionHeaderRow";
import AddEducation from "./AddEducation";

type ActiveAction = { mode: "add" } | { mode: "edit"; index: number } | null;

interface EducationCardProps {
  resumeId: string;
  educations: Education[];
  onLocalChange?: (educations: Education[]) => void;
}

function EducationCard({ resumeId, educations, onLocalChange }: EducationCardProps) {
  const [action, setAction] = useState<ActiveAction>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (index: number) => {
    if (onLocalChange) {
      onLocalChange(educations.filter((_, i) => i !== index));
      return;
    }
    startTransition(async () => {
      const res = await deleteEducation(index, resumeId);
      if (!res?.success) {
        toast({ variant: "destructive", title: "Failed to delete education." });
      }
    });
  };

  const handleLocalSave = (edu: Education, index?: number) => {
    if (!onLocalChange) return;
    onLocalChange(
      index !== undefined
        ? educations.map((e, i) => (i === index ? edu : e))
        : [...educations, edu],
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
      <SectionHeaderRow title="Education" onAction={toggleAdd} />

      <SortableList
        items={educations}
        // Entries are addressed by index, so reordering under an open form
        // would point the form at a different entry.
        disabled={action !== null || !onLocalChange}
        onReorder={(next) => onLocalChange?.(next)}
        className="space-y-3"
        renderItem={(edu, index, handle) => {
        const cardKey = `${edu.institution}_${String(edu.startDate)}`;

        if (action?.mode === "edit" && action.index === index) {
          return (
            <AddEducation
              key={`edit_${cardKey}`}
              resumeId={resumeId}
              educationIndex={index}
              educations={educations}
              onClose={() => setAction(null)}
              onLocalSave={onLocalChange ? handleLocalSave : undefined}
            />
          );
        }

        const degree = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(", ");
        const years = [edu.startDate, edu.endDate || "Present"].filter(Boolean).join(" – ");

        return (
          <EntryCard
            handle={handle}
            name={edu.institution}
            title={edu.institution}
            subtitle={[degree, edu.cgpa ? `GPA ${edu.cgpa}` : null].filter(Boolean).join(" · ")}
            details={[years, edu.location].filter(Boolean).join(" · ")}
            onEdit={() => toggleEdit(index)}
            onDelete={() => handleDelete(index)}
            deleteDisabled={isPending}
          />
        );
        }}
      />

      {action?.mode === "add" && (
        <AddEducation
          resumeId={resumeId}
          educationIndex={undefined}
          educations={educations}
          onClose={() => setAction(null)}
          onLocalSave={onLocalChange ? handleLocalSave : undefined}
        />
      )}
    </>
  );
}

export default EducationCard;
