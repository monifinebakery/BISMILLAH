#!/usr/bin/env node

// Script untuk check RLS policies dan authentication issues
// Jalankan dengan: node debug-rls-policies.cjs

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
let SUPABASE_URL = process.env.VITE_SUPABASE_URL;
let SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// If not in environment, try to read from .env files
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const envFiles = ['.env', '.env.development', '.env.local'];

  for (const envFile of envFiles) {
    try {
      const envPath = path.join(__dirname, envFile);
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');

        envContent.split('\n').forEach(line => {
          if (line.trim() && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=').trim();

            if (key === 'VITE_SUPABASE_URL') SUPABASE_URL = value.replace(/['"]/g, '');
            if (key === 'VITE_SUPABASE_ANON_KEY') SUPABASE_ANON_KEY = value.replace(/['"]/g, '');
          }
        });

        if (SUPABASE_URL && SUPABASE_ANON_KEY) break;
      }
    } catch (error) {
      // Continue to next file
    }
  }
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔧 Supabase Config:');
console.log('   URL:', SUPABASE_URL ? '✅ Set' : '❌ Not set');
console.log('   Key:', SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set');
console.log();

async function debugRLSPolicies() {
  try {
    console.log('🔍 Debugging RLS policies and data access...\n');

    // Test 1: Check if we can access the table at all
    console.log('📋 Test 1: Basic table access');
    const { data: basicData, error: basicError } = await supabase
      .from('bahan_baku')
      .select('count', { count: 'exact', head: true });

    if (basicError) {
      console.log('❌ Basic access failed:', basicError.message);
      console.log('💡 This suggests RLS is blocking anonymous access');
    } else {
      console.log('✅ Basic access works, count:', basicData);
    }

    // Test 2: Try to get any data without filters
    console.log('\n📋 Test 2: Get any data (no user filter)');
    const { data: anyData, error: anyError } = await supabase
      .from('bahan_baku')
      .select('id, nama, user_id')
      .limit(5);

    if (anyError) {
      console.log('❌ Any data access failed:', anyError.message);
    } else {
      console.log('✅ Found records:', anyData?.length || 0);
      if (anyData && anyData.length > 0) {
        console.log('   Sample data:');
        anyData.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.nama} (User: ${item.user_id})`);
        });
      }
    }

    // Test 3: Try with specific user_id
    console.log('\n📋 Test 3: Filter by specific user_id');
    const targetUserId = '23f1793f-070f-47b3-b5e9-71e28f50070b';
    const { data: userData, error: userError } = await supabase
      .from('bahan_baku')
      .select('id, nama, user_id, stok, satuan')
      .eq('user_id', targetUserId)
      .limit(5);

    if (userError) {
      console.log('❌ User-filtered access failed:', userError.message);
    } else {
      console.log('✅ User-filtered records:', userData?.length || 0);
      if (userData && userData.length > 0) {
        console.log('   User data:');
        userData.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.nama} - ${item.stok} ${item.satuan}`);
        });
      }
    }

    // Test 4: Check auth state
    console.log('\n📋 Test 4: Check authentication state');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Auth check failed:', authError.message);
    } else {
      console.log('👤 Current user:', user ? user.id : 'Anonymous');
    }

    // Test 5: Try with service role (if available)
    console.log('\n📋 Test 5: Recommendations');
    console.log('💡 Possible solutions:');
    console.log('   1. RLS policies might require authenticated user');
    console.log('   2. Chatbot function should use service_role key');
    console.log('   3. Or RLS policies need to allow anon access');
    console.log('   4. Check if data exists in different environment');

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

debugRLSPolicies();
