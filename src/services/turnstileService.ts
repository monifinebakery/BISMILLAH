import { TurnstileResponse, TurnstileVerifyRequest } from '../types/turnstile';

// Cloudflare Turnstile API endpoint
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Validasi token Turnstile di server-side
 * @param token Token yang diterima dari client
 * @param secretKey Secret key dari Cloudflare Turnstile
 * @param remoteip IP address user (opsional)
 * @returns Promise dengan hasil validasi
 */
export const verifyTurnstileToken = async (
  token: string,
  secretKey: string,
  remoteip?: string
): Promise<TurnstileResponse> => {
  try {
    if (!token) {
      throw new Error('Token Turnstile tidak boleh kosong');
    }

    if (!secretKey) {
      throw new Error('Secret key tidak boleh kosong');
    }

    const requestBody: TurnstileVerifyRequest = {
      secret: secretKey,
      response: token
    };

    // Tambahkan IP address jika tersedia
    if (remoteip) {
      requestBody.remoteip = remoteip;
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: TurnstileResponse = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error verifying Turnstile token:', error);
    
    // Return error response
    return {
      success: false,
      'error-codes': ['internal-error']
    };
  }
};

/**
 * Validasi token Turnstile dengan pengecekan tambahan
 * @param token Token yang diterima dari client
 * @param secretKey Secret key dari Cloudflare Turnstile
 * @param remoteip IP address user (opsional)
 * @returns Promise dengan hasil validasi yang sudah diproses
 */
export const validateTurnstileToken = async (
  token: string,
  secretKey: string,
  remoteip?: string
): Promise<{
  isValid: boolean;
  message: string;
  data?: TurnstileResponse;
}> => {
  try {
    const result = await verifyTurnstileToken(token, secretKey, remoteip);
    
    if (result.success) {
      return {
        isValid: true,
        message: 'Token valid',
        data: result
      };
    } else {
      // Handle specific error codes
      const errorCodes = result['error-codes'] || [];
      let message = 'Token tidak valid';
      
      if (errorCodes.includes('missing-input-secret')) {
        message = 'Secret key tidak ditemukan';
      } else if (errorCodes.includes('invalid-input-secret')) {
        message = 'Secret key tidak valid';
      } else if (errorCodes.includes('missing-input-response')) {
        message = 'Token response tidak ditemukan';
      } else if (errorCodes.includes('invalid-input-response')) {
        message = 'Token response tidak valid';
      } else if (errorCodes.includes('timeout-or-duplicate')) {
        message = 'Token sudah kedaluwarsa atau sudah digunakan';
      } else if (errorCodes.includes('internal-error')) {
        message = 'Terjadi kesalahan internal';
      }
      
      return {
        isValid: false,
        message,
        data: result
      };
    }
  } catch (error) {
    console.error('Error validating Turnstile token:', error);
    return {
      isValid: false,
      message: 'Terjadi kesalahan saat validasi token'
    };
  }
};

/**
 * Middleware untuk Express.js (jika menggunakan Node.js backend)
 * @param secretKey Secret key dari environment variable
 */
export const createTurnstileMiddleware = (secretKey: string) => {
  return async (req: any, res: any, next: any) => {
    try {
      const token = req.body.turnstileToken || req.headers['x-turnstile-token'];
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token Turnstile diperlukan'
        });
      }

      const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
      const validation = await validateTurnstileToken(token, secretKey, clientIP);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }
      
      // Attach validation result to request object
      req.turnstileValidation = validation;
      next();
    } catch (error) {
      console.error('Turnstile middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat validasi CAPTCHA'
      });
    }
  };
};

/**
 * Utility untuk mendapatkan environment variables
 */
export const getTurnstileConfig = () => {
  const sitekey = process.env.VITE_TURNSTILE_SITEKEY || process.env.TURNSTILE_SITEKEY;
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  if (!sitekey) {
    console.warn('Turnstile sitekey tidak ditemukan di environment variables');
  }
  
  if (!secretKey) {
    console.warn('Turnstile secret key tidak ditemukan di environment variables');
  }
  
  return {
    sitekey,
    secretKey
  };
};

export default {
  verifyTurnstileToken,
  validateTurnstileToken,
  createTurnstileMiddleware,
  getTurnstileConfig
};