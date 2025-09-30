import { Router, Response } from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { uploadImage, deleteImage } from '../lib/cloudinary';
import { asyncHandler } from '../middleware/errorHandler';
import { analyzeOutfit } from '../services/aiService';
import { 
  guestTrackingMiddleware, 
  checkGuestLimit, 
  incrementGuestUsage, 
  getGuestUsage,
  GuestRequest 
} from '../middleware/guestMiddleware';

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

// Apply guest tracking to all routes
router.use(guestTrackingMiddleware);

// Test guest session endpoint
router.get('/test', asyncHandler(async (req: GuestRequest, res: Response) => {
  console.log('🧪 Guest test endpoint called');
  console.log('🧪 Request details:', {
    isGuest: req.isGuest,
    guestSessionId: req.guestSessionId,
    headers: req.headers
  });
  
  res.json({
    message: 'Guest session test',
    isGuest: req.isGuest,
    guestSessionId: req.guestSessionId,
    timestamp: new Date().toISOString()
  });
}));

// Get guest usage info
router.get('/usage', asyncHandler(async (req: GuestRequest, res: Response) => {
  console.log('📊 Usage check - isGuest:', req.isGuest, 'sessionId:', req.guestSessionId);
  
  if (!req.isGuest || !req.guestSessionId) {
    return res.json({ used: 0, limit: 3, remaining: 3 });
  }
  
  const usage = await getGuestUsage(req.guestSessionId);
  console.log('📊 Guest usage:', usage);
  res.json(usage);
}));

// Create new guest review (upload outfit image)
router.post(
  '/',
  checkGuestLimit,
  upload.single('image'),
  [body('description').optional().isString().trim()],
  asyncHandler(async (req: GuestRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    if (!req.isGuest || !req.guestSessionId) {
      return res.status(400).json({ error: 'Invalid guest session' });
    }

    const { description } = req.body;

    try {
      // Upload image to Cloudinary
      const uploadResult = await uploadImage(
        req.file.buffer,
        `guest_${req.guestSessionId}_${Date.now()}`,
        `reviews/guest/${req.guestSessionId}`
      );

      // Analyze outfit with AI (no user profile for guests)
      const analysis = await analyzeOutfit(uploadResult.secureUrl, null, description);

      // Create review record
      const review = await prisma.review.create({
        data: {
          userId: null, // Guest review
          guestDeviceId: req.guestSessionId,
          imageUrl: uploadResult.secureUrl,
          imagePublicId: uploadResult.publicId,
          description,
          isGuest: true,
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

      // Increment guest usage
      await incrementGuestUsage(req.guestSessionId);

      // Get updated usage info
      const usage = await getGuestUsage(req.guestSessionId);

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
        },
        guestUsage: usage,
      });

    } catch (error) {
      console.error('Guest review creation error:', error);
      res.status(500).json({ error: 'Failed to process outfit review' });
    }
  })
);

// Submit feedback for guest review
router.post(
  '/:reviewId/feedback',
  [
    body('feedbackRating').optional().isInt({ min: 1, max: 5 }),
    body('userFeedback').optional().isString().trim(),
    body('accepted').optional().isBoolean(),
  ],
  asyncHandler(async (req: GuestRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.isGuest || !req.guestSessionId) {
      return res.status(400).json({ error: 'Invalid guest session' });
    }

    const { reviewId } = req.params;
    const { feedbackRating, userFeedback, accepted } = req.body;

    // Verify review belongs to this guest session
    const review = await prisma.review.findFirst({
      where: { 
        id: reviewId, 
        guestDeviceId: req.guestSessionId,
        isGuest: true,
      }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Update review with feedback
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: { 
        feedbackRating,
        userFeedback,
        accepted,
      }
    });

    res.json({ 
      status: 'feedback_saved',
      message: 'Thank you for your feedback!'
    });
  })
);

export { router as guestReviewRoutes };
