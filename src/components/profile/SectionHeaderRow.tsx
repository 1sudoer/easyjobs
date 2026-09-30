import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";

interface SectionHeaderRowProps {
  title: string;
  onAdd: () => void;
  /** Grip for reordering the whole section, shown before the title. */
  dragHandle?: ReactNode;
}

/** A section's title with an Add button: the header of a list section, or the whole row of an empty one. */
export function SectionHeaderRow({ title, onAdd, dragHandle }: SectionHeaderRowProps) {
  return (
    <div
      className={`flex items-center justify-between pr-1 py-1 ${dragHandle ? "pl-1" : "pl-4"}`}
    >
      <div className="flex items-center gap-1">
        {dragHandle}
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={onAdd}>
        <Plus className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap text-xs">Add</span>
      </Button>
    </div>
  );
}
