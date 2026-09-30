-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "sectionOrder" TEXT[] DEFAULT ARRAY[]::TEXT[];
