// src/services/auth/security/authSecurity.ts - Enhanced authentication security
import { logger } from '@/utils/logger';
import { checkRateLimit, generateSecureToken } from '@/utils/security';
import { supabase } from '@/integrations/supabase/client';

// ✅ Security configuration for authentication
const AUTH_SECURITY_CONFIG = {
  RATE_LIMITS: {
    LOGIN_ATTEMPTS: {
      max: 5,
      windowMs: 15 * 60 * 1000 // 15 minutes
    },
    OTP_REQUESTS: {
      max: 3,
      windowMs: 60 * 60 * 1000 // 1 hour  
    },
    PASSWORD_RESET: {
      max: 3,
      windowMs: 60 * 60 * 1000 // 1 hour
    }
  },
  
  SESSION_TIMEOUT: {
    WARNING_BEFORE_EXPIRY: 5 * 60 * 1000, // 5 minutes
    MAX_IDLE_TIME: 30 * 60 * 1000, // 30 minutes
    ABSOLUTE_TIMEOUT: 8 * 60 * 60 * 1000 // 8 hours
  },
  
  SUSPICIOUS_ACTIVITY: {
    MAX_FAILED_ATTEMPTS: 10,
    LOCKOUT_DURATION: 60 * 60 * 1000, // 1 hour
    GEO_CHANGE_THRESHOLD: 100, // km
    UNUSUAL_TIME_THRESHOLD: 2 * 60 * 60 * 1000 // 2 hours different from usual
  }
};

// In-memory storage for security tracking (in production, use Redis/database)
const securityStore = new Map<string, {
  failedAttempts: number;
  lastFailedAttempt: number;
  lockoutUntil?: number;
  lastSuccessfulLogin?: number;
  suspiciousActivity: Array<{
    type: string;
    timestamp: number;
    details: any;
  }>;
  deviceFingerprint?: string;
  lastKnownLocation?: {
    country?: string;
    region?: string;
    city?: string;
  };
}>();

/**
 * ✅ Rate limiting for authentication attempts
 */
export const checkAuthRateLimit = (
  identifier: string, // email or IP
  type: 'login' | 'otp' | 'password_reset' = 'login'
): { allowed: boolean; remaining: number; resetTime: number } => {
  try {
    const config = AUTH_SECURITY_CONFIG.RATE_LIMITS[type.toUpperCase() as keyof typeof AUTH_SECURITY_CONFIG.RATE_LIMITS];
    const rateLimitKey = `auth:${type}:${identifier}`;
    
    return checkRateLimit(rateLimitKey, config.max, config.windowMs);
  } catch (error) {
    logger.error('[AuthSecurity] Rate limit check error:', error);
    // Fail open to avoid blocking legitimate users
    return { allowed: true, remaining: 0, resetTime: Date.now() };
  }
};

/**
 * ✅ Track failed authentication attempts
 */
export const trackFailedAuthAttempt = (identifier: string, details?: any) => {
  try {
    const now = Date.now();
    const userSecurity = securityStore.get(identifier) || {
      failedAttempts: 0,
      lastFailedAttempt: 0,
      suspiciousActivity: []
    };

    userSecurity.failedAttempts += 1;
    userSecurity.lastFailedAttempt = now;

    // Check if user should be locked out
    if (userSecurity.failedAttempts >= AUTH_SECURITY_CONFIG.SUSPICIOUS_ACTIVITY.MAX_FAILED_ATTEMPTS) {
      userSecurity.lockoutUntil = now + AUTH_SECURITY_CONFIG.SUSPICIOUS_ACTIVITY.LOCKOUT_DURATION;
      
      logger.warn('[AuthSecurity] User locked out due to too many failed attempts:', {
        identifier,
        failedAttempts: userSecurity.failedAttempts,
        lockoutUntil: new Date(userSecurity.lockoutUntil).toISOString()
      });
    }

    // Track suspicious activity
    userSecurity.suspiciousActivity.push({
      type: 'failed_login',
      timestamp: now,
      details: {
        userAgent: navigator.userAgent,
        ...details
      }
    });

    // Keep only last 50 suspicious activities
    if (userSecurity.suspiciousActivity.length > 50) {
      userSecurity.suspiciousActivity = userSecurity.suspiciousActivity.slice(-50);
    }

    securityStore.set(identifier, userSecurity);

    logger.warn('[AuthSecurity] Failed auth attempt tracked:', {
      identifier,
      totalFailedAttempts: userSecurity.failedAttempts,
      isLockedOut: !!userSecurity.lockoutUntil && userSecurity.lockoutUntil > now
    });

  } catch (error) {
    logger.error('[AuthSecurity] Error tracking failed attempt:', error);
  }
};

