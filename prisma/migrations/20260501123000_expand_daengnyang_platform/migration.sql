-- CreateEnum
CREATE TYPE "PlaceCategory" AS ENUM (
    'PET_RESTAURANT',
    'ANIMAL_HOSPITAL',
    'EMERGENCY_HOSPITAL',
    'VACCINATION',
    'REGISTRATION',
    'SURGERY',
    'TRAVEL',
    'FLIGHT',
    'SHIP',
    'GROOMING',
    'DAYCARE',
    'HOTEL',
    'TRAINING',
    'PET_SUPPLY',
    'PET_FOOD',
    'FUNERAL',
    'LOST_PET',
    'INSURANCE',
    'CHECKLIST'
);

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('OFFICIAL_DATA', 'USER_REPORT', 'OWNER_SUBMISSION', 'MANUAL_DATA', 'ADMIN_VERIFIED');

-- CreateEnum
CREATE TYPE "SyncSource" AS ENUM (
    'FOODSAFETY_PET_RESTAURANT',
    'LOCALDATA_ANIMAL_HOSPITAL',
    'LOCALDATA_GROOMING',
    'LOCALDATA_DAYCARE',
    'LOCALDATA_FUNERAL',
    'ANIMAL_CLINIC_FEE',
    'AIRLINE_OFFICIAL',
    'SHIP_MANUAL',
    'MANUAL_GUIDE',
    'PLATFORM_DAILY_SYNC'
);

