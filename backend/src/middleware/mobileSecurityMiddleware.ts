import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Extended Request interface to include mobile security headers
interface MobileRequest extends Request {
  timestamp?: number;
  signature?: string;
  platform?: string;
  appVersion?: string;
  isValidSignature?: boolean;
}

// Mobile security middleware
export const mobileSecurityMiddleware = (req: MobileRequest, res: Response, next: NextFunction) => {
  try {
    // Extract mobile-specific headers
    const timestamp = req.headers['x-timestamp'] as string;
    const signature = req.headers['x-signature'] as string;
    const platform = req.headers['x-platform'] as string;
    const appVersion = req.headers['x-app-version'] as string;

    // Add mobile info to request object
    req.platform = platform;
    req.appVersion = appVersion;

    // Skip signature validation for GET requests and health checks
    if (req.method === 'GET' || req.path === '/health') {
      return next();
    }

    // Validate timestamp if provided
    if (timestamp) {
      const requestTime = parseInt(timestamp, 10);
      const currentTime = Date.now();
      const timeDifference = Math.abs(currentTime - requestTime);
      
      // Allow 5 minutes time difference for clock skew
      const maxTimeDifference = 5 * 60 * 1000; // 5 minutes
      
      if (timeDifference > maxTimeDifference) {
        console.warn(`⚠️ Request timestamp too old: ${timeDifference}ms difference`);
        return res.status(400).json({
          error: 'Invalid request timestamp',
          message: 'Request timestamp is too old or too far in the future',
        });
      }
      
      req.timestamp = requestTime;
    }

    // Validate signature if provided (for sensitive operations)
    if (signature && req.body && timestamp) {
      try {
        const payload = JSON.stringify(req.body) + timestamp;
        const expectedSignature = crypto
          .createHash('sha256')
          .update(payload)
          .digest('hex');

        req.isValidSignature = signature === expectedSignature;
        
        if (!req.isValidSignature) {
          console.warn('⚠️ Invalid request signature detected');
          // Log for security monitoring but don't block (signature is optional)
        }
      } catch (error) {
        console.error('Signature validation error:', error);
        req.isValidSignature = false;
      }
    }

    // Log mobile requests for monitoring
    if (platform) {
      console.log(`📱 Mobile request: ${req.method} ${req.path} from ${platform} v${appVersion || 'unknown'}`);
    }

    next();
  } catch (error) {
    console.error('Mobile security middleware error:', error);
    // Don't block requests due to middleware errors
    next();
  }
};

// Middleware to require valid mobile signature for sensitive operations
export const requireValidSignature = (req: MobileRequest, res: Response, next: NextFunction) => {
  const sensitiveOperations = [
    'DELETE',
    'PUT',
  ];

  const sensitivePaths = [
    '/api/auth/password',
    '/api/profile/delete',
    '/api/reviews/delete',
  ];

  const isSensitiveOperation = sensitiveOperations.includes(req.method) || 
                              sensitivePaths.some(path => req.path.includes(path));

  if (isSensitiveOperation && !req.isValidSignature) {
    return res.status(400).json({
      error: 'Invalid request signature',
      message: 'This operation requires a valid request signature',
    });
  }

  next();
};

// Request logging middleware with security info
export const securityLogger = (req: MobileRequest, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Security headers logging
  const securityInfo: any = {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: req.timestamp,
    platform: req.platform,
    appVersion: req.appVersion,
    hasSignature: !!req.headers['x-signature'],
    isValidSignature: req.isValidSignature,
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      ...securityInfo,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    };

    // Log different levels based on response
    if (res.statusCode >= 400) {
      console.error('🔒 Security Log [ERROR]:', JSON.stringify(logData));
    } else if (req.platform) {
      console.log('🔒 Security Log [MOBILE]:', JSON.stringify(logData));
    }

    // Log suspicious activity
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn('🚨 Potential security issue:', JSON.stringify({
        ...logData,
        headers: {
          authorization: req.headers.authorization ? '[PRESENT]' : '[MISSING]',
          origin: req.headers.origin,
          referer: req.headers.referer,
        },
      }));
    }
  });

  next();
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    next(); // Don't block request
  }
};

// Helper function to sanitize object recursively
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeValue(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Sanitize key
    const cleanKey = sanitizeValue(key);
    if (typeof cleanKey === 'string') {
      sanitized[cleanKey] = sanitizeObject(value);
    }
  }

  return sanitized;
}

// Helper function to sanitize individual values
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    // Remove potential XSS patterns
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+=/gi, '') // Remove on* event handlers
      .trim();
  }

  return value;
}

export default {
  mobileSecurityMiddleware,
  requireValidSignature,
  securityLogger,
  sanitizeInput,
};
