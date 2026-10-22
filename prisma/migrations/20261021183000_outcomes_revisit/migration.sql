-- AlterTable
ALTER TABLE "Decision" ADD COLUMN     "outcome" TEXT,
ADD COLUMN     "outcomeAt" TIMESTAMP(3),
ADD COLUMN     "outcomeSummary" TEXT,
ADD COLUMN     "revisitAt" TIMESTAMP(3);

