-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "colorHarmonyScore" INTEGER,
ADD COLUMN     "feedbackRating" INTEGER,
ADD COLUMN     "fitScore" INTEGER,
ADD COLUMN     "guestSessionId" TEXT,
ADD COLUMN     "isGuest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "occasionScore" INTEGER,
ADD COLUMN     "overallScore" INTEGER,
ADD COLUMN     "styleCategoryScore" INTEGER,
ADD COLUMN     "userFeedback" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "guest_sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guest_sessions_sessionId_key" ON "guest_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "guest_sessions_sessionId_idx" ON "guest_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "guest_sessions_createdAt_idx" ON "guest_sessions"("createdAt");

-- CreateIndex
CREATE INDEX "reviews_guestSessionId_createdAt_idx" ON "reviews"("guestSessionId", "createdAt");
