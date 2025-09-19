// src/utils/auth/sessionValidation.ts - Session Validation Utilities
import type { Session, User } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const sanitizeUser = (user: User | null): User | null => {
  if (!user) {
    logger.debug('AuthValidation: No user provided for sanitization');
    return null;
  }

  if (user.id === 'null' || user.id === 'undefined' || !user.id) {
    logger.error('AuthValidation: Invalid user ID detected', {
      userId: user.id,
      userIdType: typeof user.id,
      email: user.email,
    });
    return null;
  }

  if (typeof user.id !== 'string' || user.id.length < 3) {
    logger.error('AuthValidation: Invalid user ID format', {
      userId: user.id,
      userIdType: typeof user.id,
      userIdLength: user.id?.length || 0,
      email: user.email,
    });
    return null;
  }

  // Loosen UUID validation - warn but don't block non-standard IDs
  if (!UUID_REGEX.test(user.id)) {
    logger.warn('AuthValidation: Non-standard UUID format (not blocking)', {
      userId: user.id,
      userIdType: typeof user.id,
      email: user.email,
    });
    // Don't return null here - allow non-standard IDs to pass through
  }

  logger.debug('AuthValidation: User sanitization passed', {
    userId: user.id,
    email: user.email,
  });

  return user;
};

export const validateSession = (session: Session | null) => {
  if (!session) {
    logger.debug('AuthValidation: No session provided for validation');
    return { session: null, user: null };
  }

  if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
    logger.warn('AuthValidation: Session expired during validation');
    return { session: null, user: null };
  }

  const sanitizedUser = sanitizeUser(session.user);
  if (!sanitizedUser) {
    logger.warn('AuthValidation: Session has invalid user after sanitization', {
      userId: session.user?.id,
    });
    return { session: null, user: null };
  }

  logger.debug('AuthValidation: Session validated', { userId: sanitizedUser.id });
  return { session, user: sanitizedUser };
};

export const isValidEmail = (email: string): boolean => {
  return email && email.includes('@') && email.length > 5;
};

export const checkSessionExpiry = (session: Session | null): boolean => {
  if (!session?.expires_at) return false;
  
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at;
  const timeUntilExpiry = expiresAt - now;
  
  // Session expires within 10 minutes
  return timeUntilExpiry <= 600;
};