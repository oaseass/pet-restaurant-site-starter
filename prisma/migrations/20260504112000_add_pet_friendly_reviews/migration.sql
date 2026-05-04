-- CreateEnum
CREATE TYPE "ReviewTargetType" AS ENUM ('RESTAURANT', 'PLACE');

-- CreateEnum
CREATE TYPE "ReviewPetType" AS ENUM ('DOG', 'CAT', 'BOTH', 'OTHER');

-- CreateEnum
CREATE TYPE "ReviewPetSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ReviewPolicyAnswer" AS ENUM ('YES', 'NO', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "targetType" "ReviewTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "ratingOverall" INTEGER NOT NULL,
    "ratingPetFriendly" INTEGER NOT NULL,
    "ratingCleanliness" INTEGER,
    "ratingStaff" INTEGER,
    "ratingParking" INTEGER,
    "petType" "ReviewPetType" NOT NULL,
    "petSize" "ReviewPetSize" NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "indoorAllowed" "ReviewPolicyAnswer" NOT NULL DEFAULT 'UNKNOWN',
    "outdoorAllowed" "ReviewPolicyAnswer" NOT NULL DEFAULT 'UNKNOWN',
    "largeDogAllowed" "ReviewPolicyAnswer" NOT NULL DEFAULT 'UNKNOWN',
    "carrierRequired" "ReviewPolicyAnswer" NOT NULL DEFAULT 'UNKNOWN',
    "leashRequired" "ReviewPolicyAnswer" NOT NULL DEFAULT 'UNKNOWN',
    "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_targetType_targetId_status_createdAt_idx" ON "Review"("targetType", "targetId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Review_status_createdAt_idx" ON "Review"("status", "createdAt");