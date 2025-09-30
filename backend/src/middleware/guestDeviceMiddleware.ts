import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export interface GuestDeviceRequest extends Request {
  deviceId?: string;
  deviceFingerprint?: string;
  isGuest?: boolean;
  userId?: string;
  deviceInfo?: {
    platform?: string;
    deviceName?: string;
    appVersion?: string;
    osVersion?: string;
  };
}

export interface AuthRequest extends GuestDeviceRequest {
  userId?: string;
}

// Security configuration
const GUEST_REVIEW_LIMIT = 3;
const DAILY_REQUEST_LIMIT = 50; // Max requests per device per day
const RAPID_REQUEST_LIMIT = 10; // Max requests per minute
const HIGH_RISK_THRESHOLD = 75; // Block devices above this risk score

/**
 * Secure device-based guest tracking middleware
 * Much more secure than session-based tracking
 */
export async function guestDeviceTrackingMiddleware(
  req: GuestDeviceRequest, 
  res: Response, 
  next: NextFunction
) {
  try {
    // Check if user is authenticated
    const authHeader = req.headers.authorization;
    const hasToken = authHeader && authHeader.startsWith('Bearer ');
    
    console.log('📱 Device tracking - Auth header:', hasToken ? 'Present' : 'None');
    
    if (!hasToken) {
      // This is a guest user - use device-based tracking
      req.isGuest = true;
      
      // Extract device information from headers
      const deviceId = req.headers['x-device-id'] as string;
      const deviceFingerprint = req.headers['x-device-fingerprint'] as string;
      const platform = req.headers['x-device-platform'] as string;
      const deviceName = req.headers['x-device-name'] as string;
      const appVersion = req.headers['x-app-version'] as string;
      const osVersion = req.headers['x-device-os'] as string;
      const deviceWarning = req.headers['x-device-warning'] as string;

      console.log('📱 Device headers received:', {
        deviceId: deviceId ? deviceId.substring(0, 20) + '...' : 'None',
        fingerprint: deviceFingerprint ? deviceFingerprint.substring(0, 16) + '...' : 'None',
        platform,
        warning: deviceWarning
      });

      // Validate required device information
      if (!deviceId || !deviceFingerprint) {
        console.error('❌ Missing required device identification');
        return res.status(400).json({ 
          error: 'Device identification required',
          code: 'MISSING_DEVICE_ID',
          message: 'This app requires device identification for guest access'
        });
      }

      // Validate device ID format (prevent injection)
      if (!/^device_[a-f0-9]{32}$/.test(deviceId)) {
        console.error('❌ Invalid device ID format:', deviceId);
        return res.status(400).json({
          error: 'Invalid device identifier',
          code: 'INVALID_DEVICE_ID'
        });
      }

      req.deviceId = deviceId;
      req.deviceFingerprint = deviceFingerprint;
      req.deviceInfo = { platform, deviceName, appVersion, osVersion };

      // Get or create device record with enhanced security tracking
      try {
        const deviceRecord = await prisma.guestDevice.upsert({
          where: { deviceId },
          update: { 
            lastUsedAt: new Date(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            totalRequests: { increment: 1 },
            
            // Update device metadata if provided
            ...(platform && { platform }),
            ...(deviceName && { deviceName }),
            ...(appVersion && { appVersion }),
            ...(osVersion && { osVersion }),
            
            // Handle IP address tracking
            ipAddresses: {
              set: await updateIpAddresses(deviceId, req.ip)
            },
            
            // Reset daily counters if needed
            ...(await shouldResetDailyCounters(deviceId) && {
              dailyRequestCount: 1,
              lastDailyReset: new Date()
            }),
            
            // Increment counters
            dailyRequestCount: { increment: 1 },
            rapidRequestCount: { increment: 1 },
            
            // Handle device inconsistency warnings
            ...(deviceWarning === 'inconsistent' && {
              inconsistencyCount: { increment: 1 },
              riskScore: { increment: 10 }
            })
          },
          create: {
            deviceId,
            deviceFingerprint,
            reviewCount: 0,
            platform,
            deviceName,
            appVersion,
            osVersion,
            ipAddress: req.ip,
            ipAddresses: req.ip ? [req.ip] : [],
            userAgent: req.get('User-Agent'),
            totalRequests: 1,
            dailyRequestCount: 1,
            rapidRequestCount: 1,
            riskScore: deviceWarning === 'inconsistent' ? 10 : 0,
            inconsistencyCount: deviceWarning === 'inconsistent' ? 1 : 0,
          },
        });

        console.log('✅ Device record updated:', { 
          deviceId: deviceId.substring(0, 20) + '...',
          reviewCount: deviceRecord.reviewCount,
          riskScore: deviceRecord.riskScore,
          isBlocked: deviceRecord.isBlocked
        });

        // Security checks
        await performSecurityChecks(deviceRecord, req, res);

      } catch (dbError) {
        console.error('❌ Database error with device tracking:', dbError);
        return res.status(500).json({
          error: 'Device tracking failed',
          code: 'DATABASE_ERROR'
        });
      }
    } else {
      req.isGuest = false;
    }
    
    next();
  } catch (error) {
    console.error('❌ Device tracking error:', error);
    return res.status(500).json({
      error: 'Device tracking failed',
      code: 'TRACKING_ERROR'
    });
  }
}

/**
 * Check device limits and security constraints
 */
export async function checkDeviceLimit(
  req: GuestDeviceRequest, 
  res: Response, 
  next: NextFunction
) {
  try {
    if (!req.isGuest || !req.deviceId) {
      console.log('✅ Not a guest user or no device ID, proceeding...');
      return next();
    }
    
    // Get current device status
    const deviceRecord = await prisma.guestDevice.findUnique({
      where: { deviceId: req.deviceId },
    });
    
    if (!deviceRecord) {
      console.error('❌ Device record not found:', req.deviceId);
      return res.status(400).json({ 
        error: 'Device not registered',
        code: 'DEVICE_NOT_FOUND'
      });
    }

    // Check if device is blocked
    if (deviceRecord.isBlocked) {
      console.log('🚫 Device is blocked:', req.deviceId);
      return res.status(403).json({
        error: 'Device blocked due to policy violations',
        code: 'DEVICE_BLOCKED',
        message: 'Your device has been blocked. Contact support if you believe this is an error.'
      });
    }

    // Check high risk score
    if (deviceRecord.riskScore >= HIGH_RISK_THRESHOLD) {
      console.log('⚠️ High risk device detected:', req.deviceId, 'Score:', deviceRecord.riskScore);
      return res.status(429).json({
        error: 'Device flagged for suspicious activity',
        code: 'HIGH_RISK_DEVICE',
        message: 'Your device has been flagged. Please contact support.',
        riskScore: deviceRecord.riskScore
      });
    }

    // Check daily request limits
    if (deviceRecord.dailyRequestCount >= DAILY_REQUEST_LIMIT) {
      console.log('🚫 Daily request limit exceeded:', req.deviceId);
      return res.status(429).json({
        error: 'Daily request limit exceeded',
        code: 'DAILY_LIMIT_EXCEEDED',
        limit: DAILY_REQUEST_LIMIT,
        message: 'Too many requests today. Try again tomorrow or create an account.'
      });
    }

    // Check rapid request limits
    if (deviceRecord.rapidRequestCount >= RAPID_REQUEST_LIMIT) {
      console.log('🚫 Rapid request limit exceeded:', req.deviceId);
      return res.status(429).json({
        error: 'Too many requests too quickly',
        code: 'RATE_LIMIT_EXCEEDED', 
        message: 'Please wait a moment before trying again.'
      });
    }

    // Check review limits
    if (deviceRecord.reviewCount >= GUEST_REVIEW_LIMIT) {
      console.log('🚫 Guest review limit reached:', deviceRecord.reviewCount);
      return res.status(429).json({
        error: 'Guest review limit reached. Please sign up for unlimited reviews.',
        code: 'LIMIT_REACHED',
        limit: GUEST_REVIEW_LIMIT,
        used: deviceRecord.reviewCount,
        message: 'You\'ve used all 3 free reviews. Create an account for unlimited access!'
      });
    }
    
    console.log('✅ Device limits check passed');
    next();
  } catch (error) {
    console.error('❌ Device limit check error:', error);
    next(error);
  }
}

/**
 * Increment device usage after successful operation
 */
export async function incrementDeviceUsage(deviceId: string) {
  await prisma.guestDevice.update({
    where: { deviceId },
    data: {
      reviewCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
  });
}

/**
 * Get device usage information
 */
export async function getDeviceUsage(deviceId: string) {
  const deviceRecord = await prisma.guestDevice.findUnique({
    where: { deviceId },
    select: {
      reviewCount: true,
      dailyRequestCount: true,
      riskScore: true,
      isBlocked: true,
    },
  });
  
  return {
    used: deviceRecord?.reviewCount || 0,
    limit: GUEST_REVIEW_LIMIT,
    remaining: Math.max(0, GUEST_REVIEW_LIMIT - (deviceRecord?.reviewCount || 0)),
    dailyRequests: deviceRecord?.dailyRequestCount || 0,
    dailyLimit: DAILY_REQUEST_LIMIT,
    riskScore: deviceRecord?.riskScore || 0,
    isBlocked: deviceRecord?.isBlocked || false,
  };
}

// Helper functions

/**
 * Update IP address history for device
 */
async function updateIpAddresses(deviceId: string, currentIp: string): Promise<string[]> {
  const device = await prisma.guestDevice.findUnique({
    where: { deviceId },
    select: { ipAddresses: true }
  });
  
  const existingIps = device?.ipAddresses || [];
  const uniqueIps = [...new Set([currentIp, ...existingIps])];
  
  // Keep only last 10 IPs
  return uniqueIps.slice(0, 10);
}

/**
 * Check if daily counters should be reset
 */
async function shouldResetDailyCounters(deviceId: string): Promise<boolean> {
  const device = await prisma.guestDevice.findUnique({
    where: { deviceId },
    select: { lastDailyReset: true }
  });
  
  if (!device?.lastDailyReset) return false;
  
  const now = new Date();
  const lastReset = device.lastDailyReset;
  const timeDiff = now.getTime() - lastReset.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  return hoursDiff >= 24;
}

/**
 * Perform comprehensive security checks
 */
async function performSecurityChecks(
  deviceRecord: any, 
  req: GuestDeviceRequest,
  res: Response
) {
  let riskIncrease = 0;
  
  // Check for rapid IP changes (potential proxy abuse)
  if (deviceRecord.ipAddresses.length > 5) {
    console.warn('⚠️ Multiple IPs detected for device:', req.deviceId);
    riskIncrease += 15;
  }
  
  // Check for high inconsistency count
  if (deviceRecord.inconsistencyCount > 3) {
    console.warn('⚠️ High device inconsistency count:', req.deviceId);
    riskIncrease += 20;
  }
  
  // Check for unusual request patterns
  if (deviceRecord.rapidRequestCount > 5) {
    riskIncrease += 5;
  }
  
  // Update risk score if needed
  if (riskIncrease > 0) {
    await prisma.guestDevice.update({
      where: { deviceId: req.deviceId },
      data: {
        riskScore: { increment: riskIncrease }
      }
    });
    
    console.warn(`⚠️ Risk score increased by ${riskIncrease} for device:`, req.deviceId);
  }
}

/**
 * Reset rapid request counter (called by background job)
 */
export async function resetRapidRequestCounters() {
  await prisma.guestDevice.updateMany({
    data: {
      rapidRequestCount: 0
    }
  });
  console.log('✅ Rapid request counters reset');
}

