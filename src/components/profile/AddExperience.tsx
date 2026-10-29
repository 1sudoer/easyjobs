"use client";
import { AddExperienceFormSchema } from "@/models/addExperienceForm.schema";
import { WorkExperience } from "@/models/profile.model";
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
import { addExperience, updateExperience } from "@/actions/profile.actions";

export type AddExperienceProps = {
  resumeId: string | undefined;
  experienceIndex: number | undefined;
  experiences: WorkExperience[] | undefined;
  onClose: () => void;
  onLocalSave?: (exp: WorkExperience, index?: number) => void;
  /** A new role at an existing company: the company and location to start from, and where the entry goes. */
  newRole?: { company: string; location: string; insertAt: number };
};

function AddExperience({
  resumeId,
  experienceIndex,
  experiences,
  onClose,
  onLocalSave,
  newRole,
}: AddExperienceProps) {
  const experienceToEdit =
    experienceIndex !== undefined ? experiences?.[experienceIndex] : undefined;

  const isEdit = !!experienceToEdit;
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof AddExperienceFormSchema>>({
    resolver: zodResolver(AddExperienceFormSchema),
    defaultValues: isEdit
      ? {
          index: experienceIndex,
          resumeId,
          title: experienceToEdit.jobTitle,
          company: experienceToEdit.company,
          location: experienceToEdit.location ?? "",
          startDate: experienceToEdit.startDate,
          endDate: experienceToEdit.endDate ?? null,
          jobDescription: experienceToEdit.description ?? "",
          currentJob: false,
        }
      : {
          resumeId,
          ...(newRole && {
            company: newRole.company,
            location: newRole.location,
            insertAt: newRole.insertAt,
          }),
          startDate: "",
          endDate: null,
          jobDescription: "",
          currentJob: false,
        },
  });

  const { formState } = form;

  const onSubmit = (data: z.infer<typeof AddExperienceFormSchema>) => {
    if (onLocalSave) {
      onLocalSave(
        {
          jobTitle: data.title,
          company: data.company,
          location: data.location ?? "",
          startDate: data.startDate,
          endDate: data.endDate ?? null,
          currentJob: data.currentJob ?? false,
          description: data.jobDescription,
        },
        experienceIndex,
      );
      form.reset(data);
      onClose();
      return;
    }
    startTransition(async () => {
      const res = isEdit ? await updateExperience(data) : await addExperience(data);
      if (!res.success) {
        toast({ variant: "destructive", title: "Error!", description: res.message });
      } else {
        form.reset();
        onClose();
        toast({
          variant: "success",
          description: `Experience has been ${isEdit ? "updated" : "added"} successfully`,
        });
      }
    });
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {isEdit ? "Edit Experience" : newRole ? `Add Role at ${newRole.company}` : "Add Experience"}
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
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Software Engineer" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Acme Corp" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Toronto, ON" />
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
                  <Input {...field} placeholder="e.g. Jan 2022" />
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
                    placeholder="e.g. Mar 2024 (leave blank if current)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="jobDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
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

export default AddExperience;
