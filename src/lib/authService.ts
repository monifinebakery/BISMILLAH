import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

// --- Session Cache ---
let sessionCache: Session | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30_000; // ms

// Get current session (with caching)
export async function getCurrentSession(): Promise<Session | null> {
  const now = Date.now();
  if (sessionCache && now - cacheTimestamp < CACHE_DURATION) {
    return sessionCache;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    sessionCache = null;
    return null;
  }

  sessionCache = data.session;
  cacheTimestamp = now;
  return sessionCache;
}

// Get current authenticated user
export async function getCurrentUser() {
  return (await getCurrentSession())?.user || null;
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  return !!(await getCurrentSession())?.user;
}

// Sign out user and clear cache
export async function signOut(): Promise<boolean> {
  const { error } = await supabase.auth.signOut();
  sessionCache = null;
  if (error) {
    toast.error('Logout gagal');
    return false;
  }
  toast.success('Logout berhasil');
  return true;
}

// --- OTP Authentication ---
// Send OTP to email
export async function sendEmailOtp(
  email: string,
  captchaToken: string | null = null,
  allowSignup = true,
  skipCaptcha = false
): Promise<boolean> {
  const options: any = { shouldCreateUser: allowSignup };
  if (!skipCaptcha && captchaToken) options.captchaToken = captchaToken;

  const { error } = await supabase.auth.signInWithOtp({ email, options });
  if (error) {
    toast.error(error.message);
    return false;
  }
  return true;
}

// Verify OTP code
export async function verifyEmailOtp(
  email: string,
  token: string
): Promise<boolean | 'expired' | 'rate_limited'> {
  const cleanToken = token.replace(/[^0-9A-Za-z]/g, '').toUpperCase().slice(0, 6);
  const { data, error } = await supabase.auth.verifyOtp({ email, token: cleanToken, type: 'email' });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('expired')) return 'expired';
    if (msg.includes('too many')) return 'rate_limited';
    return false;
  }
  sessionCache = null;
  return !!data.session;
}

// --- Unlinked Order Suggestions ---
// Fetch recent unlinked orders for current user
export async function getRecentUnlinkedOrders(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_payments')
    .select('order_id')
    .is('user_id', null)
    .eq('is_paid', true)
    .eq('payment_status', 'settled')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error || !data) return [];
  return data.map(r => r.order_id);
}

// --- Payment Status ---
export async function getUserPaymentStatus(): Promise<{ isPaid: boolean; paymentRecord: any | null; needsLinking: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { isPaid: false, paymentRecord: null, needsLinking: false };

  const { data, error } = await supabase
    .from('user_payments')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_paid', true)
    .eq('payment_status', 'settled')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) return { isPaid: false, paymentRecord: null, needsLinking: true };
  const record = data?.[0] || null;
  return { isPaid: !!record, paymentRecord: record, needsLinking: !record };
}

// Check existence of an order by ID
export async function verifyOrderExists(orderId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_payments')
    .select('is_paid, payment_status')
    .eq('order_id', orderId)
    .limit(5);

  if (error || !data?.length) return false;
  return data.some(p =>
    (p.is_paid === true || p.is_paid === 'true') &&
    ['settled', 'success'].includes((p.payment_status || '').toLowerCase())
  );
}

// Link a valid payment to the user account
export async function linkPaymentToUser(orderId: string, user: any): Promise<any> {
  const { data: existing } = await supabase
    .from('user_payments')
    .select('*')
    .eq('order_id', orderId)
    .eq('user_id', user.id)
    .limit(1);

  if (existing?.length) return existing[0];

  const { data: payments } = await supabase
    .from('user_payments')
    .select('*')
    .eq('order_id', orderId)
    .limit(10);

  const valid = payments?.find(p =>
    (p.is_paid === true || p.is_paid === 'true') &&
    ['settled', 'success'].includes((p.payment_status || '').toLowerCase())
  );

  if (!valid) throw new Error('Order belum dibayar atau belum settled');
  if (valid.user_id && valid.user_id !== user.id) throw new Error('Order sudah terhubung ke akun lain');
  if (!valid.user_id && valid.email && valid.email !== user.email) throw new Error(`Order terdaftar dengan email lain: ${valid.email}`);

  const { data: updated, error } = await supabase
    .from('user_payments')
    .update({ user_id: user.id, email: user.email })
    .eq('id', valid.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return updated;
}

// Robust customer order verification via RPC
export async function verifyCustomerOrder(
  email: string,
  orderId: string
): Promise<{ success: boolean; message: string; data?: any }> {
  if (!email || !orderId) return { success: false, message: 'Email dan Order ID wajib diisi' };

  const { data: existing } = await supabase
    .from('user_payments')
    .select('*')
    .eq('order_id', orderId)
    .eq('email', email)
    .limit(1);

  if (existing?.[0]?.is_paid && existing[0].payment_status === 'settled') {
    return { success: true, message: 'Order sudah terhubung', data: existing[0] };
  }

  const { data, error } = await supabase.rpc('verify_payment_robust', { p_email: email, p_order_id: orderId });
  if (error) return { success: false, message: error.message };
  return data || { success: false, message: 'Tidak ada respons dari server' };
}