-- CreateEnum
CREATE TYPE "LostPetStatus" AS ENUM ('PENDING', 'APPROVED', 'FOUND', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "SyncLog"
    ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'scheduled',
    ADD COLUMN "skippedReason" TEXT,
    ADD COLUMN "errorMessage" TEXT,
    ADD COLUMN "sourceUrl" TEXT;

-- Normalize previous text source values before enum cast
UPDATE "SyncLog"
SET "source" = CASE
    WHEN "source" = 'foodsafety-petKorea' THEN 'FOODSAFETY_PET_RESTAURANT'
    WHEN "source" IN (
        'FOODSAFETY_PET_RESTAURANT',
        'LOCALDATA_ANIMAL_HOSPITAL',
        'LOCALDATA_GROOMING',
        'LOCALDATA_DAYCARE',
        'LOCALDATA_FUNERAL',
        'ANIMAL_CLINIC_FEE',
        'AIRLINE_OFFICIAL',
        'SHIP_MANUAL',
        'MANUAL_GUIDE',
        'PLATFORM_DAILY_SYNC'
    ) THEN "source"
    ELSE 'PLATFORM_DAILY_SYNC'
END;

-- AlterTable
ALTER TABLE "SyncLog"
    ALTER COLUMN "source" TYPE "SyncSource"
    USING ("source"::text::"SyncSource");

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "category" "PlaceCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "sido" TEXT,
    "sigungu" TEXT,
    "eupmyeondong" TEXT,
    "address" TEXT,
    "roadAddress" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "phone" TEXT,
    "businessStatus" TEXT,
    "sourceType" "SourceType" NOT NULL,
    "sourceName" "SyncSource",
    "sourceUrl" TEXT,
    "sourceId" TEXT,
    "sourceUpdatedAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceProfile" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "description" TEXT,
    "openingHours" TEXT,
    "priceText" TEXT,
    "serviceTags" JSONB,
    "parkingAvailable" BOOLEAN,
    "reservationUrl" TEXT,
    "largeDogAllowed" BOOLEAN,
    "catAllowed" BOOLEAN,
    "indoorAllowed" BOOLEAN,
    "outdoorAllowed" BOOLEAN,
    "cageRequired" BOOLEAN,
    "leashRequired" BOOLEAN,
    "ownerUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guide" (
    "id" TEXT NOT NULL,
    "category" "PlaceCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceNote" TEXT,
    "sourceUrls" JSONB,
    "reviewedAt" TIMESTAMP(3),
    "medicalDisclaimer" BOOLEAN NOT NULL DEFAULT false,
    "legalDisclaimer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LostPet" (
    "id" TEXT NOT NULL,
    "petName" TEXT NOT NULL,
    "animalType" TEXT NOT NULL,
    "breed" TEXT,
    "sex" TEXT,
    "age" TEXT,
    "photoUrls" JSONB,
    "lostSido" TEXT NOT NULL,
    "lostSigungu" TEXT,
    "lostAddress" TEXT NOT NULL,
    "lostLat" DOUBLE PRECISION,
    "lostLng" DOUBLE PRECISION,
    "lostAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "rewardAmount" INTEGER,
    "contactToken" TEXT NOT NULL,
    "contactMasked" TEXT NOT NULL,
    "status" "LostPetStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LostPet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LostPetReport" (
    "id" TEXT NOT NULL,
    "lostPetId" TEXT NOT NULL,
    "reporterName" TEXT NOT NULL,
    "reporterContactMasked" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL,
    "seenAddress" TEXT NOT NULL,
    "seenLat" DOUBLE PRECISION,
    "seenLng" DOUBLE PRECISION,
    "description" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LostPetReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceReport" (
    "id" TEXT NOT NULL,
    "placeId" TEXT,
    "category" "PlaceCategory" NOT NULL,
    "itemName" TEXT NOT NULL,
    "price" INTEGER,
    "receiptImageUrl" TEXT,
    "reportNote" TEXT,
    "sourceType" "SourceType" NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessClaim" (
    "id" TEXT NOT NULL,
    "placeId" TEXT,
    "businessName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "phoneMasked" TEXT NOT NULL,
    "businessRegistrationNumberMasked" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLock" (
    "id" TEXT NOT NULL,
    "source" "SyncSource" NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LOCKED',

    CONSTRAINT "SyncLock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Place_category_isActive_idx" ON "Place"("category", "isActive");

-- CreateIndex
CREATE INDEX "Place_sido_sigungu_idx" ON "Place"("sido", "sigungu");

-- CreateIndex
CREATE INDEX "Place_normalizedName_idx" ON "Place"("normalizedName");

-- CreateIndex
CREATE INDEX "Place_sourceType_idx" ON "Place"("sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "Place_sourceType_sourceId_key" ON "Place"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaceProfile_placeId_key" ON "PlaceProfile"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "Guide_slug_key" ON "Guide"("slug");

-- CreateIndex
CREATE INDEX "Guide_category_idx" ON "Guide"("category");

-- CreateIndex
CREATE UNIQUE INDEX "LostPet_contactToken_key" ON "LostPet"("contactToken");

-- CreateIndex
CREATE INDEX "LostPet_lostSido_lostSigungu_idx" ON "LostPet"("lostSido", "lostSigungu");

-- CreateIndex
CREATE INDEX "LostPet_status_createdAt_idx" ON "LostPet"("status", "createdAt");

-- CreateIndex
CREATE INDEX "LostPetReport_lostPetId_createdAt_idx" ON "LostPetReport"("lostPetId", "createdAt");

-- CreateIndex
CREATE INDEX "PriceReport_category_status_idx" ON "PriceReport"("category", "status");

-- CreateIndex
CREATE INDEX "BusinessClaim_status_submittedAt_idx" ON "BusinessClaim"("status", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SyncLock_source_key" ON "SyncLock"("source");

-- CreateIndex
CREATE INDEX "SyncLock_source_expiresAt_idx" ON "SyncLock"("source", "expiresAt");

-- Backfill current restaurant data into Place for unified discovery
INSERT INTO "Place" (
    "id",
    "category",
    "name",
    "normalizedName",
    "sido",
    "sigungu",
    "eupmyeondong",
    "address",
    "roadAddress",
    "lat",
    "lng",
    "businessStatus",
    "sourceType",
    "sourceName",
    "sourceUrl",
    "sourceId",
    "sourceUpdatedAt",
    "firstSeenAt",
    "lastSeenAt",
    "ownerVerified",
    "isActive",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    'PET_RESTAURANT'::"PlaceCategory",
    "name",
    lower("name"),
    "sido",
    "sigungu",
    "eupmyeondong",
    "address",
    "address",
    "lat",
    "lng",
    '영업/운영 상태 미확인',
    'OFFICIAL_DATA'::"SourceType",
    'FOODSAFETY_PET_RESTAURANT'::"SyncSource",
    "sourceUrl",
    "sourceKey",
    "dataUpdatedAt",
    "firstSeenAt",
    "lastSeenAt",
    false,
    CASE WHEN "status" = 'ACTIVE'::"RestaurantStatus" THEN true ELSE false END,
    "createdAt",
    "updatedAt"
FROM "Restaurant"
ON CONFLICT ("sourceType", "sourceId") DO NOTHING;

-- AddForeignKey
ALTER TABLE "PlaceProfile" ADD CONSTRAINT "PlaceProfile_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LostPetReport" ADD CONSTRAINT "LostPetReport_lostPetId_fkey" FOREIGN KEY ("lostPetId") REFERENCES "LostPet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceReport" ADD CONSTRAINT "PriceReport_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessClaim" ADD CONSTRAINT "BusinessClaim_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;