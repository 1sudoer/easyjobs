import { z } from "zod";

export const AddExperienceFormSchema = z.object({
  index: z.number().optional(),
  /** Where a new entry goes in the list; the end when absent. */
  insertAt: z.number().optional(),
  resumeId: z.string().optional(),
  title: z
    .string({
      error: "Job title is required.",
    })
    .min(2, {
      message: "Job title must be at least 2 characters.",
    }),
  company: z
    .string({
      error: "Company name is required.",
    })
    .min(2, {
      message: "Company name must be at least 2 characters.",
    }),
  location: z
    .string({
      error: "Location is required.",
    })
    .min(2, {
      message: "Location name must be at least 2 characters.",
    }),
  jobDescription: z.string().min(10, {
    message: "Job description must be at least 10 characters.",
  }),
  startDate: z.string().min(1, { message: "Start date is required." }),
  endDate: z.string().nullable().optional(),
  currentJob: z.boolean().default(false).optional(),
});
