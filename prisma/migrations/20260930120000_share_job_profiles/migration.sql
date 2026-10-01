-- Job profiles are shared by every signed-in user, so "default profile" moves
-- from a flag on the shared profile to a per-user choice.

-- CreateTable
CREATE TABLE "JobProfileDefault" (
    "userId" TEXT NOT NULL,
    "jobProfileId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobProfileDefault_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "JobProfileDefault_jobProfileId_idx" ON "JobProfileDefault"("jobProfileId");

-- AddForeignKey
ALTER TABLE "JobProfileDefault" ADD CONSTRAINT "JobProfileDefault_jobProfileId_fkey" FOREIGN KEY ("jobProfileId") REFERENCES "JobProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Keep each owner's current default. Only one per user was allowed; should a
-- user somehow have several, the oldest wins, matching the old list order.
INSERT INTO "JobProfileDefault" ("userId", "jobProfileId", "updatedAt")
SELECT DISTINCT ON ("userId") "userId", "id", CURRENT_TIMESTAMP
FROM "JobProfile"
WHERE "isDefault"
ORDER BY "userId", "createdAt";

-- AlterTable
ALTER TABLE "JobProfile" DROP COLUMN "isDefault";
