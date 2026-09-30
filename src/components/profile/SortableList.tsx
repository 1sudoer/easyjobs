"use client";
import { useId, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props for the drag handle. Spread them on the element the user grabs, so the
 * rest of the item — edit and delete buttons included — stays clickable.
 */
export type DragHandleProps = {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
  setActivatorNodeRef: ReturnType<typeof useSortable>["setActivatorNodeRef"];
  disabled: boolean;
};

interface SortableListProps<T> {
  items: T[];
  /** Receives the reordered array. */
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number, handle: DragHandleProps) => ReactNode;
  /** Stops dragging, e.g. while one of the items is open in an edit form. */
  disabled?: boolean;
  /**
   * A stable, unique key per item. Without it items are keyed by position,
   * which is fine for plain data but moves component state (an open form, say)
   * to whichever item lands in that position.
   */
  getKey?: (item: T) => string;
  className?: string;
}

/**
 * A vertical list the user can reorder by dragging an item's handle, or with the
 * keyboard: focus the handle, Space to pick up, arrows to move, Space to drop.
 *
 * Resume entries have no ids, so unless `getKey` is given items are identified
 * by position. That is safe because the array only changes on drop, never
 * mid-drag.
 */
export function SortableList<T>({
  items,
  onReorder,
  renderItem,
  disabled = false,
  getKey,
  className,
}: SortableListProps<T>) {
  const sensors = useSensors(
    // A few pixels of travel before a drag starts, so a click on the handle is
    // still just a click.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map((item, index) => (getKey ? getKey(item) : String(index)));
  // dnd-kit numbers its accessibility ids with a module counter, which differs
  // between the server render and the client; a React id keeps them in step.
  const contextId = useId();

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(items, from, to));
  };

  return (
    <DndContext
      id={contextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy} disabled={disabled}>
        <div className={className}>
          {items.map((item, index) => (
            <SortableItem key={ids[index]} id={ids[index]} disabled={disabled}>
              {(handle) => renderItem(item, index, handle)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled: boolean;
  children: (handle: DragHandleProps) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10 opacity-80 shadow-lg")}
    >
      {children({ attributes, listeners, setActivatorNodeRef, disabled })}
    </div>
  );
}

/**
 * The grip an item is dragged by. Kept in place but dimmed while dragging is
 * disabled, so cards do not shift sideways when a form opens.
 */
export function DragHandle({
  handle,
  label,
  className,
}: {
  handle: DragHandleProps;
  /** What is being moved, for screen readers, e.g. "Acme Corp". */
  label: string;
  className?: string;
}) {
  const { disabled } = handle;
  return (
    <button
      type="button"
      ref={handle.setActivatorNodeRef}
      {...(disabled ? {} : { ...handle.attributes, ...handle.listeners })}
      disabled={disabled}
      aria-label={`Reorder ${label}`}
      className={cn(
        "flex h-6 w-5 shrink-0 touch-none items-center justify-center rounded text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled
          ? "cursor-default opacity-30"
          : "cursor-grab hover:bg-muted hover:text-foreground active:cursor-grabbing",
        className,
      )}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
}
