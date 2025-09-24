#!/usr/bin/env node

// Script untuk check data bahan_baku di database Supabase
// Jalankan dengan: node check-bahan-baku-data.cjs

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

async function checkBahanBakuData() {
  try {
    console.log('🔍 Checking bahan_baku table data...\n');

    // Get all data first
    const { data, error } = await supabase
      .from('bahan_baku')
      .select('id, nama, user_id, stok, satuan, minimum, harga_satuan, kategori, created_at')
      .limit(20);

    if (error) {
      console.error('❌ Query error:', error);
      console.log('💡 Possible issues:');
      console.log('   - RLS (Row Level Security) blocking access');
      console.log('   - Table doesn\'t exist');
      console.log('   - Authentication issues');
      return;
    }

    console.log(`📊 Found ${data?.length || 0} records in bahan_baku table\n`);

    if (!data || data.length === 0) {
      console.log('⚠️  No data found in bahan_baku table');
      console.log('💡 This explains why chatbot returns "empty result set"');
      console.log('\n🔧 Solutions:');
      console.log('1. Add sample data to bahan_baku table');
      console.log('2. Check RLS policies');
      console.log('3. Verify table exists in database');
      return;
    }

    // Show sample data
    console.log('📋 Sample data:');
    data.slice(0, 5).forEach((item, index) => {
      console.log(`${index + 1}. ${item.nama} (User: ${item.user_id}) - Stok: ${item.stok} ${item.satuan}`);
    });

    // Check specific user ID from the error
    const targetUserId = '23f1793f-070f-47b3-b5e9-71e28f50070b';
    console.log(`\n🔍 Checking data for user ID: ${targetUserId}`);

    const userRecords = data.filter(item => item.user_id === targetUserId);
    console.log(`📊 Found ${userRecords.length} records for this user:`);

    if (userRecords.length > 0) {
      userRecords.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.nama} - ${item.stok} ${item.satuan}`);
      });
    } else {
      console.log('  ❌ No records found for this user ID');
      console.log('  💡 This is why chatbot shows "empty result set"');

      // Check what user IDs exist
      const uniqueUserIds = [...new Set(data.map(item => item.user_id))];
      console.log(`\n👥 Existing user IDs in database: ${uniqueUserIds.join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkBahanBakuData();
