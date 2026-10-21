-- CreateTable
CREATE TABLE "DecisionCandidate" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "context" TEXT,
    "proposal" TEXT,
    "rationale" TEXT,
    "confidence" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateEvidence" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "quote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DecisionCandidate_decisionId_key" ON "DecisionCandidate"("decisionId");

-- CreateIndex
CREATE INDEX "DecisionCandidate_workspaceId_status_idx" ON "DecisionCandidate"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "DecisionCandidate_sourceId_status_idx" ON "DecisionCandidate"("sourceId", "status");

-- CreateIndex
CREATE INDEX "CandidateEvidence_snapshotId_idx" ON "CandidateEvidence"("snapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateEvidence_candidateId_snapshotId_key" ON "CandidateEvidence"("candidateId", "snapshotId");

-- AddForeignKey
ALTER TABLE "DecisionCandidate" ADD CONSTRAINT "DecisionCandidate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionCandidate" ADD CONSTRAINT "DecisionCandidate_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "WorkspaceSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionCandidate" ADD CONSTRAINT "DecisionCandidate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionCandidate" ADD CONSTRAINT "DecisionCandidate_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateEvidence" ADD CONSTRAINT "CandidateEvidence_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "DecisionCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateEvidence" ADD CONSTRAINT "CandidateEvidence_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "SourceSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

