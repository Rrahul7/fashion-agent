import { Router, Response } from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { uploadImage, deleteImage } from '../lib/cloudinary';
import { unifiedAuthMiddleware, checkReviewLimits, incrementReviewUsage, getUsageInfo, UnifiedAuthRequest } from '../middleware/unifiedAuth';
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

// All review routes use unified authentication (supports both JWT and guest)
router.use(unifiedAuthMiddleware);

// Create new review (upload outfit image)
router.post(
  '/',
  checkReviewLimits, // Check limits before processing
  upload.single('image'),
  [body('description').optional().isString().trim()],
  asyncHandler(async (req: UnifiedAuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const { description } = req.body;

    try {
      // Generate appropriate image identifier
      const imageId = req.isAuthenticated 
        ? `${req.userId}_${Date.now()}`
        : `guest_${req.guestSessionId}_${Date.now()}`;
      
      const folderPath = req.isAuthenticated 
        ? `reviews/${req.userId}`
        : `reviews/guest/${req.guestSessionId}`;

      // Upload image to Cloudinary
      const uploadResult = await uploadImage(
        req.file.buffer,
        imageId,
        folderPath
      );

      // Get user profile for context (authenticated users only)
      let userProfile = null;
      if (req.isAuthenticated && req.userId) {
        const user = await prisma.user.findUnique({
          where: { id: req.userId },
          include: { profile: true }
        });
        userProfile = user?.profile;
      }

      // Analyze outfit with AI
      const analysis = await analyzeOutfit(uploadResult.secureUrl, userProfile, description);

      // Create review record
      const review = await prisma.review.create({
        data: {
          userId: req.isAuthenticated ? req.userId! : null,
          guestDeviceId: req.isGuest ? req.guestSessionId! : null,
          imageUrl: uploadResult.secureUrl,
          imagePublicId: uploadResult.publicId,
          description,
          isGuest: req.isGuest || false,
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

      // Handle cleanup and usage tracking
      if (req.isAuthenticated) {
        // Cleanup old reviews for authenticated users (keep only last 10)
        const userReviewsCount = await prisma.review.count({
          where: { userId: req.userId }
        });

        if (userReviewsCount > 10) {
          const oldReviews = await prisma.review.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'asc' },
            take: userReviewsCount - 10,
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
      } else {
        // Increment guest usage
        await incrementReviewUsage(req);
      }

      // Get usage information for response
      const usage = await getUsageInfo(req);

      const response: any = {
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
      };

      // Add usage info for guests
      if (req.isGuest) {
        response.guestUsage = usage;
      }

      res.status(201).json(response);

    } catch (error) {
      console.error('Review creation error:', error);
      res.status(500).json({ error: 'Failed to process outfit review' });
    }
  })
);

// Get user reviews (supports both authenticated users and guests)
router.get('/', asyncHandler(async (req: UnifiedAuthRequest, res: Response) => {
  try {
    let reviews;
    
    if (req.isAuthenticated && req.userId) {
      // Get authenticated user's reviews (last 10)
      reviews = await prisma.review.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
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
    } else if (req.isGuest && req.guestSessionId) {
      // Get guest's reviews (up to 5, the limit)
      reviews = await prisma.review.findMany({
        where: { 
          guestDeviceId: req.guestSessionId,
          isGuest: true 
        },
        orderBy: { createdAt: 'desc' },
        take: 5, // Match guest review limit
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
          accepted: true,
          createdAt: true,
        }
      });
    } else {
      return res.status(400).json({ 
        error: 'Invalid authentication',
        code: 'INVALID_AUTH'
      });
    }

    // Add usage information for guests
    if (req.isGuest) {
      const usage = await getUsageInfo(req);
      res.json({
        reviews,
        usage
      });
    } else {
      res.json(reviews);
    }

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}));

// Compare reviews
router.post(
  '/:reviewId/compare',
  [body('previousReviewIds').isArray().withMessage('previousReviewIds must be an array')],
  asyncHandler(async (req: UnifiedAuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.userId;
    const { reviewId } = req.params;
    const { previousReviewIds } = req.body;

    // Build query based on user type
    const whereClause = req.isAuthenticated 
      ? { userId } 
      : { guestDeviceId: req.guestSessionId, isGuest: true };

    // Verify all reviews belong to the user/guest
    const allReviewIds = [reviewId, ...previousReviewIds];
    const reviews = await prisma.review.findMany({
      where: {
        id: { in: allReviewIds },
        ...whereClause,
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
  asyncHandler(async (req: UnifiedAuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.userId;
    const { reviewId } = req.params;
    const { accepted } = req.body;

    // Build query based on user type
    const whereClause = req.isAuthenticated 
      ? { id: reviewId, userId } 
      : { id: reviewId, guestDeviceId: req.guestSessionId, isGuest: true };

    const review = await prisma.review.findFirst({
      where: whereClause
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
