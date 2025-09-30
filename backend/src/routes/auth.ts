import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { config } from '../config/config';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AuthRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           minLength: 6
 *           description: User's password (minimum 6 characters)
 *     AuthResponse:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: Unique user identifier
 *         token:
 *           type: string
 *           description: JWT authentication token
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 */

// Validation middleware
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists().withMessage('Password is required'),
];

// Register
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRequest'
 *           example:
 *             email: "user@example.com"
 *             password: "securePassword123"
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validation_error:
 *                 value:
 *                   errors:
 *                     - field: "email"
 *                       message: "Invalid email format"
 *                     - field: "password"
 *                       message: "Password must be at least 6 characters"
 *               user_exists:
 *                 value:
 *                   error: "User with this email already exists"
 */
router.post('/register', registerValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
    }
  });

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as SignOptions
  );

  res.status(201).json({
    userId: user.id,
    token,
    email: user.email,
  });
}));

// Login
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and get access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRequest'
 *           example:
 *             email: "user@example.com"
 *             password: "securePassword123"
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid email or password"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', loginValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as SignOptions
  );

  res.json({
    userId: user.id,
    token,
    email: user.email,
  });
}));

export { router as authRoutes };
