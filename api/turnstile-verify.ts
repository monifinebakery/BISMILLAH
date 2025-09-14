// Serverless function for validating Cloudflare Turnstile token (Vercel)
import type { VercelRequest, VercelResponse } from '@vercel/node';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { token, remoteip } = req.body || {};

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Missing Turnstile token' });
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      console.warn('[turnstile-verify] Missing TURNSTILE_SECRET_KEY env');
      return res.status(500).json({ success: false, message: 'Server misconfiguration' });
    }

    const form = new URLSearchParams();
    form.append('secret', secret);
    form.append('response', token);
    if (remoteip && typeof remoteip === 'string') {
      form.append('remoteip', remoteip);
    }

    const cfRes = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    if (!cfRes.ok) {
      const text = await cfRes.text();
      console.error('[turnstile-verify] HTTP error from CF:', cfRes.status, text);
      return res.status(502).json({ success: false, message: 'Verification upstream error' });
    }

    const result = await cfRes.json();
    const success = !!result?.success;

    if (!success) {
      return res.status(400).json({ success: false, message: 'Invalid token', data: result });
    }

    return res.status(200).json({ success: true, message: 'Token valid', data: result });
  } catch (err: any) {
    console.error('[turnstile-verify] Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

