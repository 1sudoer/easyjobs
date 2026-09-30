import { z } from "zod";
import { extractHandle, isValidHandle, type SocialNetwork } from "@/lib/social-profiles";

/**
 * An optional profile field holding a handle or a pasted URL. It is validated
 * here and reduced to the handle when saved (`withStoredHandles`).
 */
const socialHandle = (network: SocialNetwork, label: string) =>
  z
    .string()
    .optional()
    .refine((value) => {
      const handle = extractHandle(network, value);
      return !handle || isValidHandle(network, handle);
    }, {
      message: `Enter your ${label} username, e.g. the part after ${
        network === "linkedin" ? "linkedin.com/in/" : "github.com/"
      }.`,
    });

export const AddContactInfoFormSchema = z.object({
  resumeId: z.string().optional(),
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email."),
  headline: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  github: socialHandle("github", "GitHub"),
  linkedin: socialHandle("linkedin", "LinkedIn"),
});
