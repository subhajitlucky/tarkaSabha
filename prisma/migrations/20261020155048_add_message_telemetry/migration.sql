-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "inputTokens" INTEGER,
ADD COLUMN     "latencyMs" INTEGER,
ADD COLUMN     "outputTokens" INTEGER,
ADD COLUMN     "selectionReason" TEXT;
