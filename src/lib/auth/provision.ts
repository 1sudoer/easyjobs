import "server-only";
import prisma from "@/lib/db";
import { JOB_SOURCES, JOB_STATUSES } from "@/lib/constants";

/**
 * Identity lives entirely in Clerk — there is no local user table to mirror
 * into. What a new user still needs is a workspace: the per-user `JobSource`
 * rows and the global `JobStatus` reference data that the old `signup()` server
 * action used to create.
 *
 * Signing in on the central auth app is the only "signup" there is, so this
 * runs on a user's first authenticated request instead.
 */

// Per-process memo, so the check costs one query per user on a cold start and
// nothing thereafter. Restarting simply re-checks; it never double-seeds,
// because both writes below are idempotent.
const seeded = new Set<string>();

export async function ensureUserWorkspace(userId: string): Promise<void> {
  if (seeded.has(userId)) return;

  // Presence of the user's job sources is the "have I seen you before" marker
  // that the `User` row used to provide.
  const existing = await prisma.jobSource.count({ where: { createdBy: userId } });
  if (existing > 0) {
    seeded.add(userId);
    return;
  }

  await prisma.jobSource.createMany({
    data: JOB_SOURCES.map((source) => ({
      label: source.label,
      value: source.value,
      createdBy: userId,
    })),
    // Guards the race where two concurrent first requests both seed;
    // JobSource is unique on [value, createdBy].
    skipDuplicates: true,
  });

  // Job statuses are global reference data, not per user.
  for (const status of JOB_STATUSES) {
    await prisma.jobStatus.upsert({
      where: { value: status.value },
      update: {},
      create: status,
    });
  }

  seeded.add(userId);
}
