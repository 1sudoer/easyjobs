"use client";
import { Project } from "@/models/profile.model";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Edit, ExternalLink, Github, Plus, Trash2 } from "lucide-react";
import { TipTapContentViewer } from "../TipTapContentViewer";
import { useState, useTransition } from "react";
import { deleteProject } from "@/actions/profile.actions";
import { toast } from "../ui/use-toast";
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
      <div className="flex items-center justify-between pl-4 pr-1 py-1">
        <span className="text-sm font-semibold">Projects</span>
        <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={toggleAdd}>
          <Plus className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap text-xs">Add</span>
        </Button>
      </div>

      {projects.map((project, index) => {
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

        return (
          <Card key={cardKey}>
            <CardHeader className="p-2 pb-0 flex-row justify-between relative">
              <CardTitle className="text-xl pl-4">{project.name}</CardTitle>
              <div className="flex gap-0.5 absolute top-0 right-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => toggleEdit(index)}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  disabled={isPending}
                  onClick={() => handleDelete(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {project.technologies?.length ? (
                <h3>{project.technologies.join(", ")}</h3>
              ) : null}
              {dates && <CardDescription>{dates}</CardDescription>}
              {(project.url || project.githubUrl) && (
                <div className="flex flex-wrap gap-3 mt-1">
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-500 hover:underline"
                    >
                      Live
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-500 hover:underline"
                    >
                      Repository
                      <Github className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              )}
              <div className="pt-2">
                <TipTapContentViewer content={project.description ?? ""} />
              </div>
            </CardContent>
          </Card>
        );
      })}

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
