// src/services/auth/turnstile.ts
// Server-side Turnstile validation using Cloudflare's Siteverify API

import { logger } from '@/utils/logger';

interface TurnstileValidationResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

interface TurnstileValidationResult {
  valid: boolean;
  error?: string;
  details?: TurnstileValidationResponse;
}

/**
 * Validates Turnstile token using our secure API endpoint
 * This calls Cloudflare's Siteverify API server-side to keep the secret key secure
 */
export async function validateTurnstileToken(
  token: string,
  remoteip?: string,
  expectedAction?: string
): Promise<TurnstileValidationResult> {
  if (!token || typeof token !== 'string') {
    return {
      valid: false,
      error: 'Invalid token format'
    };
  }

  if (token.length > 2048) {
    return {
      valid: false,
      error: 'Token too long'
    };
  }

  try {
    logger.info('🔐 Validating Turnstile token via API endpoint...');
    
    // Call our secure API endpoint for validation
    const response = await fetch('/api/validate-turnstile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        expectedAction
      }),
      // Add timeout
      signal: AbortSignal.timeout(15000) // 15 second timeout (includes API call to Cloudflare)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    logger.debug('Turnstile API validation result:', {
      valid: result.valid,
      hostname: result.hostname,
      challenge_ts: result.challenge_ts,
      action: result.action
    });

    if (!result.valid) {
      logger.warn('Turnstile validation failed:', result.error);
      return {
        valid: false,
        error: result.error,
        details: result.details
      };
    }

    logger.info('✅ Turnstile validation successful:', {
      hostname: result.hostname,
      action: result.action,
      challenge_ts: result.challenge_ts
    });

    return {
      valid: true,
      details: {
        success: true,
        hostname: result.hostname,
        action: result.action,
        challenge_ts: result.challenge_ts
      }
    };

  } catch (error) {
    logger.error('Turnstile validation error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return {
          valid: false,
          error: 'Verification timeout - please try again'
        };
      }
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return {
          valid: false,
          error: 'Network error - please check your connection'
        };
      }
      
      // Return the specific error message from API
      return {
        valid: false,
        error: error.message || 'Verification failed'
      };
    }

    return {
      valid: false,
      error: 'Verification service error'
    };
  }
}

/**
 * Validates Turnstile token with retry logic
 */
export async function validateTurnstileTokenWithRetry(
  token: string,
  remoteip?: string,
  expectedAction?: string,
  maxRetries: number = 2
): Promise<TurnstileValidationResult> {
  let lastError = '';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await validateTurnstileToken(token, remoteip, expectedAction);
      
      if (result.valid || attempt === maxRetries) {
        return result;
      }
      
      // Only retry on certain errors
      const retryableErrors = ['network', 'timeout', 'service error', 'temporarily unavailable'];
      const shouldRetry = retryableErrors.some(error => 
        result.error?.toLowerCase().includes(error)
      );
      
      if (!shouldRetry) {
        return result;
      }
      
      lastError = result.error || 'Unknown error';
      
      // Exponential backoff delay
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      logger.info(`Retrying Turnstile validation (attempt ${attempt + 1}/${maxRetries})`);
      
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      
      if (attempt === maxRetries) {
        return {
          valid: false,
          error: `Verification failed after ${maxRetries} attempts: ${lastError}`
        };
      }
    }
  }
  
  return {
    valid: false,
    error: `Verification failed: ${lastError}`
  };
}
