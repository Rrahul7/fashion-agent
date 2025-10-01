import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { config } from './config/config';
import { initializeProduction, productionConfig, validateProductionConfig } from './config/production';
import { authRoutes } from './routes/auth';
import { profileRoutes } from './routes/profile';
import { reviewRoutes } from './routes/reviews';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { 
  mobileSecurityMiddleware, 
  securityLogger, 
  sanitizeInput 
} from './middleware/mobileSecurityMiddleware';
import { swaggerSpec, swaggerUi, swaggerOptions } from './config/swagger';

const app = express();

// Initialize production configuration
if (config.nodeEnv === 'production') {
  initializeProduction();
}

// Security middleware with environment-specific settings
const helmetConfig = config.nodeEnv === 'production' ? productionConfig.helmet : {
  crossOriginResourcePolicy: { policy: "cross-origin" as const },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
    },
  },
};

app.use(helmet(helmetConfig));

// CORS configuration based on environment
const corsConfig = config.nodeEnv === 'production' ? productionConfig.cors : {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'capacitor://localhost',
      'http://localhost',
      'ionic://localhost',
      'file://',
    ];
    
    // Add local network access for development
    const localNetworkRegex = /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/;
    const localhostRegex = /^http:\/\/localhost(:\d+)?$/;
    
    const isAllowed = allowedOrigins.includes(origin) || 
                     localNetworkRegex.test(origin) || 
                     localhostRegex.test(origin) ||
                     process.env.NODE_ENV === 'development';
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Timestamp',
    'X-Signature',
    'X-Platform',
    'X-App-Version',
    'X-Device-ID',
    'X-Device-Fingerprint'
  ],
  exposedHeaders: ['X-RateLimit-Remaining', 'X-RateLimit-Limit'],
};

app.use(cors(corsConfig));

// Environment-specific rate limiting
const rateLimitConfig = config.nodeEnv === 'production' ? productionConfig.rateLimits : {
  general: {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      error: 'Too many requests',
      message: 'Please try again later',
      retryAfter: 15 * 60,
    },
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
      error: 'Too many login attempts',
      message: 'Please wait 15 minutes before trying again',
      retryAfter: 15 * 60,
    },
    skipSuccessfulRequests: true,
  },
  upload: {
    windowMs: 60 * 1000,
    max: 10,
    message: {
      error: 'Upload limit exceeded',
      message: 'Please wait a moment before uploading again',
      retryAfter: 60,
    },
  },
};

const generalLimiter = rateLimit({
  ...rateLimitConfig.general,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit(rateLimitConfig.auth);
const uploadLimiter = rateLimit(rateLimitConfig.upload);

// Apply rate limiters
app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/reviews', uploadLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Mobile security and logging middleware
app.use(securityLogger);
app.use(mobileSecurityMiddleware);
app.use(sanitizeInput);

// Health check
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

// API Schema endpoint
app.get('/api/schema', (req, res) => {
  res.json(swaggerSpec);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/reviews', reviewRoutes); // Now supports both authenticated users and guests

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.port || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Fashion Agent API server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Database: ${config.database.url ? 'Connected' : 'Not configured'}`);
});
