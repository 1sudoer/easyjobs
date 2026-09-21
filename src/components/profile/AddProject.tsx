"use client";
import { AddProjectFormSchema } from "@/models/addProjectForm.schema";
import { Project } from "@/models/profile.model";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Loader, X } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import TiptapEditor from "../TiptapEditor";
import { toast } from "../ui/use-toast";
import { addProject, updateProject } from "@/actions/profile.actions";

export type AddProjectProps = {
  resumeId: string | undefined;
  projectIndex: number | undefined;
  projects: Project[] | undefined;
  onClose: () => void;
  onLocalSave?: (project: Project, index?: number) => void;
};

/** Technologies are stored as an array but edited as a comma-separated list. */
const splitTechnologies = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

function AddProject({
  resumeId,
  projectIndex,
  projects,
  onClose,
  onLocalSave,
}: AddProjectProps) {
  const projectToEdit =
    projectIndex !== undefined ? projects?.[projectIndex] : undefined;

  const isEdit = !!projectToEdit;
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof AddProjectFormSchema>>({
    resolver: zodResolver(AddProjectFormSchema),
    defaultValues: isEdit
      ? {
          index: projectIndex,
          resumeId,
          name: projectToEdit.name,
          description: projectToEdit.description ?? "",
          technologies: (projectToEdit.technologies ?? []).join(", "),
          startDate: projectToEdit.startDate ?? "",
          endDate: projectToEdit.endDate ?? null,
          current: projectToEdit.current ?? false,
          url: projectToEdit.url ?? "",
          githubUrl: projectToEdit.githubUrl ?? "",
        }
      : {
          resumeId,
          name: "",
          description: "",
          technologies: "",
          startDate: "",
          endDate: null,
          current: false,
          url: "",
          githubUrl: "",
        },
  });

  const { formState } = form;

  const onSubmit = (data: z.infer<typeof AddProjectFormSchema>) => {
    if (onLocalSave) {
      onLocalSave(
        {
          name: data.name,
          description: data.description,
          technologies: splitTechnologies(data.technologies),
          startDate: data.startDate || undefined,
          endDate: data.endDate || null,
          current: data.current ?? false,
          url: data.url || undefined,
          githubUrl: data.githubUrl || undefined,
        },
        projectIndex,
      );
      form.reset(data);
      onClose();
      return;
    }
    startTransition(async () => {
      const res = isEdit ? await updateProject(data) : await addProject(data);
      if (!res.success) {
        toast({ variant: "destructive", title: "Error!", description: res.message });
      } else {
        form.reset();
        onClose();
        toast({
          variant: "success",
          description: `Project has been ${isEdit ? "updated" : "added"} successfully`,
        });
      }
    });
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {isEdit ? "Edit Project" : "Add Project"}
        </h3>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Resume Builder" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="technologies"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Technologies</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Comma separated, e.g. Next.js, Postgres"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="e.g. Jan 2022"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="e.g. Mar 2024 (leave blank if ongoing)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Live URL</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="https://example.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="githubUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repository URL</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="https://github.com/you/project"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <TiptapEditor field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!formState.isDirty || isPending}>
              Save
              {isPending && <Loader className="h-4 w-4 shrink-0 animate-spin ml-1" />}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default AddProject;
