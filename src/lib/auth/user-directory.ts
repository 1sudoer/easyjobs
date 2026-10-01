import "server-only";
import { clerkClient } from "@clerk/nextjs/server";

/** What other users may see about a user: a display name and an avatar. */
export type UserSummary = {
  id: string;
  name: string;
  imageUrl: string | null;
};

/** Profiles rarely change hands or names; a few minutes of staleness is fine. */
const TTL_MS = 5 * 60 * 1000;
/** Clerk's `getUserList` accepts at most 100 ids per call. */
const BATCH_SIZE = 100;

const cache = new Map<string, { summary: UserSummary; expires: number }>();

function unknownUser(id: string): UserSummary {
  return { id, name: "Unknown user", imageUrl: null };
}

/**
 * Display names and avatars for the given Clerk user ids, looked up in batches
 * and cached per process. Identity lives only in Clerk, so this is the one
 * place other users' names come from. A user Clerk no longer knows, or a
 * failed lookup, comes back as "Unknown user" rather than failing the request.
 */
export async function getUserSummaries(ids: Iterable<string>): Promise<Map<string, UserSummary>> {
  const now = Date.now();
  const result = new Map<string, UserSummary>();
  const missing: string[] = [];

  for (const id of new Set(ids)) {
    const hit = cache.get(id);
    if (hit && hit.expires > now) result.set(id, hit.summary);
    else missing.push(id);
  }

  if (missing.length > 0) {
    try {
      const client = await clerkClient();
      for (let i = 0; i < missing.length; i += BATCH_SIZE) {
        const batch = missing.slice(i, i + BATCH_SIZE);
        const { data } = await client.users.getUserList({ userId: batch, limit: batch.length });
        for (const user of data) {
          const name =
            [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
            user.username ||
            user.primaryEmailAddress?.emailAddress ||
            "Unknown user";
          const summary = { id: user.id, name, imageUrl: user.imageUrl || null };
          cache.set(user.id, { summary, expires: now + TTL_MS });
          result.set(user.id, summary);
        }
      }
    } catch (error) {
      console.error("Failed to look up users in Clerk", error);
    }
    for (const id of missing) {
      if (!result.has(id)) result.set(id, unknownUser(id));
    }
  }

  return result;
}