/**
 * ✅ Track successful authentication
 */
export const trackSuccessfulAuth = (identifier: string, details?: any) => {
  try {
    const now = Date.now();
    const userSecurity = securityStore.get(identifier) || {
      failedAttempts: 0,
      lastFailedAttempt: 0,
      suspiciousActivity: []
    };

    // Reset failed attempts on successful login
    const hadFailedAttempts = userSecurity.failedAttempts > 0;
    userSecurity.failedAttempts = 0;
    userSecurity.lastFailedAttempt = 0;
    userSecurity.lockoutUntil = undefined;
    userSecurity.lastSuccessfulLogin = now;

    // Update device fingerprint if provided
    if (details?.deviceFingerprint) {
      userSecurity.deviceFingerprint = details.deviceFingerprint;
    }

    securityStore.set(identifier, userSecurity);

    if (hadFailedAttempts) {
      logger.info('[AuthSecurity] Failed attempts reset after successful login:', {
        identifier,
        previousFailedAttempts: hadFailedAttempts
      });
    }

    logger.debug('[AuthSecurity] Successful auth tracked:', {
      identifier,
      timestamp: new Date(now).toISOString()
    });

  } catch (error) {
    logger.error('[AuthSecurity] Error tracking successful auth:', error);
  }
};

/**
 * ✅ Check if user is currently locked out
 */
export const isUserLockedOut = (identifier: string): { isLocked: boolean; lockoutUntil?: number } => {
  try {
    const userSecurity = securityStore.get(identifier);
    if (!userSecurity || !userSecurity.lockoutUntil) {
      return { isLocked: false };
    }

    const now = Date.now();
    if (userSecurity.lockoutUntil <= now) {
      // Lockout expired, clean up
      userSecurity.lockoutUntil = undefined;
      securityStore.set(identifier, userSecurity);
      return { isLocked: false };
    }

    return { 
      isLocked: true, 
      lockoutUntil: userSecurity.lockoutUntil 
    };
  } catch (error) {
    logger.error('[AuthSecurity] Error checking lockout status:', error);
    return { isLocked: false };
  }
};

/**
 * ✅ Session timeout management
 */
export class SessionTimeoutManager {
  private timeoutWarningTimer?: NodeJS.Timeout;
  private absoluteTimeoutTimer?: NodeJS.Timeout;
  private idleTimer?: NodeJS.Timeout;
  private lastActivity: number = Date.now();

  constructor(
    private onWarning: () => void,
    private onTimeout: () => void
  ) {
    this.resetTimers();
    this.setupActivityTracking();
  }

  private setupActivityTracking() {
    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const activityHandler = () => {
      this.updateLastActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, activityHandler, true);
    });

    // Cleanup function
    this.cleanup = () => {
      events.forEach(event => {
        document.removeEventListener(event, activityHandler, true);
      });
    };
  }

  private updateLastActivity() {
    this.lastActivity = Date.now();
    this.resetIdleTimer();
  }

  private resetTimers() {
    this.clearTimers();

    const now = Date.now();
    
    // Set absolute timeout
    this.absoluteTimeoutTimer = setTimeout(() => {
      logger.warn('[AuthSecurity] Absolute session timeout reached');
      this.onTimeout();
    }, AUTH_SECURITY_CONFIG.SESSION_TIMEOUT.ABSOLUTE_TIMEOUT);

    // Set warning timer (5 minutes before absolute timeout)
    const warningTime = AUTH_SECURITY_CONFIG.SESSION_TIMEOUT.ABSOLUTE_TIMEOUT - AUTH_SECURITY_CONFIG.SESSION_TIMEOUT.WARNING_BEFORE_EXPIRY;
    this.timeoutWarningTimer = setTimeout(() => {
      logger.warn('[AuthSecurity] Session timeout warning');
      this.onWarning();
    }, warningTime);

    this.resetIdleTimer();
  }

  private resetIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      const now = Date.now();
      const idleTime = now - this.lastActivity;
      
      if (idleTime >= AUTH_SECURITY_CONFIG.SESSION_TIMEOUT.MAX_IDLE_TIME) {
        logger.warn('[AuthSecurity] Session idle timeout reached');
        this.onTimeout();
      }
    }, AUTH_SECURITY_CONFIG.SESSION_TIMEOUT.MAX_IDLE_TIME);
  }

  private clearTimers() {
    if (this.timeoutWarningTimer) {
      clearTimeout(this.timeoutWarningTimer);
    }
    if (this.absoluteTimeoutTimer) {
      clearTimeout(this.absoluteTimeoutTimer);
    }
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
  }

  public extendSession() {
    logger.debug('[AuthSecurity] Session extended');
    this.resetTimers();
  }

  public destroy() {
    this.clearTimers();
    if (this.cleanup) {
      this.cleanup();
    }
  }

  private cleanup?: () => void;
}

