-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "autoAdvanceAt" TIMESTAMP(3),
ADD COLUMN     "turnCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "turnsRemaining" INTEGER;

-- CreateIndex
CREATE INDEX "Chat_creatorId_idx" ON "Chat"("creatorId");

-- CreateIndex
CREATE INDEX "Chat_isAutoMode_autoAdvanceAt_idx" ON "Chat"("isAutoMode", "autoAdvanceAt");

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- CreateIndex
CREATE INDEX "Message_chatId_idx" ON "Message"("chatId");

-- CreateIndex
CREATE INDEX "Message_personaId_idx" ON "Message"("personaId");

-- CreateIndex
CREATE INDEX "Persona_creatorId_idx" ON "Persona"("creatorId");

-- CreateIndex
CREATE INDEX "Persona_providerId_idx" ON "Persona"("providerId");

-- CreateIndex
CREATE INDEX "Provider_creatorId_idx" ON "Provider"("creatorId");
