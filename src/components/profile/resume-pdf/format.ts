import { format } from "date-fns";
import { socialProfile } from "@/lib/social-profiles";

/**
 * Text formatting shared by the PDF document and the HTML live preview, so the
 * two always print the same dates, links and separators.
 */

export function formatDate(date: Date | string | undefined | null): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? String(date) : format(parsed, "MMM yyyy");
}

export function dateRange(start?: string | null, end?: string | null, ongoing?: boolean): string {
  const from = start?.trim();
  const to = ongoing || !end?.trim() ? "Present" : end.trim();
  if (!from) return ongoing || end?.trim() ? to : "";
  return `${from} – ${to}`;
}

/** "Jan 2022 – Mar 2024", "Issued Apr 2022" or "Expires Apr 2025" for a certification. */
export function certificationDates(
  issueDate?: Date | string | null,
  expirationDate?: Date | string | null,
): string | null {
  const issued = formatDate(issueDate);
  const expires = formatDate(expirationDate);
  if (issued && expires) return `${issued} – ${expires}`;
  return issued ?? (expires ? `Expires ${expires}` : null);
}

export function clean(parts: (string | null | undefined)[]): string[] {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
}

/** Joins the non-empty parts, so no stray separators remain. */
export function joinParts(parts: (string | null | undefined)[], separator: string): string {
  return clean(parts).join(separator);
}

export function toHref(value: string): string {
  return /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
}

/** Shows a URL the way it is printed on a resume: no scheme, no `www.`, no trailing slash. */
export function displayUrl(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");
}

export type ContactItem = { label: string; href?: string };

/**
 * The contact line in print order: location, phone, email, LinkedIn, GitHub.
 * Profiles are stored as handles and printed as "LinkedIn" / "GitHub" links to
 * the full profile address.
 */
export function contactItems(contactInfo: {
  email?: string;
  phone?: string;
  address?: string;
  linkedin?: string;
  github?: string;
}): ContactItem[] {
  const email = contactInfo.email?.trim();
  const phone = contactInfo.phone?.trim();
  const linkedin = socialProfile("linkedin", contactInfo.linkedin);
  const github = socialProfile("github", contactInfo.github);
  return [
    contactInfo.address?.trim() ? { label: contactInfo.address.trim() } : null,
    phone ? { label: phone, href: `tel:${phone.replace(/[^\d+]/g, "")}` } : null,
    email ? { label: email, href: `mailto:${email}` } : null,
    // A value that is not a handle has no profile link to name; print it as is.
    linkedin ? (linkedin.href ? { label: "LinkedIn", href: linkedin.href } : linkedin) : null,
    github ? (github.href ? { label: "GitHub", href: github.href } : github) : null,
  ].filter((item): item is ContactItem => item !== null);
}
