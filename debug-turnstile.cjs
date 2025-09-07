#!/usr/bin/env node

// Debug script untuk cek konfigurasi Turnstile
console.log('🔍 Checking Turnstile Configuration...\n');

const fs = require('fs');

console.log('📁 Environment Files Check:');
['.env', '.env.development', '.env.production'].forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
    const content = fs.readFileSync(file, 'utf8');
    const sitekeyLine = content.split('\n').find(line => line.startsWith('VITE_TURNSTILE_SITEKEY='));
    if (sitekeyLine) {
      const sitekey = sitekeyLine.split('=')[1];
      console.log(`   Sitekey: "${sitekey}" (length: ${sitekey.length})`);
      console.log(`   JSON: ${JSON.stringify(sitekey)}`);
      
      // Check for hidden characters
      const cleaned = sitekey.replace(/\s+/g, '').trim();
      if (cleaned !== sitekey) {
        console.log(`   ⚠️  Contains whitespace/newlines!`);
        console.log(`   Cleaned: "${cleaned}" (length: ${cleaned.length})`);
      } else {
        console.log(`   ✅ Clean sitekey`);
      }
    } else {
      console.log(`   ❌ No VITE_TURNSTILE_SITEKEY found`);
    }
  } else {
    console.log(`❌ ${file} not found`);
  }
});

console.log('\n🧪 Vite Environment Variables:');
console.log('VITE_TURNSTILE_SITEKEY:', process.env.VITE_TURNSTILE_SITEKEY);
console.log('Length:', process.env.VITE_TURNSTILE_SITEKEY?.length || 0);

console.log('\n📋 Expected Sitekey Format:');
console.log('- Should start with "0x4AAAAAAB"');
console.log('- Should be around 24-50 characters');
console.log('- Should not contain spaces or newlines');

const expectedSitekey = '0x4AAAAAABvpDKhb8eM31rVE';
console.log(`\n✅ Your sitekey from screenshot: "${expectedSitekey}"`);
console.log(`Length: ${expectedSitekey.length}`);

console.log('\n🌐 Testing Turnstile API availability...');
const https = require('https');
https.get('https://challenges.cloudflare.com/turnstile/v0/api.js', (res) => {
  console.log('✅ Turnstile API accessible');
  console.log('Status:', res.statusCode);
}).on('error', (err) => {
  console.log('❌ Error accessing Turnstile API:', err.message);
});
