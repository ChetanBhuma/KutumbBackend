-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "isMultiSelect" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jurisdictionLevel" TEXT NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "_OfficerManagedBeats" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_OfficerManagedRanges" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_OfficerManagedDistricts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_OfficerManagedSubDivisions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_OfficerManagedPoliceStations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_OfficerManagedBeats_AB_unique" ON "_OfficerManagedBeats"("A", "B");

-- CreateIndex
CREATE INDEX "_OfficerManagedBeats_B_index" ON "_OfficerManagedBeats"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_OfficerManagedRanges_AB_unique" ON "_OfficerManagedRanges"("A", "B");

-- CreateIndex
CREATE INDEX "_OfficerManagedRanges_B_index" ON "_OfficerManagedRanges"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_OfficerManagedDistricts_AB_unique" ON "_OfficerManagedDistricts"("A", "B");

-- CreateIndex
CREATE INDEX "_OfficerManagedDistricts_B_index" ON "_OfficerManagedDistricts"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_OfficerManagedSubDivisions_AB_unique" ON "_OfficerManagedSubDivisions"("A", "B");

-- CreateIndex
CREATE INDEX "_OfficerManagedSubDivisions_B_index" ON "_OfficerManagedSubDivisions"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_OfficerManagedPoliceStations_AB_unique" ON "_OfficerManagedPoliceStations"("A", "B");

-- CreateIndex
CREATE INDEX "_OfficerManagedPoliceStations_B_index" ON "_OfficerManagedPoliceStations"("B");

-- AddForeignKey
ALTER TABLE "_OfficerManagedBeats" ADD CONSTRAINT "_OfficerManagedBeats_A_fkey" FOREIGN KEY ("A") REFERENCES "Beat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OfficerManagedBeats" ADD CONSTRAINT "_OfficerManagedBeats_B_fkey" FOREIGN KEY ("B") REFERENCES "BeatOfficer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OfficerManagedRanges" ADD CONSTRAINT "_OfficerManagedRanges_A_fkey" FOREIGN KEY ("A") REFERENCES "BeatOfficer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OfficerManagedRanges" ADD CONSTRAINT "_OfficerManagedRanges_B_fkey" FOREIGN KEY ("B") REFERENCES "Range"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OfficerManagedDistricts" ADD CONSTRAINT "_OfficerManagedDistricts_A_fkey" FOREIGN KEY ("A") REFERENCES "BeatOfficer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OfficerManagedDistricts" ADD CONSTRAINT "_OfficerManagedDistricts_B_fkey" FOREIGN KEY ("B") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OfficerManagedSubDivisions" ADD CONSTRAINT "_OfficerManagedSubDivisions_A_fkey" FOREIGN KEY ("A") REFERENCES "BeatOfficer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OfficerManagedSubDivisions" ADD CONSTRAINT "_OfficerManagedSubDivisions_B_fkey" FOREIGN KEY ("B") REFERENCES "SubDivision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OfficerManagedPoliceStations" ADD CONSTRAINT "_OfficerManagedPoliceStations_A_fkey" FOREIGN KEY ("A") REFERENCES "BeatOfficer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OfficerManagedPoliceStations" ADD CONSTRAINT "_OfficerManagedPoliceStations_B_fkey" FOREIGN KEY ("B") REFERENCES "PoliceStation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
