// This file contains Swagger documentation for the unified review endpoints
// Import this file or copy these comments to the actual route files

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token for authenticated users
 *     DeviceAuth:
 *       type: apiKey
 *       in: header
 *       name: x-device-id
 *       description: Device-based authentication for guest users (requires x-device-fingerprint header)
 *   schemas:
 *     OutfitAnalysis:
 *       type: object
 *       properties:
 *         styleCategory:
 *           type: string
 *           description: Detected style category
 *         styleCategoryScore:
 *           type: number
 *           format: float
 *         fit:
 *           type: string
 *           description: Fit assessment
 *         fitScore:
 *           type: number
 *           format: float
 *         colorHarmony:
 *           type: string
 *           description: Color harmony analysis
 *         colorHarmonyScore:
 *           type: number
 *           format: float
 *         occasionSuitability:
 *           type: string
 *           description: Occasion appropriateness
 *         occasionScore:
 *           type: number
 *           format: float
 *         proportionBalance:
 *           type: string
 *           description: Proportion analysis
 *         proportionScore:
 *           type: number
 *           format: float
 *         fabricSynergy:
 *           type: string
 *           description: Fabric combination assessment
 *         fabricScore:
 *           type: number
 *           format: float
 *         stylingSophistication:
 *           type: string
 *           description: Overall styling sophistication
 *         sophisticationScore:
 *           type: number
 *           format: float
 *         overallScore:
 *           type: number
 *           format: float
 *           description: Overall outfit score (0-100)
 *         highlights:
 *           type: array
 *           items:
 *             type: string
 *           description: Positive aspects of the outfit
 *         improvementSuggestions:
 *           type: array
 *           items:
 *             type: string
 *           description: Suggestions for improvement
 *         expertInsights:
 *           type: array
 *           items:
 *             type: string
 *           description: Expert fashion insights
 *         technicalFlaws:
 *           type: array
 *           items:
 *             type: string
 *           description: Technical issues identified
 *     GuestUsage:
 *       type: object
 *       properties:
 *         used:
 *           type: integer
 *           description: Number of reviews used
 *           example: 2
 *         limit:
 *           type: integer
 *           description: Maximum reviews allowed
 *           example: 5
 *         remaining:
 *           type: integer
 *           description: Reviews remaining
 *           example: 3
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique review identifier
 *         imageUrl:
 *           type: string
 *           format: uri
 *           description: URL of the outfit image
 *         description:
 *           type: string
 *           nullable: true
 *           description: User-provided description
 *         styleCategory:
 *           type: string
 *           nullable: true
 *         styleCategoryScore:
 *           type: number
 *           format: float
 *           nullable: true
 *         fit:
 *           type: string
 *           nullable: true
 *         fitScore:
 *           type: number
 *           format: float
 *           nullable: true
 *         colorHarmony:
 *           type: string
 *           nullable: true
 *         colorHarmonyScore:
 *           type: number
 *           format: float
 *           nullable: true
 *         occasionSuitability:
 *           type: string
 *           nullable: true
 *         occasionScore:
 *           type: number
 *           format: float
 *           nullable: true
 *         proportionBalance:
 *           type: string
 *           nullable: true
 *         proportionScore:
 *           type: number
 *           format: float
 *           nullable: true
 *         fabricSynergy:
 *           type: string
 *           nullable: true
 *         fabricScore:
 *           type: number
 *           format: float
 *           nullable: true
 *         stylingSophistication:
 *           type: string
 *           nullable: true
 *         sophisticationScore:
 *           type: number
 *           format: float
 *           nullable: true
 *         overallScore:
 *           type: number
 *           format: float
 *           nullable: true
 *         highlights:
 *           type: array
 *           items:
 *             type: string
 *           nullable: true
 *         improvementSuggestions:
 *           type: array
 *           items:
 *             type: string
 *           nullable: true
 *         expertInsights:
 *           type: array
 *           items:
 *             type: string
 *           nullable: true
 *         technicalFlaws:
 *           type: array
 *           items:
 *             type: string
 *           nullable: true
 *         comparisonInsight:
 *           type: string
 *           nullable: true
 *           description: AI-generated comparison with previous reviews
 *         accepted:
 *           type: boolean
 *           nullable: true
 *           description: Whether user accepted the AI feedback
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Review creation timestamp
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *         code:
 *           type: string
 *           description: Error code
 *         message:
 *           type: string
 *           description: Detailed error message
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Upload outfit image for AI analysis (Supports both authenticated users and guests)
 *     tags: [Reviews]
 *     description: |
 *       **Unified endpoint supporting both authentication methods:**
 *       - **Authenticated users**: Use Bearer JWT token (unlimited reviews, keeps last 10)
 *       - **Guest users**: Use device identification headers (limited to 5 reviews)
 *     security:
 *       - BearerAuth: []
 *       - DeviceAuth: []
 *     parameters:
 *       - in: header
 *         name: x-device-id
 *         required: false
 *         schema:
 *           type: string
 *         description: Device ID for guest authentication (required for guests)
 *       - in: header
 *         name: x-device-fingerprint
 *         required: false
 *         schema:
 *           type: string
 *         description: Device fingerprint for guest authentication (required for guests)
 *       - in: header
 *         name: x-device-platform
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ios, android, web]
 *         description: Platform information for enhanced tracking
 *       - in: header
 *         name: x-device-name
 *         required: false
 *         schema:
 *           type: string
 *         description: Device name for tracking
 *       - in: header
 *         name: x-app-version
 *         required: false
 *         schema:
 *           type: string
 *         description: App version for compatibility tracking
 *       - in: header
 *         name: x-device-os
 *         required: false
 *         schema:
 *           type: string
 *         description: Operating system version
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Outfit image file (max 10MB)
 *               description:
 *                 type: string
 *                 description: Optional description of the outfit
 *                 example: "Business casual outfit for work meeting"
 *     responses:
 *       201:
 *         description: Review created successfully with AI analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviewId:
 *                   type: string
 *                   description: Unique identifier for the review
 *                 outfitAnalysis:
 *                   $ref: '#/components/schemas/OutfitAnalysis'
 *                 guestUsage:
 *                   $ref: '#/components/schemas/GuestUsage'
 *                   description: Usage information (only included for guest users)
 *       400:
 *         description: Validation error, missing image, or invalid device identification
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid or missing authentication (JWT token or device headers)
 *       429:
 *         description: Rate limit exceeded or guest review limit reached (5 reviews for guests)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *                   enum: [LIMIT_REACHED, RATE_LIMIT_EXCEEDED]
 *                 limit:
 *                   type: integer
 *                   description: Maximum allowed reviews
 *                 used:
 *                   type: integer
 *                   description: Reviews already used
 *                 message:
 *                   type: string
 *                   example: "You've used all 5 free reviews. Create an account for unlimited access!"
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: Get recent outfit reviews (Supports both authenticated users and guests)
 *     tags: [Reviews]
 *     description: |
 *       **Returns review history based on authentication:**
 *       - **Authenticated users**: Last 10 reviews
 *       - **Guest users**: Up to 5 reviews + usage information
 *     security:
 *       - BearerAuth: []
 *       - DeviceAuth: []
 *     parameters:
 *       - in: header
 *         name: x-device-id
 *         required: false
 *         schema:
 *           type: string
 *         description: Device ID for guest authentication (required for guests)
 *       - in: header
 *         name: x-device-fingerprint
 *         required: false
 *         schema:
 *           type: string
 *         description: Device fingerprint for guest authentication (required for guests)
 *     responses:
 *       200:
 *         description: List of user's recent reviews
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *                   description: Reviews array (for authenticated users)
 *                 - type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Review'
 *                     usage:
 *                       $ref: '#/components/schemas/GuestUsage'
 *                   description: Reviews with usage info (for guest users)
 *       400:
 *         description: Invalid authentication
 *       401:
 *         description: Invalid or missing authentication
 *       500:
 *         description: Internal server error
 * 
 * /api/reviews/{reviewId}/compare:
 *   post:
 *     summary: Compare current review with previous reviews (Supports both user types)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *       - DeviceAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the review to compare
 *       - in: header
 *         name: x-device-id
 *         required: false
 *         schema:
 *           type: string
 *         description: Device ID for guest authentication (required for guests)
 *       - in: header
 *         name: x-device-fingerprint
 *         required: false
 *         schema:
 *           type: string
 *         description: Device fingerprint for guest authentication (required for guests)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - previousReviewIds
 *             properties:
 *               previousReviewIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of previous review IDs to compare with
 *                 example: ["review1", "review2", "review3"]
 *     responses:
 *       200:
 *         description: Comparison generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comparison:
 *                   type: object
 *                   properties:
 *                     withReviewIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                     insight:
 *                       type: string
 *                       description: AI-generated comparison insight
 *       400:
 *         description: Invalid review IDs or validation error
 *       401:
 *         description: Invalid or missing authentication
 *       404:
 *         description: Review not found or not accessible by current user/guest
 *       500:
 *         description: Failed to generate comparison
 * 
 * /api/reviews/{reviewId}/accept:
 *   post:
 *     summary: Accept or reject AI feedback for a review (Supports both user types)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *       - DeviceAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the review
 *       - in: header
 *         name: x-device-id
 *         required: false
 *         schema:
 *           type: string
 *         description: Device ID for guest authentication (required for guests)
 *       - in: header
 *         name: x-device-fingerprint
 *         required: false
 *         schema:
 *           type: string
 *         description: Device fingerprint for guest authentication (required for guests)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accepted
 *             properties:
 *               accepted:
 *                 type: boolean
 *                 description: Whether the user accepts the AI feedback
 *                 example: true
 *     responses:
 *       200:
 *         description: Feedback status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "updated"
 *       400:
 *         description: Validation error or invalid authentication
 *       401:
 *         description: Invalid or missing authentication
 *       404:
 *         description: Review not found or not accessible by current user/guest
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * tags:
 *   - name: Reviews
 *     description: Unified review endpoints supporting both authenticated users and guests
 *   - name: Authentication  
 *     description: User authentication endpoints
 *   - name: Profile
 *     description: User profile management
 *   - name: System
 *     description: System health and status endpoints
 */