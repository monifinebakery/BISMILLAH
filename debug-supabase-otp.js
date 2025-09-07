#!/usr/bin/env node

// Debug script untuk Supabase OTP issues
console.log('🔧 Supabase OTP Debug Script');
console.log('=' .repeat(50));

// Environment check
console.log('\n📋 Environment Variables:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT_SET');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET');

console.log('\n🚨 Common 500 Error Causes:');
console.log('1. Supabase Project > Auth > Settings:');
console.log('   - "Enable email confirmations" should be DISABLED for OTP');
console.log('   - "Enable CAPTCHA protection" should be DISABLED');
console.log('   - Check if "Allow signups" is enabled');

console.log('\n2. Supabase Project > Auth > Rate Limiting:');
console.log('   - Check if you hit the OTP send limit');
console.log('   - Default: 60 emails per hour');

console.log('\n3. Email Provider Settings:');
console.log('   - Check if SMTP is configured correctly');
console.log('   - Use Supabase built-in email for testing');

console.log('\n🔧 Recommended Fixes:');
console.log('1. Go to Supabase Dashboard > Authentication > Settings');
console.log('2. Disable "Enable CAPTCHA protection"');
console.log('3. Set "Email template" to use built-in template');
console.log('4. Check "Auth > Users" to see if users are created');

console.log('\n💡 Test with curl:');
const testCurl = `curl -X POST 'https://kewhzkfvswbimmwtpymw.supabase.co/auth/v1/otp' \\
  -H 'Content-Type: application/json' \\
  -H 'apikey: YOUR_ANON_KEY' \\
  -d '{
    "email": "test@example.com",
    "options": {
      "shouldCreateUser": true
    }
  }'`;

console.log(testCurl);
console.log('\nReplace YOUR_ANON_KEY with your actual anon key from .env');
