import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export interface GuestRequest extends Request {
  guestSessionId?: string;
  isGuest?: boolean;
  userId?: string;
}

export interface AuthRequest extends GuestRequest {
  userId?: string;
}

const GUEST_REVIEW_LIMIT = 3;

export async function guestTrackingMiddleware(req: GuestRequest, res: Response, next: NextFunction) {
  try {
    // Check if user is authenticated
    const authHeader = req.headers.authorization;
    const hasToken = authHeader && authHeader.startsWith('Bearer ');
    
    console.log('🔍 Guest tracking - Auth header:', hasToken ? 'Present' : 'None');
    
    if (!hasToken) {
      // This is a guest user
      req.isGuest = true;
      
      // NEW: Check for device-based headers first (more secure)
      const deviceId = req.headers['x-device-id'] as string;
      const deviceFingerprint = req.headers['x-device-fingerprint'] as string;
      
      if (deviceId && deviceFingerprint) {
        console.log('📱 Using device-based tracking:', {
          deviceId: deviceId.substring(0, 20) + '...',
          fingerprint: deviceFingerprint.substring(0, 16) + '...'
        });
        
        // Use device ID as session ID for backward compatibility
        req.guestSessionId = deviceId;
        
        // Store device info for enhanced tracking
        try {
          const deviceRecord = await prisma.guestSession.upsert({
            where: { sessionId: deviceId },
            update: { 
              lastUsedAt: new Date(),
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
            },
            create: {
              sessionId: deviceId,
              reviewCount: 0,
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
            },
          });
          console.log('✅ Device-based session updated:', { 
            deviceId: deviceId.substring(0, 20) + '...', 
            count: deviceRecord.reviewCount 
          });
        } catch (dbError) {
          console.error('❌ Database error with device session:', dbError);
        }
        
      } else {
        // FALLBACK: Legacy session-based approach
        console.log('🔍 Falling back to session-based tracking');
        console.log('🔍 Guest tracking - Headers:', {
          'guest-session': req.headers['guest-session'],
          'Guest-Session': req.headers['Guest-Session'], 
          'x-guest-session': req.headers['x-guest-session'],
          'cookie': req.headers.cookie
        });
        
        // Get or create guest session (check multiple header variations)
        let guestSessionId = req.cookies['guest-session'] || 
                            req.headers['guest-session'] as string || 
                            req.headers['Guest-Session'] as string || 
                            req.headers['x-guest-session'] as string;
        
        console.log('🔍 Found legacy session ID:', guestSessionId);
        
        if (!guestSessionId) {
          guestSessionId = uuidv4();
          console.log('🆕 Generated new legacy session ID:', guestSessionId);
          res.cookie('guest-session', guestSessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
          });
        }
        
        req.guestSessionId = guestSessionId;
        
        // Only create session record for legacy sessions (device sessions already handled above)
        try {
          const guestSession = await prisma.guestSession.upsert({
            where: { sessionId: guestSessionId },
            update: { 
              lastUsedAt: new Date(),
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
            },
            create: {
              sessionId: guestSessionId,
              reviewCount: 0,
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
            },
          });
          console.log('✅ Legacy session saved:', { id: guestSession.sessionId, count: guestSession.reviewCount });
        } catch (dbError) {
          console.error('❌ Database error creating legacy session:', dbError);
          throw dbError;
        }
      }
    } else {
      req.isGuest = false;
    }
    
    next();
  } catch (error) {
    console.error('Guest tracking error:', error);
    next(error);
  }
}

export async function checkGuestLimit(req: GuestRequest, res: Response, next: NextFunction) {
  try {
    console.log('🔍 Checking guest limit - isGuest:', req.isGuest, 'sessionId:', req.guestSessionId);
    
    if (!req.isGuest || !req.guestSessionId) {
      console.log('✅ Not a guest user or no session ID, proceeding...');
      return next();
    }
    
    // Check current usage
    const guestSession = await prisma.guestSession.findUnique({
      where: { sessionId: req.guestSessionId },
    });
    
    console.log('🔍 Found guest session in DB:', guestSession);
    
    if (!guestSession) {
      console.error('❌ Guest session not found in database:', req.guestSessionId);
      return res.status(400).json({ 
        error: 'Invalid guest session',
        code: 'INVALID_SESSION',
        sessionId: req.guestSessionId
      });
    }
    
    if (guestSession.reviewCount >= GUEST_REVIEW_LIMIT) {
      console.log('🚫 Guest review limit reached:', guestSession.reviewCount);
      return res.status(429).json({
        error: 'Guest review limit reached. Please sign up for unlimited reviews.',
        code: 'LIMIT_REACHED',
        limit: GUEST_REVIEW_LIMIT,
        used: guestSession.reviewCount,
        message: 'You\'ve used all 3 free reviews. Create an account for unlimited access!'
      });
    }
    
    console.log('✅ Guest session valid, proceeding with review...');
    next();
  } catch (error) {
    console.error('Guest limit check error:', error);
    next(error);
  }
}

export async function incrementGuestUsage(guestSessionId: string) {
  await prisma.guestSession.update({
    where: { sessionId: guestSessionId },
    data: {
      reviewCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
  });
}

export async function getGuestUsage(guestSessionId: string) {
  const guestSession = await prisma.guestSession.findUnique({
    where: { sessionId: guestSessionId },
    select: {
      reviewCount: true,
    },
  });
  
  return {
    used: guestSession?.reviewCount || 0,
    limit: GUEST_REVIEW_LIMIT,
    remaining: GUEST_REVIEW_LIMIT - (guestSession?.reviewCount || 0),
  };
}
