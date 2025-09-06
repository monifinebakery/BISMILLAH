// src/utils/mockTurnstileApi.ts
// Mock Turnstile API for development mode

export const mockTurnstileValidation = async (token: string): Promise<{valid: boolean, error?: string}> => {
  console.log('🧪 [MOCK] Turnstile validation called with token:', token ? 'RECEIVED' : 'EMPTY');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock validation logic
  if (!token) {
    return { valid: false, error: 'Missing token' };
  }
  
  if (token === 'fail') {
    return { valid: false, error: 'Invalid token' };
  }
  
  // Mock successful validation
  console.log('✅ [MOCK] Turnstile validation successful');
  return { valid: true };
};

// Check if we're in development mode
export const isDevelopmentMode = () => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
};

// Cloudflare testing sitekeys (as per official docs)
export const TURNSTILE_TEST_SITEKEYS = {
  // Always passes
  ALWAYS_PASSES: '1x00000000000000000000AA',
  // Always fails
  ALWAYS_FAILS: '2x00000000000000000000AB',
  // Always challenges
  ALWAYS_CHALLENGES: '3x00000000000000000000FF'
} as const;

// Check if using test sitekey
export const isTestingSitekey = (sitekey: string): boolean => {
  return Object.values(TURNSTILE_TEST_SITEKEYS).includes(sitekey as any);
};

// Get test behavior from sitekey
export const getTestBehavior = (sitekey: string): 'pass' | 'fail' | 'challenge' | 'unknown' => {
  switch (sitekey) {
    case TURNSTILE_TEST_SITEKEYS.ALWAYS_PASSES:
      return 'pass';
    case TURNSTILE_TEST_SITEKEYS.ALWAYS_FAILS:
      return 'fail';
    case TURNSTILE_TEST_SITEKEYS.ALWAYS_CHALLENGES:
      return 'challenge';
    default:
      return 'unknown';
  }
};
