import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
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

const app = express();

// Security middleware with mobile support
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Important for mobile
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
    },
  },
}));

// CORS configuration for web and mobile apps
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000', // Web app
      'http://localhost:3000',           // Local web development
      'capacitor://localhost',           // Capacitor iOS
      'http://localhost',                // Capacitor Android
      'ionic://localhost',               // Ionic
      'file://',                         // Local file access
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
    'X-App-Version'
  ],
  exposedHeaders: ['X-RateLimit-Remaining', 'X-RateLimit-Limit'],
}));

// Enhanced rate limiting for different endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: 15 * 60, // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: {
    error: 'Too many login attempts',
    message: 'Please wait 15 minutes before trying again',
    retryAfter: 15 * 60,
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
  message: {
    error: 'Upload limit exceeded',
    message: 'Please wait a moment before uploading again',
    retryAfter: 60,
  },
});

// Apply rate limiters
app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/reviews', uploadLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mobile security and logging middleware
app.use(securityLogger);
app.use(mobileSecurityMiddleware);
app.use(sanitizeInput);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/reviews', reviewRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.port || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Fashion Agent API server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Database: ${config.database.url ? 'Connected' : 'Not configured'}`);
});
