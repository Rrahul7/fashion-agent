import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export interface UnifiedAuthRequest extends Request {
  // User authentication
  userId?: string;
  isAuthenticated?: boolean;
  
  // Guest authentication  
  guestSessionId?: string;
  deviceId?: string;
  deviceFingerprint?: string;
  isGuest?: boolean;
  
  // Device info (for enhanced tracking)
  deviceInfo?: {
    platform?: string;
    deviceName?: string;
    appVersion?: string;
    osVersion?: string;
  };
}

const GUEST_REVIEW_LIMIT = 5;

/**
 * Unified authentication middleware that supports both:
 * 1. JWT token authentication for registered users
 * 2. Device-based authentication for guest users
 */
export async function unifiedAuthMiddleware(
  req: UnifiedAuthRequest, 
  res: Response, 
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const hasToken = authHeader && authHeader.startsWith('Bearer ');
    
    if (hasToken) {
      // Handle JWT token authentication
      await handleJWTAuth(req, res, next);
    } else {
      // Handle guest authentication
      await handleGuestAuth(req, res, next);
    }
  } catch (error) {
    console.error('❌ Unified auth error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Handle JWT token authentication for registered users
 */
async function handleJWTAuth(
  req: UnifiedAuthRequest, 
  res: Response, 
  next: NextFunction
) {
  try {
    const token = req.headers.authorization!.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found', 
        code: 'USER_NOT_FOUND' 
      });
    }
    
    req.userId = decoded.userId;
    req.isAuthenticated = true;
    req.isGuest = false;
    
    console.log('✅ JWT authentication successful:', decoded.userId);
    next();
    
  } catch (error) {
    console.error('❌ JWT authentication failed:', error);
    return res.status(401).json({ 
      error: 'Invalid token', 
      code: 'INVALID_TOKEN' 
    });
  }
}

/**
 * Handle device-based authentication for guest users
 */
