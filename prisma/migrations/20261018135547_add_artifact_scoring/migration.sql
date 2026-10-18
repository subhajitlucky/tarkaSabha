-- AlterTable
ALTER TABLE "Artifact" ADD COLUMN     "angle" TEXT,
ADD COLUMN     "breakdown" JSONB,
ADD COLUMN     "round" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "score" DOUBLE PRECISION,
ADD COLUMN     "selected" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Artifact_chatId_kind_selected_idx" ON "Artifact"("chatId", "kind", "selected");
