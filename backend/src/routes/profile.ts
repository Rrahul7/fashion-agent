import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All profile routes require authentication
router.use(authenticateToken);

// Get user profile
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
    }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    profile: user.profile || null,
  });
}));

// Update user profile
const profileValidation = [
  body('skinTone').optional().isString().trim(),
  body('build').optional().isString().trim(),
  body('faceStructure').optional().isString().trim(),
  body('hairType').optional().isString().trim(),
  body('height').optional().isNumeric(),
  body('weight').optional().isNumeric(),
  body('otherMeasurements').optional().isObject(),
];

router.put('/', profileValidation, asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.userId!;
  const {
    skinTone,
    build,
    faceStructure,
    hairType,
    height,
    weight,
    otherMeasurements,
  } = req.body;

  // Upsert profile
  const profile = await prisma.profile.upsert({
    where: { userId },
    update: {
      skinTone,
      build,
      faceStructure,
      hairType,
      height: height ? parseFloat(height) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      otherMeasurements,
    },
    create: {
      userId,
      skinTone,
      build,
      faceStructure,
      hairType,
      height: height ? parseFloat(height) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      otherMeasurements,
    },
  });

  res.json({ profile });
}));

export { router as profileRoutes };