async function handleGuestAuth(
  req: UnifiedAuthRequest, 
  res: Response, 
  next: NextFunction
) {
  try {
    req.isGuest = true;
    req.isAuthenticated = false;
    
    // Check for device-based headers (primary method)
    const deviceId = req.headers['x-device-id'] as string;
    const deviceFingerprint = req.headers['x-device-fingerprint'] as string;
    const platform = req.headers['x-device-platform'] as string;
    const deviceName = req.headers['x-device-name'] as string;
    const appVersion = req.headers['x-app-version'] as string;
    const osVersion = req.headers['x-device-os'] as string;
    
    if (deviceId && deviceFingerprint) {
      console.log('📱 Using device-based authentication');
      
      // Validate device ID format
      if (!/^[a-zA-Z0-9\-_]{10,128}$/.test(deviceId)) {
        return res.status(400).json({
          error: 'Invalid device identifier',
          code: 'INVALID_DEVICE_ID'
        });
      }
      
      req.deviceId = deviceId;
      req.deviceFingerprint = deviceFingerprint;
      req.guestSessionId = deviceId; // For backward compatibility
      req.deviceInfo = { platform, deviceName, appVersion, osVersion };
      
      // Update device record
      await updateDeviceRecord(req);
      
    } else {
      // Fallback to session-based authentication
      console.log('🔄 Using session-based authentication fallback');
      
      let guestSessionId = req.cookies['guest-session'] || 
                          req.headers['guest-session'] as string || 
                          req.headers['x-guest-session'] as string;
      
      if (!guestSessionId) {
        guestSessionId = uuidv4();
        res.cookie('guest-session', guestSessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
      }
      
      req.guestSessionId = guestSessionId;
      
      // Update session record
      await updateSessionRecord(req);
    }
    
    console.log('✅ Guest authentication successful');
    next();
    
  } catch (error) {
    console.error('❌ Guest authentication failed:', error);
    return res.status(500).json({
      error: 'Guest authentication failed',
      code: 'GUEST_AUTH_ERROR'
    });
  }
}

/**
 * Update device record for device-based authentication
 */
async function updateDeviceRecord(req: UnifiedAuthRequest) {
  try {
    await prisma.guestDevice.upsert({
      where: { deviceId: req.deviceId! },
      update: {
        lastUsedAt: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        ...(req.deviceInfo?.platform && { platform: req.deviceInfo.platform }),
        ...(req.deviceInfo?.deviceName && { deviceName: req.deviceInfo.deviceName }),
        ...(req.deviceInfo?.appVersion && { appVersion: req.deviceInfo.appVersion }),
        ...(req.deviceInfo?.osVersion && { osVersion: req.deviceInfo.osVersion }),
      },
      create: {
        deviceId: req.deviceId!,
        deviceFingerprint: req.deviceFingerprint!,
        reviewCount: 0,
        platform: req.deviceInfo?.platform,
        deviceName: req.deviceInfo?.deviceName,
        appVersion: req.deviceInfo?.appVersion,
        osVersion: req.deviceInfo?.osVersion,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    });
  } catch (error) {
    console.error('❌ Error updating device record:', error);
    throw error;
  }
}

/**
 * Update session record for session-based authentication
 */
async function updateSessionRecord(req: UnifiedAuthRequest) {
  try {
    await prisma.guestDevice.upsert({
      where: { deviceId: req.guestSessionId! },
      update: {
        lastUsedAt: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
      create: {
        deviceId: req.guestSessionId!,
        deviceFingerprint: req.guestSessionId!,
        reviewCount: 0,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    });
  } catch (error) {
    console.error('❌ Error updating session record:', error);
    throw error;
  }
}

/**
 * Middleware to check review limits (works for both auth types)
 */
export async function checkReviewLimits(
  req: UnifiedAuthRequest, 
  res: Response, 
  next: NextFunction
) {
  try {
    // Authenticated users have unlimited reviews
    if (req.isAuthenticated) {
      return next();
    }
    
    // Check guest limits
    if (req.isGuest && req.guestSessionId) {
      const guestSession = await prisma.guestDevice.findUnique({
        where: { deviceId: req.guestSessionId },
      });
      
      if (!guestSession) {
        return res.status(400).json({ 
          error: 'Invalid guest session',
          code: 'INVALID_SESSION'
        });
      }
      
      if (guestSession.reviewCount >= GUEST_REVIEW_LIMIT) {
        return res.status(429).json({
          error: 'Guest review limit reached. Please sign up for unlimited reviews.',
          code: 'LIMIT_REACHED',
          limit: GUEST_REVIEW_LIMIT,
          used: guestSession.reviewCount,
          message: 'You\'ve used all 5 free reviews. Create an account for unlimited access!'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Review limit check error:', error);
    next(error);
  }
}

/**
 * Increment review usage after successful review creation
 */
export async function incrementReviewUsage(req: UnifiedAuthRequest) {
  // Only increment for guest users
  if (req.isGuest && req.guestSessionId) {
    await prisma.guestDevice.update({
      where: { deviceId: req.guestSessionId },
      data: {
        reviewCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
  }
}

/**
 * Get usage information for current user/guest
 */
export async function getUsageInfo(req: UnifiedAuthRequest) {
  if (req.isAuthenticated) {
    return {
      isAuthenticated: true,
      unlimited: true
    };
  }
  
  if (req.isGuest && req.guestSessionId) {
    const guestSession = await prisma.guestDevice.findUnique({
      where: { deviceId: req.guestSessionId },
      select: { reviewCount: true },
    });
    
    return {
      isAuthenticated: false,
      used: guestSession?.reviewCount || 0,
      limit: GUEST_REVIEW_LIMIT,
      remaining: GUEST_REVIEW_LIMIT - (guestSession?.reviewCount || 0),
    };
  }
  
  return {
    isAuthenticated: false,
    used: 0,
    limit: GUEST_REVIEW_LIMIT,
    remaining: GUEST_REVIEW_LIMIT
  };
}

