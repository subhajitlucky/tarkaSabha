-- AlterTable
ALTER TABLE "Decision" ADD COLUMN     "debtRationale" TEXT,
ADD COLUMN     "debtScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scoredAt" TIMESTAMP(3);