/**
 * ✅ Detect suspicious activity patterns
 */
export const detectSuspiciousActivity = async (identifier: string, context: {
  userAgent?: string;
  ipAddress?: string;
  location?: string;
  loginTime?: number;
}) => {
  try {
    const userSecurity = securityStore.get(identifier);
    if (!userSecurity) return { isSuspicious: false };

    const suspiciousFlags: string[] = [];

    // Check for unusual time patterns (if we have previous login data)
    if (userSecurity.lastSuccessfulLogin && context.loginTime) {
      const timeDiff = Math.abs(context.loginTime - userSecurity.lastSuccessfulLogin);
      if (timeDiff > AUTH_SECURITY_CONFIG.SUSPICIOUS_ACTIVITY.UNUSUAL_TIME_THRESHOLD) {
        suspiciousFlags.push('unusual_time_pattern');
      }
    }

    // Check for rapid successive attempts
    const recentActivity = userSecurity.suspiciousActivity.filter(
      activity => activity.timestamp > Date.now() - (10 * 60 * 1000) // last 10 minutes
    );
    
    if (recentActivity.length > 3) {
      suspiciousFlags.push('rapid_attempts');
    }

    // Check device fingerprint changes
    if (userSecurity.deviceFingerprint && context.userAgent) {
      // Simple fingerprint check (in production, use more sophisticated fingerprinting)
      const simpleFingerprint = btoa(context.userAgent).slice(0, 20);
      if (userSecurity.deviceFingerprint !== simpleFingerprint) {
        suspiciousFlags.push('device_change');
      }
    }

    const isSuspicious = suspiciousFlags.length > 0;

    if (isSuspicious) {
      logger.warn('[AuthSecurity] Suspicious activity detected:', {
        identifier,
        flags: suspiciousFlags,
        context
      });

      // Track suspicious activity
      userSecurity.suspiciousActivity.push({
        type: 'suspicious_login',
        timestamp: Date.now(),
        details: {
          flags: suspiciousFlags,
          context
        }
      });

      securityStore.set(identifier, userSecurity);
    }

    return { 
      isSuspicious, 
      suspiciousFlags,
      riskScore: suspiciousFlags.length * 0.3 // Simple risk scoring
    };

  } catch (error) {
    logger.error('[AuthSecurity] Error detecting suspicious activity:', error);
    return { isSuspicious: false };
  }
};

/**
 * ✅ Generate secure session token
 */
export const generateSecureSessionToken = (): string => {
  return generateSecureToken(64); // 64 character secure token
};

/**
 * ✅ Security audit logging
 */
export const logSecurityEvent = async (event: {
  type: 'login' | 'logout' | 'password_reset' | 'suspicious_activity' | 'lockout';
  userId?: string;
  email?: string;
  success: boolean;
  details?: any;
}) => {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event_type: event.type,
      user_id: event.userId,
      email: event.email,
      success: event.success,
      user_agent: navigator.userAgent,
      details: event.details
    };

    // Log to console for development
    if (import.meta.env.DEV) {
      logger.info('[AuthSecurity] Security event:', logEntry);
    }

    // In production, you might want to send this to a security logging service
    // await sendToSecurityLog(logEntry);

  } catch (error) {
    logger.error('[AuthSecurity] Error logging security event:', error);
  }
};

// Export configuration for reference
export { AUTH_SECURITY_CONFIG };

export default {
  checkAuthRateLimit,
  trackFailedAuthAttempt,
  trackSuccessfulAuth,
  isUserLockedOut,
  SessionTimeoutManager,
  detectSuspiciousActivity,
  generateSecureSessionToken,
  logSecurityEvent,
  AUTH_SECURITY_CONFIG
};
