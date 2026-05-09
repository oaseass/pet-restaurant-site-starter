-- CreateEnum
CREATE TYPE "BusinessCheckType" AS ENUM ('PHONE_CALL', 'VISIT');

-- CreateEnum
CREATE TYPE "BusinessCheckResult" AS ENUM ('CONFIRMED_OPEN', 'NO_ANSWER', 'NEEDS_UPDATE', 'CLOSED_OR_UNAVAILABLE');

-- CreateTable
CREATE TABLE "BusinessCheck" (
    "id" TEXT NOT NULL,
    "targetType" "ReviewTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "checkType" "BusinessCheckType" NOT NULL,
    "result" "BusinessCheckResult" NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessCheck_targetType_targetId_status_checkedAt_idx" ON "BusinessCheck"("targetType", "targetId", "status", "checkedAt");

-- CreateIndex
CREATE INDEX "BusinessCheck_status_createdAt_idx" ON "BusinessCheck"("status", "createdAt");
