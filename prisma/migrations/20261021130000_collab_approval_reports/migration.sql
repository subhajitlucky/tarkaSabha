-- DropIndex
DROP INDEX "Report_decisionId_version_idx";

-- AlterTable
ALTER TABLE "Approval" ADD COLUMN     "contentHash" TEXT;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "contentHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Report_decisionId_version_key" ON "Report"("decisionId", "version");

