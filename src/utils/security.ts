// src/utils/security.ts - Security utilities for XSS protection and input sanitization
import DOMPurify from 'dompurify';
import { logger } from '@/utils/logger';

// ✅ Security configuration
const SECURITY_CONFIG = {
  // DOMPurify configuration for different contexts
  HTML_SANITIZE_CONFIG: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span'],
    ALLOWED_ATTR: ['class', 'style'],
    FORBID_SCRIPT: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style', 'img'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  },
  
  // Strict config for user-generated content
  STRICT_HTML_CONFIG: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: [],
    FORBID_SCRIPT: true
  },

  // Input length limits
  MAX_INPUT_LENGTH: {
    TEXT: 500,
    TEXTAREA: 2000,
    NAME: 100,
    EMAIL: 255,
    PASSWORD: 128
  }
};

/**
 * ✅ HTML Sanitization with DOMPurify
 */
export const sanitizeHTML = (
  dirty: string,
  config: 'default' | 'strict' = 'default'
): string => {
  try {
    if (!dirty || typeof dirty !== 'string') {
      return '';
    }

    const sanitizeConfig = config === 'strict' 
      ? SECURITY_CONFIG.STRICT_HTML_CONFIG 
      : SECURITY_CONFIG.HTML_SANITIZE_CONFIG;

    const clean = DOMPurify.sanitize(dirty, sanitizeConfig);
    
    if (clean !== dirty) {
      logger.warn('[Security] Content was sanitized:', {
        original_length: dirty.length,
        sanitized_length: clean.length,
        config
      });
    }

    return clean;
  } catch (error) {
    logger.error('[Security] HTML sanitization error:', error);
    return ''; // Fail securely - return empty string
  }
};

/**
 * ✅ Text sanitization for plain text inputs
 */
export const sanitizeText = (input: string, maxLength?: number): string => {
  try {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove any HTML tags
    let clean = input.replace(/<[^>]*>/g, '');
    
    // Remove dangerous characters
    clean = clean.replace(/[<>'"&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char] || char;
    });

    // Apply length limit
    if (maxLength && clean.length > maxLength) {
      clean = clean.substring(0, maxLength);
      logger.warn('[Security] Text truncated due to length limit:', {
        original_length: input.length,
        max_length: maxLength
      });
    }

    return clean.trim();
  } catch (error) {
    logger.error('[Security] Text sanitization error:', error);
    return '';
  }
};

/**
 * ✅ Enhanced input validation with security checks
 */
export const validateAndSanitizeInput = (
  input: string, 
  type: 'text' | 'email' | 'name' | 'textarea' = 'text'
): { isValid: boolean; sanitized: string; error?: string } => {
  try {
    if (typeof input !== 'string') {
      return { isValid: false, sanitized: '', error: 'Input harus berupa teks' };
    }

    // Check for common XSS patterns
    const xssPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi
    ];

    const hasXSS = xssPatterns.some(pattern => pattern.test(input));
    if (hasXSS) {
      logger.warn('[Security] XSS pattern detected in input:', {
        input: input.substring(0, 100), // Log first 100 chars only
        type
      });
      return { 
        isValid: false, 
        sanitized: '', 
        error: 'Input mengandung konten yang tidak aman' 
      };
    }

    // Get length limit for input type
    const maxLength = SECURITY_CONFIG.MAX_INPUT_LENGTH[type.toUpperCase() as keyof typeof SECURITY_CONFIG.MAX_INPUT_LENGTH] 
      || SECURITY_CONFIG.MAX_INPUT_LENGTH.TEXT;

    // Sanitize based on type
    let sanitized: string;
    if (type === 'textarea') {
      sanitized = sanitizeHTML(input, 'strict');
    } else {
      sanitized = sanitizeText(input, maxLength);
    }

    // Validate email format if email type
    if (type === 'email') {
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!emailRegex.test(sanitized)) {
        return { 
          isValid: false, 
          sanitized, 
          error: 'Format email tidak valid' 
        };
      }
    }

    return { isValid: true, sanitized };
  } catch (error) {
    logger.error('[Security] Input validation error:', error);
    return { 
      isValid: false, 
      sanitized: '', 
      error: 'Terjadi kesalahan validasi input' 
    };
  }
};

