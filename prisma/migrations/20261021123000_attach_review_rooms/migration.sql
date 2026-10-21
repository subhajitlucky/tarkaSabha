-- AlterTable
ALTER TABLE "Decision" ADD COLUMN     "reviewRoomId" TEXT;

-- CreateIndex
CREATE INDEX "Decision_reviewRoomId_idx" ON "Decision"("reviewRoomId");

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_reviewRoomId_fkey" FOREIGN KEY ("reviewRoomId") REFERENCES "Chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

