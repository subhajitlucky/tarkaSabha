-- CreateTable
CREATE TABLE "DecisionPin" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "ownerId" TEXT,
    "decisionPoint" TEXT NOT NULL,
    "chosenValue" TEXT NOT NULL,
    "separatingTest" TEXT NOT NULL,
    "expectedResult" TEXT,
    "codeScope" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastRunAt" TIMESTAMP(3),
    "lastRunResult" TEXT,
    "supersessionTrigger" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionPin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DecisionPin_decisionId_status_idx" ON "DecisionPin"("decisionId", "status");

-- CreateIndex
CREATE INDEX "DecisionPin_ownerId_idx" ON "DecisionPin"("ownerId");

-- AddForeignKey
ALTER TABLE "DecisionPin" ADD CONSTRAINT "DecisionPin_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionPin" ADD CONSTRAINT "DecisionPin_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

