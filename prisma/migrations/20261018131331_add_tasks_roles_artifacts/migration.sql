-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "audience" TEXT,
ADD COLUMN     "deliverableSpec" TEXT,
ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'debate',
ADD COLUMN     "objective" TEXT;

-- AlterTable
ALTER TABLE "Persona" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'contributor';

-- CreateTable
CREATE TABLE "Artifact" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'synthesis',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "providerId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Artifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Artifact_chatId_idx" ON "Artifact"("chatId");

-- CreateIndex
CREATE INDEX "Artifact_providerId_idx" ON "Artifact"("providerId");

-- CreateIndex
CREATE INDEX "Artifact_createdById_idx" ON "Artifact"("createdById");

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
