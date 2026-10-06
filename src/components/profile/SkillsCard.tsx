"use client";
import { SkillCategory } from "@/models/profile.model";
import { useTransition } from "react";
import { deleteSkillCategory } from "@/actions/profile.actions";
import { toast } from "../ui/use-toast";
import { SortableList } from "./SortableList";
import { EntryCard } from "./EntryCard";
import { SectionHeaderRow } from "./SectionHeaderRow";

interface SkillsCardProps {
  resumeId: string;
  skills: SkillCategory[];
  onEdit: (sc: SkillCategory, index: number) => void;
  onAdd: () => void;
  onLocalDelete?: (index: number) => void;
  /** Receives the categories in their new order; dragging is off without it. */
  onReorder?: (skills: SkillCategory[]) => void;
  /** Stops dragging, e.g. while a category is open in the edit form. */
  reorderDisabled?: boolean;
}

function SkillsCard({
  resumeId,
  skills,
  onEdit,
  onAdd,
  onLocalDelete,
  onReorder,
  reorderDisabled = false,
}: SkillsCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (index: number) => {
    if (onLocalDelete) {
      onLocalDelete(index);
      return;
    }
    startTransition(async () => {
      const res = await deleteSkillCategory(index, resumeId);
      if (!res.success) {
        toast({ variant: "destructive", title: "Failed to delete skill." });
      }
    });
  };

  return (
    <>
      <SectionHeaderRow title="Skills" onAction={onAdd} />
      <SortableList
        items={skills}
        disabled={reorderDisabled || !onReorder}
        onReorder={(next) => onReorder?.(next)}
        className="space-y-2"
        renderItem={(sc, index, handle) => (
          <EntryCard
            handle={handle}
            name={sc.label}
            title={sc.label}
            subtitle={sc.details.join(", ")}
            onEdit={() => onEdit(sc, index)}
            onDelete={() => handleDelete(index)}
            deleteDisabled={isPending}
          />
        )}
      />
    </>
  );
}

export default SkillsCard;
