-- AlterTable
ALTER TABLE "HouseholdHelp" ADD COLUMN     "employmentType" TEXT NOT NULL DEFAULT 'Part-Time';

-- AlterTable
ALTER TABLE "SeniorCitizen" ADD COLUMN     "freeTime" TEXT;

-- AlterTable
ALTER TABLE "SpouseDetails" ADD COLUMN     "weddingDate" TIMESTAMP(3);
