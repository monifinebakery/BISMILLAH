// supabase/functions/_shared/cors.ts
// Centralized CORS helpers for Supabase Edge Functions

export const ALLOWED_ORIGINS = new Set<string>([
  'https://dev3--gleaming-peony-f4a091.netlify.app',
  'https://kalkulator.monifine.my.id',
  'http://localhost:8080', // optional for local dev
]);

export const getCorsHeaders = (origin?: string) => {
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : '';
  return {
'Access-Control-Allow-Origin': allowOrigin || 'https://kalkulator.monifine.my.id',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  } as Record<string, string>;
};

export const handleOptions = (req: Request) => {
  const origin = req.headers.get('origin') || '';
  return new Response('ok', { headers: getCorsHeaders(origin) });
};
