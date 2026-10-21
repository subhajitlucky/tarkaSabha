-- CreateTable
CREATE TABLE "WorkspaceSource" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'github',
    "repoUrl" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "error" TEXT,
    "fileCount" INTEGER NOT NULL DEFAULT 0,
    "commitCount" INTEGER NOT NULL DEFAULT 0,
    "pullRequestCount" INTEGER NOT NULL DEFAULT 0,
    "issueCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceSnapshot" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "url" TEXT NOT NULL,
    "sha" TEXT,
    "sha256" TEXT,
    "size" INTEGER,
    "metadata" JSONB,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkspaceSource_workspaceId_updatedAt_idx" ON "WorkspaceSource"("workspaceId", "updatedAt");

-- CreateIndex
CREATE INDEX "SourceSnapshot_sourceId_kind_idx" ON "SourceSnapshot"("sourceId", "kind");

-- CreateIndex
CREATE INDEX "SourceSnapshot_sourceId_path_idx" ON "SourceSnapshot"("sourceId", "path");

-- AddForeignKey
ALTER TABLE "WorkspaceSource" ADD CONSTRAINT "WorkspaceSource_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceSource" ADD CONSTRAINT "WorkspaceSource_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceSnapshot" ADD CONSTRAINT "SourceSnapshot_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "WorkspaceSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

