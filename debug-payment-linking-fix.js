// Debug script untuk menganalisis dan fix masalah payment linking
// Error: 250901EYIRBGB - "Tidak ada baris yang diperbaharui"
// Jalankan dengan: node debug-payment-linking-fix.js

console.log('🔍 DEBUG PAYMENT LINKING ISSUE - Error Code: 250901EYIRBGB');
console.log('═══════════════════════════════════════════════════════════════');

console.log('\n📋 ANALISIS PENYEBAB MASALAH:');
console.log('1. 🔧 UUID SANITIZATION ISSUE');
console.log('   - User ID mungkin berupa string "null" bukan actual null');
console.log('   - UUID validation gagal karena format tidak valid');
console.log('   - AuthContext memberikan user.id = "null" sebagai string');

console.log('\n2. 🔐 RLS POLICY ISSUE');
console.log('   - Row Level Security mungkin memblokir update');
console.log('   - User tidak memiliki permission untuk update tabel user_payments');
console.log('   - Policy tidak mengenali user yang sedang login');

console.log('\n3. 🏁 RACE CONDITION');
console.log('   - Payment sudah di-link oleh proses lain saat auto-link berjalan');
console.log('   - Multiple tab/window mencoba link payment yang sama');
console.log('   - Real-time subscription conflict');

console.log('\n4. 📧 EMAIL MISMATCH');
console.log('   - Email di payment record tidak match dengan user email');
console.log('   - Case sensitivity issue (user@domain.com vs USER@DOMAIN.COM)');
console.log('   - Webhook email auto-generated tidak sesuai');

console.log('\n5. ⚡ CONSTRAINT VIOLATION');
console.log('   - Unique constraint user_payments_email_user_unique');
console.log('   - User sudah memiliki payment lain yang linked');
console.log('   - Database constraint mencegah multiple payments per user');

console.log('\n💡 LANGKAH DEBUGGING:');
console.log('1. Cek user.id di browser console: __DEBUG_AUTH_USER__.id');
console.log('2. Cek apakah user.id === "null" (string) bukan null (value)');
console.log('3. Cek di Supabase Dashboard → user_payments untuk data yang bermasalah');
console.log('4. Cek RLS policies di tabel user_payments');
console.log('5. Cek constraint violations di database logs');

console.log('\n🔧 SOLUSI YANG PERLU DITERAPKAN:');

console.log('\n1. UUID SANITIZATION FIX:');
console.log('   ✅ Sudah ada di sanitizeUserId() function');
console.log('   ✅ Sudah ada di AuthContext untuk validasi user.id');
console.log('   ❌ Perlu ditambahkan error handling yang lebih baik');

console.log('\n2. AUTO-LINKING IMPROVEMENTS:');
console.log('   ✅ Sudah ada pre-update check di AutoLinkingPopup');
console.log('   ✅ Sudah ada safety condition .is("user_id", null)');
console.log('   ❌ Perlu tambahan validation sebelum update');

console.log('\n3. PAYMENT CONTEXT FIXES:');
console.log('   ✅ Hook order sudah diperbaiki');
console.log('   ✅ User validation sudah ada');
console.log('   ❌ Perlu better error reporting ke user');

console.log('\n4. DATABASE CONSTRAINT HANDLING:');
console.log('   ✅ Error code 23505 sudah di-handle');
console.log('   ❌ Perlu specific handling untuk "no rows updated" case');

console.log('\n📝 IMMEDIATE FIXES NEEDED:');

