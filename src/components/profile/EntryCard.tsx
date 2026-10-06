"use client";
import type { ReactNode } from "react";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { DragHandle, type DragHandleProps } from "./SortableList";

/**
 * One entry of a resume section in the editor: a compact card with a drag
 * grip, up to three lines (title, subtitle, details) and edit/delete buttons.
 * Every section's entries use it, so the editor reads the same throughout.
 */
export function EntryCard({
  handle,
  name,
  title,
  subtitle,
  details,
  onEdit,
  onDelete,
  deleteDisabled = false,
}: {
  handle: DragHandleProps;
  /** What the entry is called, for screen-reader labels, e.g. "Acme Corp". */
  name: string;
  title: ReactNode;
  subtitle?: ReactNode;
  details?: ReactNode;
  onEdit: () => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
}) {
  return (
    <Card className="flex items-start gap-1 py-2 pl-1 pr-1">
      <DragHandle handle={handle} label={name} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        {subtitle ? <p className="line-clamp-2 text-sm">{subtitle}</p> : null}
        {details ? <p className="truncate text-xs text-muted-foreground">{details}</p> : null}
      </div>
      <div className="flex shrink-0 gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          aria-label={`Edit ${name}`}
          onClick={onEdit}
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
        {onDelete ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            aria-label={`Delete ${name}`}
            disabled={deleteDisabled}
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
