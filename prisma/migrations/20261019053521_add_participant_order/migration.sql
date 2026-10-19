-- AlterTable
ALTER TABLE "PersonaOnChat" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "PersonaOnChat_chatId_sortOrder_idx" ON "PersonaOnChat"("chatId", "sortOrder");

-- Backfill existing participants so any environment that already has chats keeps
-- a stable speaking order instead of every row collapsing to 0. joinedAt alone
-- is not enough (Postgres now() is transaction-time, so participants added in a
-- single call share a timestamp), hence the id tiebreak.
WITH ordered AS (
  SELECT id, row_number() OVER (PARTITION BY "chatId" ORDER BY "joinedAt", id) - 1 AS rn
  FROM "PersonaOnChat"
)
UPDATE "PersonaOnChat" p SET "sortOrder" = o.rn FROM ordered o WHERE p.id = o.id;
