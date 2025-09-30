import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fashion Agent API',
      version: '1.0.0',
      description: 'A comprehensive fashion outfit analysis API with AI-powered insights',
      contact: {
        name: 'Fashion Agent Team',
        url: 'https://fashion-agent.com',
        email: 'support@fashion-agent.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: config.nodeEnv === 'production' 
          ? 'https://fashion-agent-backend.railway.app'
          : `http://localhost:${config.port}`,
        description: config.nodeEnv === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        DeviceAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-device-id',
          description: 'Device identification for guest users',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique user identifier' },
            email: { type: 'string', format: 'email' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Profile: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            skinTone: { type: 'string', nullable: true },
            build: { type: 'string', nullable: true },
            faceStructure: { type: 'string', nullable: true },
            hairType: { type: 'string', nullable: true },
            height: { type: 'number', format: 'float', nullable: true },
            weight: { type: 'number', format: 'float', nullable: true },
            otherMeasurements: { type: 'object', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Review: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string', nullable: true },
            guestDeviceId: { type: 'string', nullable: true },
            imageUrl: { type: 'string', format: 'uri' },
            description: { type: 'string', nullable: true },
            styleCategory: { type: 'string', nullable: true },
            styleCategoryScore: { type: 'integer', minimum: 0, maximum: 100, nullable: true },
            fit: { type: 'string', nullable: true },
            fitScore: { type: 'integer', minimum: 0, maximum: 100, nullable: true },
            colorHarmony: { type: 'string', nullable: true },
            colorHarmonyScore: { type: 'integer', minimum: 0, maximum: 100, nullable: true },
            occasionSuitability: { type: 'string', nullable: true },
            occasionScore: { type: 'integer', minimum: 0, maximum: 100, nullable: true },
            proportionBalance: { type: 'string', nullable: true },
            proportionScore: { type: 'integer', minimum: 0, maximum: 100, nullable: true },
            fabricSynergy: { type: 'string', nullable: true },
            fabricScore: { type: 'integer', minimum: 0, maximum: 100, nullable: true },
            stylingSophistication: { type: 'string', nullable: true },
            sophisticationScore: { type: 'integer', minimum: 0, maximum: 100, nullable: true },
            overallScore: { type: 'integer', minimum: 0, maximum: 100, nullable: true },
            highlights: { type: 'array', items: { type: 'string' } },
            improvementSuggestions: { type: 'array', items: { type: 'string' } },
            expertInsights: { type: 'array', items: { type: 'string' } },
            technicalFlaws: { type: 'array', items: { type: 'string' } },
            userFeedback: { type: 'string', nullable: true },
            feedbackRating: { type: 'integer', minimum: 1, maximum: 5, nullable: true },
            accepted: { type: 'boolean', nullable: true },
            comparedWithIds: { type: 'array', items: { type: 'string' } },
            comparisonInsight: { type: 'string', nullable: true },
            isGuest: { type: 'boolean', default: false },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        GuestDevice: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            deviceId: { type: 'string' },
            deviceFingerprint: { type: 'string' },
            reviewCount: { type: 'integer', minimum: 0 },
            platform: { type: 'string', nullable: true },
            deviceName: { type: 'string', nullable: true },
            appVersion: { type: 'string', nullable: true },
            osVersion: { type: 'string', nullable: true },
            ipAddress: { type: 'string', nullable: true },
            isBlocked: { type: 'boolean', default: false },
            riskScore: { type: 'integer', minimum: 0, maximum: 100 },
            lastUsedAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            errors: { 
              type: 'array', 
              items: { 
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        OutfitAnalysis: {
          type: 'object',
          properties: {
            styleCategory: { type: 'string' },
            styleCategoryScore: { type: 'integer', minimum: 0, maximum: 100 },
            fit: { type: 'string' },
            fitScore: { type: 'integer', minimum: 0, maximum: 100 },
            colorHarmony: { type: 'string' },
            colorHarmonyScore: { type: 'integer', minimum: 0, maximum: 100 },
            occasionSuitability: { type: 'string' },
            occasionScore: { type: 'integer', minimum: 0, maximum: 100 },
            proportionBalance: { type: 'string' },
            proportionScore: { type: 'integer', minimum: 0, maximum: 100 },
            fabricSynergy: { type: 'string' },
            fabricScore: { type: 'integer', minimum: 0, maximum: 100 },
            stylingSophistication: { type: 'string' },
            sophisticationScore: { type: 'integer', minimum: 0, maximum: 100 },
            overallScore: { type: 'integer', minimum: 0, maximum: 100 },
            highlights: { type: 'array', items: { type: 'string' } },
            improvementSuggestions: { type: 'array', items: { type: 'string' } },
            expertInsights: { type: 'array', items: { type: 'string' } },
            technicalFlaws: { type: 'array', items: { type: 'string' } },
          },
        },
        GuestUsage: {
          type: 'object',
          properties: {
            used: { type: 'integer', minimum: 0 },
            limit: { type: 'integer', minimum: 0 },
            remaining: { type: 'integer', minimum: 0 },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User registration and authentication endpoints',
      },
      {
        name: 'Profile',
        description: 'User profile management endpoints',
      },
      {
        name: 'Reviews',
        description: 'Outfit review and analysis endpoints (authenticated)',
      },
      {
        name: 'Guest Reviews',
        description: 'Outfit review endpoints for guest users',
      },
      {
        name: 'System',
        description: 'System health and status endpoints',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/index.ts',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);

export const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
  },
};

export { swaggerUi };
