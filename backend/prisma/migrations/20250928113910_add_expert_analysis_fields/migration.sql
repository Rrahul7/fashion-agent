-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "expertInsights" TEXT[],
ADD COLUMN     "fabricScore" INTEGER,
ADD COLUMN     "fabricSynergy" TEXT,
ADD COLUMN     "proportionBalance" TEXT,
ADD COLUMN     "proportionScore" INTEGER,
ADD COLUMN     "sophisticationScore" INTEGER,
ADD COLUMN     "stylingSophistication" TEXT,
ADD COLUMN     "technicalFlaws" TEXT[];
