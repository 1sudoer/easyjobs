"use client";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { SkillCategory } from "@/models/profile.model";
import { useTransition, type ReactNode } from "react";
import { deleteSkillCategory } from "@/actions/profile.actions";
import { toast } from "../ui/use-toast";
import { DragHandle, SortableList } from "./SortableList";

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
  /** Grip for reordering the whole section. */
  dragHandle?: ReactNode;
}

function SkillsCard({
  resumeId,
  skills,
  onEdit,
  onAdd,
  onLocalDelete,
  onReorder,
  reorderDisabled = false,
  dragHandle,
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
    <Card>
      <CardHeader className="flex-row justify-between items-center relative">
        <div className={`flex items-center gap-1 ${dragHandle ? "-ml-3" : ""}`}>
          {dragHandle}
          <CardTitle>Skills</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1"
          onClick={onAdd}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add
          </span>
        </Button>
      </CardHeader>
      <CardContent>
        <SortableList
          items={skills}
          disabled={reorderDisabled || !onReorder}
          onReorder={(next) => onReorder?.(next)}
          className="space-y-1"
          renderItem={(sc, index, handle) => (
            <div className="group flex items-start gap-1 rounded bg-card">
              <DragHandle handle={handle} label={sc.label} className="-ml-2" />
              <p className="min-w-0 flex-1 text-sm">
                <span className="font-semibold">{sc.label}:</span>{" "}
                {sc.details.join(", ")}
              </p>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity shrink-0 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  aria-label={`Edit ${sc.label}`}
                  onClick={() => onEdit(sc, index)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive"
                  aria-label={`Delete ${sc.label}`}
                  disabled={isPending}
                  onClick={() => handleDelete(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}

export default SkillsCard;