// Fix 1: Enhanced error reporting
console.log('\n🔧 FIX 1: Enhanced Error Reporting');
console.log(`
// Di AutoLinkingPopup.tsx, line 305 area
if (!data || data.length === 0) {
  // ✅ ENHANCED: Better debugging for "no rows updated"
  const { data: recheckData } = await supabaseClient
    .from('user_payments')
    .select('id, user_id, order_id, email, payment_status, is_paid, updated_at')
    .eq('order_id', payment.order_id);

  const detailedError = {
    order_id: payment.order_id,
    attempted_user_id: sanitizedUserId,
    current_data: recheckData?.[0],
    conditions_checked: {
      order_exists: !!recheckData?.[0],
      is_paid: recheckData?.[0]?.is_paid,
      payment_status: recheckData?.[0]?.payment_status,
      current_user_id: recheckData?.[0]?.user_id,
      was_already_linked: recheckData?.[0]?.user_id !== null
    }
  };
  
  console.error('🚨 DEBUG 250901: No rows updated details:', detailedError);
  
  if (recheckData?.[0]?.user_id !== null) {
    throw new Error(\`Payment already linked to user: \${recheckData[0].user_id}\`);
  } else {
    throw new Error(\`No rows updated - Order: \${payment.order_id} | User: \${sanitizedUserId} | Details: \${JSON.stringify(detailedError)}\`);
  }
}
`);

// Fix 2: Better user ID validation
console.log('\n🔧 FIX 2: Better User ID Validation');
console.log(`
// Di handleAutoLinkPayments function, sebelum loop
const validateUserForLinking = async (user) => {
  if (!user || !user.id || !user.email) {
    throw new Error('User data incomplete');
  }
  
  if (user.id === 'null' || user.id === 'undefined') {
    throw new Error('User ID is string null - session corrupted');
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(user.id)) {
    throw new Error('Invalid UUID format in user ID');
  }
  
  // Check if user exists in auth.users
  const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !authUser || authUser.id !== user.id) {
    throw new Error('User session mismatch with auth system');
  }
  
  return true;
};

// Use before linking
await validateUserForLinking(currentUser);
`);

// Fix 3: Database query improvements
console.log('\n🔧 FIX 3: Database Query Improvements');
console.log(`
// Enhanced update query dengan lebih banyak debugging
const updateResult = await supabaseClient
  .from('user_payments')
  .update(updateData)
  .eq('order_id', payment.order_id)
  .is('user_id', null) // Safety: only update unlinked
  .eq('is_paid', true) // Additional safety
  .eq('payment_status', 'settled') // Additional safety
  .select('*'); // Get full record back

// Also add count check
const { count } = await supabaseClient
  .from('user_payments')
  .select('*', { count: 'exact', head: true })
  .eq('order_id', payment.order_id)
  .is('user_id', null)
  .eq('is_paid', true)
  .eq('payment_status', 'settled');

console.log('Update query matched rows:', count);
`);

// Fix 4: RLS Policy Check
console.log('\n🔧 FIX 4: RLS Policy Verification');
console.log(`
-- SQL untuk cek RLS policies di Supabase
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'user_payments'
  AND cmd = 'UPDATE';

-- Jika RLS policy bermasalah, bisa jadi policy tidak mengizinkan
-- user untuk update row yang user_id-nya null
`);

console.log('\n🎯 LANGKAH TESTING:');
console.log('1. Buka browser console di halaman dengan error');
console.log('2. Check: console.log(__DEBUG_AUTH_USER__)');
console.log('3. Verify: typeof __DEBUG_AUTH_USER__.id !== "string" || __DEBUG_AUTH_USER__.id !== "null"');
console.log('4. Test auto-link dengan satu payment saja');
console.log('5. Check Supabase logs untuk detailed error');

console.log('\n🚀 IMPLEMENTASI:');
console.log('1. Update AutoLinkingPopup.tsx dengan enhanced error reporting');
console.log('2. Update PaymentContext.tsx dengan better user validation');
console.log('3. Update useUnlinkedPayments.ts dengan stricter filtering');
console.log('4. Check dan fix RLS policies jika diperlukan');
console.log('5. Add comprehensive logging untuk debugging');

console.log('\n📊 MONITORING:');
console.log('- Monitor error code 250901 di logs');
console.log('- Track successful vs failed auto-link attempts');
console.log('- Monitor RLS policy violations');
console.log('- Track UUID validation failures');

console.log('\n✅ NEXT STEPS:');
console.log('1. Implementasikan enhanced error reporting');
console.log('2. Test dengan user yang bermasalah');
console.log('3. Verify fix mengatasi root cause');
console.log('4. Deploy dan monitor hasilnya');

console.log('\n🏁 Script debugging selesai. Implementasikan fixes di atas untuk mengatasi error 250901EYIRBGB.');
