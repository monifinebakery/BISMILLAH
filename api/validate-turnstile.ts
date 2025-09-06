// api/validate-turnstile.ts
// Vercel Edge Function for server-side Turnstile validation

export const config = {
  runtime: 'edge',
};

interface TurnstileValidationResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

interface ValidationRequest {
  token: string;
  expectedAction?: string;
}

export default async function handler(request: Request) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Get secret key from environment variables
    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.error('CLOUDFLARE_TURNSTILE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ valid: false, error: 'Server configuration error' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const body = await request.json() as ValidationRequest;
    const { token, expectedAction } = body;

    // Validate input
    if (!token || typeof token !== 'string') {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid token format' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (token.length > 2048) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token too long' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get client IP address
    const remoteip = getClientIP(request);

    // Prepare form data for Cloudflare Siteverify API
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    
    if (remoteip) {
      formData.append('remoteip', remoteip);
    }

    console.log('Validating Turnstile token:', {
      tokenLength: token.length,
      remoteip,
      expectedAction,
      hasSecret: !!secretKey
    });

    // Call Cloudflare Siteverify API
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      // Add timeout
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Siteverify API error: ${response.status} ${response.statusText}`);
    }

    const result: TurnstileValidationResponse = await response.json();
    
    console.log('Turnstile validation result:', {
      success: result.success,
      hostname: result.hostname,
      challenge_ts: result.challenge_ts,
      error_codes: result['error-codes'],
      action: result.action
    });

    if (!result.success) {
      const errorCodes = result['error-codes'] || [];
      console.warn('Turnstile validation failed:', errorCodes);
      
      // Map error codes to user-friendly messages
      const errorMessages: { [key: string]: string } = {
        'missing-input-secret': 'Server configuration error',
        'invalid-input-secret': 'Server configuration error',
        'missing-input-response': 'Missing verification token',
        'invalid-input-response': 'Invalid or expired verification token',
        'bad-request': 'Malformed request',
        'timeout-or-duplicate': 'Token has already been used or expired',
        'internal-error': 'Verification service temporarily unavailable'
      };

      const primaryError = errorCodes[0] || 'unknown';
      const userError = errorMessages[primaryError] || 'Verification failed';

      return new Response(
        JSON.stringify({
          valid: false,
          error: userError,
          errorCodes,
          details: result
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Additional validation checks
    if (expectedAction && result.action !== expectedAction) {
      console.warn('Turnstile action mismatch:', {
        expected: expectedAction,
        received: result.action
      });
      
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Action verification failed',
          details: result
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check token age (warn if older than 4 minutes)
    if (result.challenge_ts) {
      const challengeTime = new Date(result.challenge_ts);
      const now = new Date();
      const ageMinutes = (now.getTime() - challengeTime.getTime()) / (1000 * 60);
      
      if (ageMinutes > 4) {
        console.warn(`Turnstile token is ${ageMinutes.toFixed(1)} minutes old`);
      }
    }

    console.log('Turnstile validation successful:', {
      hostname: result.hostname,
      action: result.action,
      challenge_ts: result.challenge_ts
    });

    return new Response(
      JSON.stringify({
        valid: true,
        hostname: result.hostname,
        action: result.action,
        challenge_ts: result.challenge_ts
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Turnstile validation error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return new Response(
          JSON.stringify({ valid: false, error: 'Verification timeout - please try again' }),
          { 
            status: 408,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return new Response(
          JSON.stringify({ valid: false, error: 'Network error - please check your connection' }),
          { 
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ valid: false, error: 'Verification service error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Get client IP address from request headers
 */
function getClientIP(request: Request): string | undefined {
  // Try various headers in order of preference
  const headers = [
    'cf-connecting-ip',     // Cloudflare
    'x-forwarded-for',      // Standard proxy header
    'x-real-ip',            // Nginx
    'x-client-ip',          // Other proxies
    'x-forwarded',          // Alternate
    'forwarded-for',        // Alternate
    'forwarded'             // RFC 7239
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // Handle comma-separated IPs (x-forwarded-for can have multiple IPs)
      const ip = value.split(',')[0].trim();
      if (ip && ip !== 'unknown') {
        return ip;
      }
    }
  }

  return undefined;
}
