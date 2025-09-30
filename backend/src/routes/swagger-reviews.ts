// This file contains Swagger documentation for review endpoints
// Import this file or copy these comments to the actual route files

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Upload outfit image for AI analysis (Authenticated users)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
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
 *       400:
 *         description: Validation error or missing image
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: Get user's recent outfit reviews (last 5)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's recent reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 * 
 * /api/reviews/{reviewId}/compare:
 *   post:
 *     summary: Compare current review with previous reviews
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the review to compare
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
 *         description: Unauthorized
 *       500:
 *         description: Failed to generate comparison
 * 
 * /api/reviews/{reviewId}/accept:
 *   post:
 *     summary: Accept or reject AI feedback for a review
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the review
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
 *       404:
 *         description: Review not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/guest/reviews/test:
 *   get:
 *     summary: Test guest session endpoint
 *     tags: [Guest Reviews]
 *     security:
 *       - DeviceAuth: []
 *     parameters:
 *       - in: header
 *         name: x-device-fingerprint
 *         required: true
 *         schema:
 *           type: string
 *         description: Device fingerprint for identification
 *     responses:
 *       200:
 *         description: Guest session test successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Guest session test"
 *                 isGuest:
 *                   type: boolean
 *                 guestSessionId:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 * 
 * /api/guest/reviews/usage:
 *   get:
 *     summary: Get guest usage information
 *     tags: [Guest Reviews]
 *     security:
 *       - DeviceAuth: []
 *     parameters:
 *       - in: header
 *         name: x-device-fingerprint
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Guest usage information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GuestUsage'
 * 
 * /api/guest/reviews:
 *   post:
 *     summary: Upload outfit image for AI analysis (Guest users)
 *     tags: [Guest Reviews]
 *     security:
 *       - DeviceAuth: []
 *     parameters:
 *       - in: header
 *         name: x-device-fingerprint
 *         required: true
 *         schema:
 *           type: string
 *         description: Device fingerprint for identification
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
 *     responses:
 *       201:
 *         description: Guest review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviewId:
 *                   type: string
 *                 outfitAnalysis:
 *                   $ref: '#/components/schemas/OutfitAnalysis'
 *                 guestUsage:
 *                   $ref: '#/components/schemas/GuestUsage'
 *       400:
 *         description: Invalid guest session or validation error
 *       429:
 *         description: Guest review limit exceeded
 *       500:
 *         description: Failed to process outfit review
 * 
 * /api/guest/reviews/{reviewId}/feedback:
 *   post:
 *     summary: Submit feedback for guest review
 *     tags: [Guest Reviews]
 *     security:
 *       - DeviceAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-device-fingerprint
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               feedbackRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1-5 stars
 *               userFeedback:
 *                 type: string
 *                 description: Detailed user feedback
 *               accepted:
 *                 type: boolean
 *                 description: Whether user accepts the AI analysis
 *     responses:
 *       200:
 *         description: Feedback saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "feedback_saved"
 *                 message:
 *                   type: string
 *                   example: "Thank you for your feedback!"
 *       404:
 *         description: Review not found
 *       400:
 *         description: Invalid guest session
 */
