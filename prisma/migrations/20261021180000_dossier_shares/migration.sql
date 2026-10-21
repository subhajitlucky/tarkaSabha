-- CreateTable
CREATE TABLE "DossierShare" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "redactSources" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DossierShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DossierShare_tokenHash_key" ON "DossierShare"("tokenHash");

-- CreateIndex
CREATE INDEX "DossierShare_dossierId_idx" ON "DossierShare"("dossierId");

-- CreateIndex
CREATE INDEX "DossierShare_expiresAt_idx" ON "DossierShare"("expiresAt");

-- AddForeignKey
ALTER TABLE "DossierShare" ADD CONSTRAINT "DossierShare_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "WorkspaceDossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierShare" ADD CONSTRAINT "DossierShare_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

