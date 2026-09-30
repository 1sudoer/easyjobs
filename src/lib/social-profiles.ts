/**
 * LinkedIn and GitHub profiles are stored as bare handles ("jordantaylor"), and
 * shown and linked as full profile addresses built from them. The parsers also
 * accept whatever a user pastes (a full URL with tracking parameters, "@handle",
 * a scheme-less address), and values saved as URLs before handles were enforced.
 */

export type SocialNetwork = "linkedin" | "github";

type NetworkSpec = {
  /** Printed address before the handle, as it appears on a resume. */
  displayPrefix: string;
  /** Link target before the handle. */
  urlPrefix: string;
  /** Host and optional path prefix a pasted URL starts with. */
  urlPattern: RegExp;
  /** What a handle may contain once extracted. */
  handlePattern: RegExp;
};

const NETWORKS: Record<SocialNetwork, NetworkSpec> = {
  linkedin: {
    displayPrefix: "linkedin.com/in/",
    urlPrefix: "https://www.linkedin.com/in/",
    // linkedin.com/in/…, with optional country subdomain (uk., de., …) or www.
    urlPattern: /^(?:https?:\/\/)?(?:[a-z]{2,3}\.|www\.)?linkedin\.com\/(?:in|pub)\//i,
    // Letters (any script), digits and hyphens; LinkedIn allows 3–100.
    handlePattern: /^[\p{L}\p{N}-]{3,100}$/u,
  },
  github: {
    displayPrefix: "github.com/",
    urlPrefix: "https://github.com/",
    urlPattern: /^(?:https?:\/\/)?(?:www\.)?github\.com\//i,
    // Alphanumerics and single inner hyphens, at most 39 characters.
    handlePattern: /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i,
  },
};

/**
 * The handle in `value`, or "" when it is empty. A profile URL is reduced to
 * its handle (sub-paths, query and fragment dropped) and a leading "@" is
 * removed; any other text is returned as typed, so that something like
 * "bad name!" fails `isValidHandle` instead of being cut down to "bad".
 */
export function extractHandle(network: SocialNetwork, value: string | null | undefined): string {
  let text = value?.trim() ?? "";
  if (!text) return "";
  const { urlPattern } = NETWORKS[network];
  if (urlPattern.test(text)) {
    text = text.replace(urlPattern, "").split(/[/?#]/)[0] ?? "";
    try {
      // LinkedIn percent-encodes non-Latin vanity names in its URLs.
      text = decodeURIComponent(text);
    } catch {
      // Not valid percent-encoding; keep the text as it was.
    }
  }
  return text.replace(/^@/, "");
}

export function isValidHandle(network: SocialNetwork, handle: string): boolean {
  return NETWORKS[network].handlePattern.test(handle);
}

/** The printed address and link for a stored value, or null when there is none. */
export function socialProfile(
  network: SocialNetwork,
  value: string | null | undefined,
): { handle: string; label: string; href: string } | null {
  const handle = extractHandle(network, value);
  if (!handle) return null;
  const { displayPrefix, urlPrefix } = NETWORKS[network];
  return {
    handle,
    label: `${displayPrefix}${handle}`,
    href: `${urlPrefix}${encodeURIComponent(handle)}`,
  };
}

/** Printed address before the handle, e.g. for an input's prefix. */
export function socialDisplayPrefix(network: SocialNetwork): string {
  return NETWORKS[network].displayPrefix;
}

/** Stored form of a profile value: the bare handle, or null when empty. */
export function toStoredHandle(
  network: SocialNetwork,
  value: string | null | undefined,
): string | null {
  return extractHandle(network, value) || null;
}

/** A contact block with its LinkedIn and GitHub values reduced to handles. */
export function withStoredHandles<T extends { linkedin?: string | null; github?: string | null }>(
  contact: T,
): T {
  return {
    ...contact,
    linkedin: toStoredHandle("linkedin", contact.linkedin) ?? undefined,
    github: toStoredHandle("github", contact.github) ?? undefined,
  };
}
