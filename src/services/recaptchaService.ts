import { RecaptchaResponse, RecaptchaVerifyRequest } from '../types/recaptcha';

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Verifikasi token reCAPTCHA di server-side
 * @param token Token reCAPTCHA dari klien
 * @param secretKey Secret key dari Google reCAPTCHA
 * @param remoteip Optional IP address pengguna
 */
export const verifyRecaptchaToken = async (
  token: string,
  secretKey: string,
  remoteip?: string
): Promise<RecaptchaResponse> => {
  if (!token) {
    throw new Error('Token reCAPTCHA tidak boleh kosong');
  }

  const body: RecaptchaVerifyRequest = {
    secret: secretKey,
    response: token,
  };
  if (remoteip) body.remoteip = remoteip;

  const response = await fetch(RECAPTCHA_VERIFY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body as Record<string, string>).toString(),
  });

  if (!response.ok) {
    throw new Error(`reCAPTCHA verification failed with status ${response.status}`);
  }

  const result: RecaptchaResponse = await response.json();
  return result;
};

/**
 * Express middleware untuk memvalidasi reCAPTCHA
 */
export const createRecaptchaMiddleware = (secretKey: string) => {
  return async (req: any, res: any, next: any) => {
    try {
      const token = req.body.recaptchaToken || req.headers['x-recaptcha-token'];
      if (!token) {
        return res.status(400).json({ success: false, message: 'Token reCAPTCHA diperlukan' });
      }
      const clientIP = req.headers['cf-connecting-ip'] || req.ip;
      const validation = await verifyRecaptchaToken(token, secretKey, clientIP);
      req.recaptchaValidation = validation;
      next();
    } catch (error) {
      console.error('reCAPTCHA middleware error:', error);
      return res.status(500).json({ success: false, message: 'reCAPTCHA validation failed' });
    }
  };
};

/**
 * Mendapatkan konfigurasi reCAPTCHA dari environment variables
 */
export const getRecaptchaConfig = () => {
  const sitekey = process.env.VITE_RECAPTCHA_SITEKEY || process.env.RECAPTCHA_SITEKEY;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!sitekey) console.warn('reCAPTCHA sitekey tidak ditemukan di environment variables');
  if (!secretKey) console.warn('reCAPTCHA secret key tidak ditemukan di environment variables');
  return { sitekey, secretKey };
};

export default {
  verifyRecaptchaToken,
  createRecaptchaMiddleware,
  getRecaptchaConfig,
};
