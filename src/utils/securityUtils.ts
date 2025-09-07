// src/utils/securityUtils.ts
import { SECURITY_CONFIG } from './constants';

export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
}

// Rate limiting utilities
export class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>();

  static checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const limitInfo = this.requests.get(identifier);

    if (!limitInfo || now > limitInfo.resetTime) {
      // Reset atau buat baru
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS
      });
      return { allowed: true };
    }

    if (limitInfo.count >= SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS) {
      return { 
        allowed: false, 
        retryAfter: Math.ceil((limitInfo.resetTime - now) / 1000) 
      };
    }

    // Increment counter
    limitInfo.count++;
    this.requests.set(identifier, limitInfo);
    
    return { allowed: true };
  }

  static cleanupExpired() {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Input validation utilities
export const validateInputLength = (input: string, maxLength: number = SECURITY_CONFIG.VALIDATION.MAX_INPUT_LENGTH): SecurityValidationResult => {
  const errors: string[] = [];
  
  if (input.length > maxLength) {
    errors.push(`Input terlalu panjang. Maksimal ${maxLength} karakter`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateTextareaLength = (input: string, maxLength: number = SECURITY_CONFIG.VALIDATION.MAX_TEXTAREA_LENGTH): SecurityValidationResult => {
  const errors: string[] = [];
  
  if (input.length > maxLength) {
    errors.push(`Teks terlalu panjang. Maksimal ${maxLength} karakter`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateFileType = (fileType: string): SecurityValidationResult => {
  const errors: string[] = [];
  
  if (!SECURITY_CONFIG.VALIDATION.ALLOWED_FILE_TYPES.includes(fileType)) {
    errors.push(`Tipe file ${fileType} tidak diizinkan`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateFileSize = (fileSize: number): SecurityValidationResult => {
  const errors: string[] = [];
  
  if (fileSize > SECURITY_CONFIG.VALIDATION.MAX_FILE_SIZE) {
    errors.push(`Ukuran file terlalu besar. Maksimal ${SECURITY_CONFIG.VALIDATION.MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Password validation
export const validatePassword = (password: string): SecurityValidationResult => {
  const errors: string[] = [];
  const policy = SECURITY_CONFIG.PASSWORD_POLICY;

  if (password.length < policy.MIN_LENGTH) {
    errors.push(`Password minimal ${policy.MIN_LENGTH} karakter`);
  }

  if (policy.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung huruf besar');
  }

  if (policy.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password harus mengandung huruf kecil');
  }

  if (policy.REQUIRE_NUMBER && !/\d/.test(password)) {
    errors.push('Password harus mengandung angka');
  }

  if (policy.REQUIRE_SPECIAL_CHAR && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password harus mengandung karakter khusus');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// XSS prevention
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// CSRF token utilities
export const generateCSRFToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const validateCSRFToken = (token: string, expectedToken: string): boolean => {
  return token === expectedToken;
};

// Session management
export const checkSessionTimeout = (lastActivity: number): { expired: boolean; timeRemaining: number } => {
  const now = Date.now();
  const timeElapsed = now - lastActivity;
  const timeRemaining = SECURITY_CONFIG.SESSION.TIMEOUT - timeElapsed;

  return {
    expired: timeRemaining <= 0,
    timeRemaining: Math.max(0, timeRemaining)
  };
};

// Export semua utilities
export default {
  RateLimiter,
  validateInputLength,
  validateTextareaLength,
  validateFileType,
  validateFileSize,
  validatePassword,
  sanitizeInput,
  generateCSRFToken,
  validateCSRFToken,
  checkSessionTimeout
};