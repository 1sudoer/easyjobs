"use client";
import { Project } from "@/models/profile.model";
import { useState, useTransition } from "react";
import { deleteProject } from "@/actions/profile.actions";
import { toast } from "../ui/use-toast";
import { SortableList } from "./SortableList";
import { EntryCard } from "./EntryCard";
import { displayUrl } from "./resume-pdf/format";
import { SectionHeaderRow } from "./SectionHeaderRow";
import AddProject from "./AddProject";

type ActiveAction = { mode: "add" } | { mode: "edit"; index: number } | null;

interface ProjectCardProps {
  resumeId: string;
  projects: Project[];
  onLocalChange?: (projects: Project[]) => void;
}

function ProjectCard({ resumeId, projects, onLocalChange }: ProjectCardProps) {
  const [action, setAction] = useState<ActiveAction>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (index: number) => {
    if (onLocalChange) {
      onLocalChange(projects.filter((_, i) => i !== index));
      return;
    }
    startTransition(async () => {
      const res = await deleteProject(index, resumeId);
      if (!res?.success) {
        toast({ variant: "destructive", title: "Failed to delete project." });
      }
    });
  };

  const handleLocalSave = (project: Project, index?: number) => {
    if (!onLocalChange) return;
    onLocalChange(
      index !== undefined
        ? projects.map((p, i) => (i === index ? project : p))
        : [...projects, project],
    );
  };

  const toggleAdd = () =>
    setAction((prev) => (prev?.mode === "add" ? null : { mode: "add" }));

  const toggleEdit = (index: number) =>
    setAction((prev) =>
      prev?.mode === "edit" && prev.index === index ? null : { mode: "edit", index },
    );

  return (
    <>
      <SectionHeaderRow title="Projects" onAction={toggleAdd} />

      <SortableList
        items={projects}
        // Entries are addressed by index, so reordering under an open form
        // would point the form at a different entry.
        disabled={action !== null || !onLocalChange}
        onReorder={(next) => onLocalChange?.(next)}
        className="space-y-3"
        renderItem={(project, index, handle) => {
        const cardKey = `${project.name}_${project.startDate ?? ""}_${index}`;

        if (action?.mode === "edit" && action.index === index) {
          return (
            <AddProject
              key={`edit_${cardKey}`}
              resumeId={resumeId}
              projectIndex={index}
              projects={projects}
              onClose={() => setAction(null)}
              onLocalSave={onLocalChange ? handleLocalSave : undefined}
            />
          );
        }

        const dates = [project.startDate, project.current ? "Present" : project.endDate]
          .filter(Boolean)
          .join(" – ");
        const links = [project.url, project.githubUrl]
          .map((link) => link?.trim())
          .filter((link): link is string => Boolean(link))
          .map(displayUrl);

        return (
          <EntryCard
            handle={handle}
            name={project.name}
            title={project.name}
            subtitle={project.technologies?.length ? project.technologies.join(", ") : undefined}
            details={[dates, ...links].filter(Boolean).join(" · ")}
            onEdit={() => toggleEdit(index)}
            onDelete={() => handleDelete(index)}
            deleteDisabled={isPending}
          />
        );
        }}
      />

      {action?.mode === "add" && (
        <AddProject
          resumeId={resumeId}
          projectIndex={undefined}
          projects={projects}
          onClose={() => setAction(null)}
          onLocalSave={onLocalChange ? handleLocalSave : undefined}
        />
      )}
    </>
  );
}

export default ProjectCard;