/**
 * ✅ URL validation to prevent open redirect attacks
 */
export const validateURL = (url: string): { isValid: boolean; error?: string } => {
  try {
    if (!url || typeof url !== 'string') {
      return { isValid: false, error: 'URL tidak valid' };
    }

    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:'];
    const lowerUrl = url.toLowerCase();
    
    if (dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
      logger.warn('[Security] Dangerous protocol detected in URL:', url);
      return { isValid: false, error: 'Protocol URL tidak diizinkan' };
    }

    // Only allow http/https for external URLs
    if (url.includes('://')) {
      if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
        return { isValid: false, error: 'Hanya HTTP/HTTPS yang diizinkan' };
      }
    }

    // Validate URL format
    try {
      new URL(url.startsWith('/') ? `https://example.com${url}` : url);
    } catch {
      return { isValid: false, error: 'Format URL tidak valid' };
    }

    return { isValid: true };
  } catch (error) {
    logger.error('[Security] URL validation error:', error);
    return { isValid: false, error: 'Error validasi URL' };
  }
};

/**
 * ✅ Safe JSON parsing to prevent prototype pollution
 */
export const safeJSONParse = <T = any>(jsonString: string): T | null => {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      return null;
    }

    // Check for dangerous __proto__ or constructor patterns
    if (jsonString.includes('__proto__') || jsonString.includes('constructor')) {
      logger.warn('[Security] Prototype pollution attempt detected');
      return null;
    }

    const parsed = JSON.parse(jsonString);
    
    // Additional check after parsing
    if (parsed && typeof parsed === 'object') {
      if ('__proto__' in parsed || 'constructor' in parsed) {
        logger.warn('[Security] Parsed object contains dangerous properties');
        return null;
      }
    }

    return parsed;
  } catch (error) {
    logger.error('[Security] Safe JSON parse error:', error);
    return null;
  }
};

/**
 * ✅ Rate limiting helper (simple in-memory implementation)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  key: string, 
  maxAttempts: number = 5, 
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } => {
  try {
    const now = Date.now();
    const current = rateLimitStore.get(key);

    if (!current || now > current.resetTime) {
      // Create new or reset expired entry
      const resetTime = now + windowMs;
      rateLimitStore.set(key, { count: 1, resetTime });
      return { allowed: true, remaining: maxAttempts - 1, resetTime };
    }

    if (current.count >= maxAttempts) {
      return { allowed: false, remaining: 0, resetTime: current.resetTime };
    }

    // Increment count
    current.count += 1;
    rateLimitStore.set(key, current);

    return { 
      allowed: true, 
      remaining: maxAttempts - current.count, 
      resetTime: current.resetTime 
    };
  } catch (error) {
    logger.error('[Security] Rate limit check error:', error);
    // Fail open for now to avoid blocking legitimate users
    return { allowed: true, remaining: 0, resetTime: Date.now() };
  }
};

/**
 * ✅ Generate secure random string for tokens/nonces
 */
export const generateSecureToken = (length: number = 32): string => {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for non-browser environments
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  } catch (error) {
    logger.error('[Security] Token generation error:', error);
    // Fallback to timestamp + random
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
};

// Export security configuration for reference
export { SECURITY_CONFIG };

// Export type definitions
export interface SecurityValidationResult {
  isValid: boolean;
  sanitized: string;
  error?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export default {
  sanitizeHTML,
  sanitizeText,
  validateAndSanitizeInput,
  validateURL,
  safeJSONParse,
  checkRateLimit,
  generateSecureToken,
  SECURITY_CONFIG
};
