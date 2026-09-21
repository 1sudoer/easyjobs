import { z } from "zod";

export const AddProjectFormSchema = z.object({
  index: z.number().optional(),
  resumeId: z.string().optional(),
  name: z
    .string({
      error: "Project name is required.",
    })
    .min(2, {
      message: "Project name must be at least 2 characters.",
    }),
  description: z.string().min(10, {
    message: "Project description must be at least 10 characters.",
  }),
  /** Comma-separated in the form; split into an array before saving. */
  technologies: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  current: z.boolean().default(false).optional(),
  url: z
    .string()
    .url({ message: "Enter a valid URL." })
    .optional()
    .or(z.literal("")),
  githubUrl: z
    .string()
    .url({ message: "Enter a valid URL." })
    .optional()
    .or(z.literal("")),
});
