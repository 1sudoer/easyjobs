import "server-only";
import { auth } from "@clerk/nextjs/server";
import { ensureUserWorkspace } from "@/lib/auth/provision";
import { CurrentUser } from "@/models/user.model";

/**
 * The signed-in Clerk user id, or null.
 *
 * Reads the session token only — no database, no Clerk API call.
 */
export const getAuthUserId = async (): Promise<string | null> => {
  const { userId } = await auth();
  return userId ?? null;
};

/**
 * The signed-in user, for server code that needs to scope a query by owner.
 *
 * Only carries the id: profile fields come from Clerk in client components.
 * Also makes sure the user's workspace has been seeded — memoised, so after the
 * first request in a process this adds no query.
 */
export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  const userId = await getAuthUserId();
  if (!userId) return null;

  await ensureUserWorkspace(userId);

  return { id: userId };
};
