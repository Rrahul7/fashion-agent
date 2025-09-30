import { config } from './config';

/**
 * Production-specific configuration and validation
 */
export function validateProductionConfig() {
  const errors: string[] = [];

  // Critical environment variables that must be set in production
  const requiredEnvVars = [
    'JWT_SECRET',
    'DATABASE_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY', 
    'CLOUDINARY_API_SECRET',
  ];

  // Validate required environment variables
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      errors.push(`${varName} is required in production`);
    }
  });

  // JWT Secret validation
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  // Database URL validation
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('ssl=true') && !process.env.DATABASE_URL.includes('sslmode=require')) {
    console.warn('⚠️ DATABASE_URL should use SSL in production');
  }

  // AI API key validation (at least one required)
  if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    errors.push('Either OPENAI_API_KEY or OPENROUTER_API_KEY is required');
  }

  if (errors.length > 0) {
    console.error('❌ Production configuration errors:');
    errors.forEach(error => console.error(`   - ${error}`));
    throw new Error(`Production configuration validation failed. ${errors.length} errors found.`);
  }

  console.log('✅ Production configuration validated successfully');
}

/**
 * Production security configuration
 */
export const productionConfig = {
  // Enhanced CORS for production
  cors: {
    origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        process.env.ADMIN_URL,
        // Add any additional production origins
      ].filter(Boolean);

      // Allow requests with no origin (mobile apps, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS rejected origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Device-ID',
      'X-Device-Fingerprint',
      'X-Platform',
      'X-App-Version'
    ],
  },

  // Enhanced rate limiting for production
  rateLimits: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Higher limit for production
      message: {
        error: 'Rate limit exceeded',
        retryAfter: 900, // 15 minutes
      },
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // Allow more attempts in production
      skipSuccessfulRequests: true,
    },
    upload: {
      windowMs: 60 * 1000, // 1 minute
      max: 20, // More uploads allowed in production
    },
  },

  // Security headers for production
  helmet: {
    crossOriginResourcePolicy: { policy: "cross-origin" as const },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https:", "wss:"],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "https:"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow cross-origin resources
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  },
};

/**
 * Initialize production environment
 */
export function initializeProduction() {
  if (config.nodeEnv === 'production') {
    console.log('🚀 Initializing production environment...');
    
    // Validate configuration
    validateProductionConfig();
    
    // Set production-specific settings
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1'; // Enforce SSL
    
    // Log production startup
    console.log('✅ Production environment initialized');
    console.log(`📊 Environment: ${config.nodeEnv}`);
    console.log(`🔒 JWT expiration: ${config.jwt.expiresIn}`);
    console.log(`🌐 Port: ${config.port}`);
    console.log(`🗄️ Database: ${config.database.url ? 'Connected' : 'Not configured'}`);
  }
}
