-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skinTone" TEXT,
    "build" TEXT,
    "faceStructure" TEXT,
    "hairType" TEXT,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "otherMeasurements" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestDeviceId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "imagePublicId" TEXT,
    "description" TEXT,
    "styleCategory" TEXT,
    "styleCategoryScore" INTEGER,
    "fit" TEXT,
    "fitScore" INTEGER,
    "colorHarmony" TEXT,
    "colorHarmonyScore" INTEGER,
    "occasionSuitability" TEXT,
    "occasionScore" INTEGER,
    "proportionBalance" TEXT,
    "proportionScore" INTEGER,
    "fabricSynergy" TEXT,
    "fabricScore" INTEGER,
    "stylingSophistication" TEXT,
    "sophisticationScore" INTEGER,
    "overallScore" INTEGER,
    "highlights" TEXT[],
    "improvementSuggestions" TEXT[],
    "expertInsights" TEXT[],
    "technicalFlaws" TEXT[],
    "userFeedback" TEXT,
    "feedbackRating" INTEGER,
    "accepted" BOOLEAN,
    "comparedWithIds" TEXT[],
    "comparisonInsight" TEXT,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_devices" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceFingerprint" TEXT NOT NULL,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "platform" TEXT,
    "deviceName" TEXT,
    "appVersion" TEXT,
    "osVersion" TEXT,
    "ipAddress" TEXT,
    "ipAddresses" TEXT[],
    "userAgent" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "inconsistencyCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "rapidRequestCount" INTEGER NOT NULL DEFAULT 0,
    "dailyRequestCount" INTEGER NOT NULL DEFAULT 0,
    "lastDailyReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE INDEX "reviews_userId_createdAt_idx" ON "reviews"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "reviews_guestDeviceId_createdAt_idx" ON "reviews"("guestDeviceId", "createdAt");

-- CreateIndex
CREATE INDEX "reviews_isGuest_createdAt_idx" ON "reviews"("isGuest", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "guest_devices_deviceId_key" ON "guest_devices"("deviceId");

-- CreateIndex
CREATE INDEX "guest_devices_deviceFingerprint_idx" ON "guest_devices"("deviceFingerprint");

-- CreateIndex
CREATE INDEX "guest_devices_createdAt_idx" ON "guest_devices"("createdAt");

-- CreateIndex
CREATE INDEX "guest_devices_lastUsedAt_idx" ON "guest_devices"("lastUsedAt");

-- CreateIndex
CREATE INDEX "guest_devices_isBlocked_idx" ON "guest_devices"("isBlocked");

-- CreateIndex
CREATE INDEX "guest_devices_riskScore_idx" ON "guest_devices"("riskScore");

-- CreateIndex
CREATE INDEX "guest_devices_ipAddress_createdAt_idx" ON "guest_devices"("ipAddress", "createdAt");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- NOTE: No RLS policies - using service role approach
-- Authorization is handled by the backend application layer
-- Use Supabase service role key in DATABASE_URL for full access
-- This is simpler and more suitable for backends with custom authentication
