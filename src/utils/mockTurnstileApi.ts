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
