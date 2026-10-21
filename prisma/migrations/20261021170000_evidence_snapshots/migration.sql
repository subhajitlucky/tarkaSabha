-- AlterTable
ALTER TABLE "Evidence" ADD COLUMN     "snapshotId" TEXT;

-- CreateIndex
CREATE INDEX "Evidence_snapshotId_idx" ON "Evidence"("snapshotId");

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "SourceSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

