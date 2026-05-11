-- CreateEnum
CREATE TYPE "ExternalLinkKind" AS ENUM ('BLOG', 'WEB', 'MAP');

-- CreateTable
CREATE TABLE "ExternalLinkSubmission" (
    "id" TEXT NOT NULL,
    "targetType" "ReviewTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "summary" TEXT,
    "kind" "ExternalLinkKind" NOT NULL DEFAULT 'WEB',
    "publishedAt" TIMESTAMP(3),
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalLinkSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalLinkSubmission_targetType_targetId_status_createdAt_idx" ON "ExternalLinkSubmission"("targetType", "targetId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ExternalLinkSubmission_status_createdAt_idx" ON "ExternalLinkSubmission"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalLinkSubmission_targetType_targetId_href_key" ON "ExternalLinkSubmission"("targetType", "targetId", "href");