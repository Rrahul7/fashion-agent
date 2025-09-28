import { Router, Response } from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { uploadImage, deleteImage } from '../lib/cloudinary';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { analyzeOutfit } from '../services/aiService';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// All review routes require authentication
router.use(authenticateToken);

// Create new review (upload outfit image)
router.post(
  '/',
  upload.single('image'),
  [body('description').optional().isString().trim()],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const userId = req.userId!;
    const { description } = req.body;

    try {
      // Upload image to Cloudinary
      const uploadResult = await uploadImage(
        req.file.buffer,
        `${userId}_${Date.now()}`,
        `reviews/${userId}`
      );

      // Get user profile for context
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      });

      // Analyze outfit with AI
      const analysis = await analyzeOutfit(uploadResult.secureUrl, user?.profile, description);

      // Create review record
      const review = await prisma.review.create({
        data: {
          userId,
          imageUrl: uploadResult.secureUrl,
          imagePublicId: uploadResult.publicId,
          description,
          styleCategory: analysis.styleCategory,
          styleCategoryScore: analysis.styleCategoryScore,
          fit: analysis.fit,
          fitScore: analysis.fitScore,
          colorHarmony: analysis.colorHarmony,
          colorHarmonyScore: analysis.colorHarmonyScore,
          occasionSuitability: analysis.occasionSuitability,
          occasionScore: analysis.occasionScore,
          proportionBalance: analysis.proportionBalance,
          proportionScore: analysis.proportionScore,
          fabricSynergy: analysis.fabricSynergy,
          fabricScore: analysis.fabricScore,
          stylingSophistication: analysis.stylingSophistication,
          sophisticationScore: analysis.sophisticationScore,
          overallScore: analysis.overallScore,
          highlights: analysis.highlights,
          improvementSuggestions: analysis.improvementSuggestions,
          expertInsights: analysis.expertInsights,
          technicalFlaws: analysis.technicalFlaws,
        }
      });

      // Cleanup old reviews (keep only last 5)
      const userReviewsCount = await prisma.review.count({
        where: { userId }
      });

      if (userReviewsCount > 5) {
        const oldReviews = await prisma.review.findMany({
          where: { userId },
          orderBy: { createdAt: 'asc' },
          take: userReviewsCount - 5,
        });

        // Delete old images from Cloudinary
        for (const oldReview of oldReviews) {
          if (oldReview.imagePublicId) {
            try {
              await deleteImage(oldReview.imagePublicId);
            } catch (error) {
              console.error('Failed to delete old image:', error);
            }
          }
        }

        // Delete old review records
        await prisma.review.deleteMany({
          where: {
            id: { in: oldReviews.map((r: any) => r.id) }
          }
        });
      }

      res.status(201).json({
        reviewId: review.id,
        outfitAnalysis: {
          styleCategory: review.styleCategory,
          styleCategoryScore: review.styleCategoryScore,
          fit: review.fit,
          fitScore: review.fitScore,
          colorHarmony: review.colorHarmony,
          colorHarmonyScore: review.colorHarmonyScore,
          occasionSuitability: review.occasionSuitability,
          occasionScore: review.occasionScore,
          proportionBalance: review.proportionBalance,
          proportionScore: review.proportionScore,
          fabricSynergy: review.fabricSynergy,
          fabricScore: review.fabricScore,
          stylingSophistication: review.stylingSophistication,
          sophisticationScore: review.sophisticationScore,
          overallScore: review.overallScore,
          highlights: review.highlights,
          improvementSuggestions: review.improvementSuggestions,
          expertInsights: review.expertInsights,
          technicalFlaws: review.technicalFlaws,
        }
      });

    } catch (error) {
      console.error('Review creation error:', error);
      res.status(500).json({ error: 'Failed to process outfit review' });
    }
  })
);

// Get user reviews (last 5)
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const reviews = await prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      imageUrl: true,
      description: true,
      styleCategory: true,
      styleCategoryScore: true,
      fit: true,
      fitScore: true,
      colorHarmony: true,
      colorHarmonyScore: true,
      occasionSuitability: true,
      occasionScore: true,
      proportionBalance: true,
      proportionScore: true,
      fabricSynergy: true,
      fabricScore: true,
      stylingSophistication: true,
      sophisticationScore: true,
      overallScore: true,
      highlights: true,
      improvementSuggestions: true,
      expertInsights: true,
      technicalFlaws: true,
      comparisonInsight: true,
      accepted: true,
      createdAt: true,
    }
  });

  res.json(reviews);
}));

// Compare reviews
router.post(
  '/:reviewId/compare',
  [body('previousReviewIds').isArray().withMessage('previousReviewIds must be an array')],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.userId!;
    const { reviewId } = req.params;
    const { previousReviewIds } = req.body;

    // Verify all reviews belong to the user
    const allReviewIds = [reviewId, ...previousReviewIds];
    const reviews = await prisma.review.findMany({
      where: {
        id: { in: allReviewIds },
        userId,
      }
    });

    if (reviews.length !== allReviewIds.length) {
      return res.status(400).json({ error: 'Invalid review IDs' });
    }

    const currentReview = reviews.find((r: any) => r.id === reviewId);
    const previousReviews = reviews.filter((r: any) => previousReviewIds.includes(r.id));

    if (!currentReview || previousReviews.length === 0) {
      return res.status(400).json({ error: 'Reviews not found' });
    }

    try {
      // Generate comparison insight with AI
      const comparisonInsight = await generateComparisonInsight(currentReview, previousReviews);

      // Update review with comparison data
      await prisma.review.update({
        where: { id: reviewId },
        data: {
          comparedWithIds: previousReviewIds,
          comparisonInsight,
        }
      });

      res.json({
        comparison: {
          withReviewIds: previousReviewIds,
          insight: comparisonInsight,
        }
      });

    } catch (error) {
      console.error('Comparison error:', error);
      res.status(500).json({ error: 'Failed to generate comparison' });
    }
  })
);

// Accept/reject feedback
router.post(
  '/:reviewId/accept',
  [body('accepted').isBoolean().withMessage('accepted must be true or false')],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.userId!;
    const { reviewId } = req.params;
    const { accepted } = req.body;

    const review = await prisma.review.findFirst({
      where: { id: reviewId, userId }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await prisma.review.update({
      where: { id: reviewId },
      data: { accepted }
    });

    res.json({ status: 'updated' });
  })
);

// Helper function for AI comparison
async function generateComparisonInsight(currentReview: any, previousReviews: any[]): Promise<string> {
  // This is a placeholder - implement actual AI comparison logic
  const styles = previousReviews.map(r => r.styleCategory).join(', ');
  return `Your current ${currentReview.styleCategory} outfit shows evolution from your previous ${styles} styles. The color harmony has improved, and the fit appears more confident.`;
}

export { router as reviewRoutes };
