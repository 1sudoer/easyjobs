import { Edit, Plus } from "lucide-react";
import { Button } from "../ui/button";

interface SectionHeaderRowProps {
  title: string;
  onAction: () => void;
  /** "Add" for a list section or an empty one; "Edit" for a filled single-value section. */
  actionLabel?: "Add" | "Edit";
}

/**
 * A section's title with its action button. Every section in the editor opens
 * with one, so they all read the same; entries follow as `EntryCard`s.
 */
export function SectionHeaderRow({ title, onAction, actionLabel = "Add" }: SectionHeaderRowProps) {
  const Icon = actionLabel === "Edit" ? Edit : Plus;
  return (
    <div className="flex items-center justify-between pl-4 pr-1 py-1">
      <span className="text-sm font-semibold">{title}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1"
        aria-label={`${actionLabel} ${title}`}
        onClick={onAction}
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap text-xs">{actionLabel}</span>
      </Button>
    </div>
  );
}
