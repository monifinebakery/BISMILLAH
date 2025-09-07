#!/usr/bin/env node

/**
 * Quick refresh for pemakaian_bahan_daily_mv materialized view
 * Uses the anon key (should work if RLS allows it)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables manually
function loadEnvFile(path) {
  try {
    const content = readFileSync(path, 'utf8');
    const lines = content.split('\n');
    const env = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        env[key] = value;
      }
    }
    
    return env;
  } catch (error) {
    console.warn('Could not load .env.local file:', error.message);
    return {};
  }
}

const env = loadEnvFile('.env.local');

const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('- VITE_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function refreshMaterializedView() {
  console.log('🔄 Attempting to refresh materialized view...\n');
  
  try {
    // Try calling the refresh function
    const { data, error } = await supabase.rpc('refresh_pemakaian_daily_mv');
    
    if (error) {
      console.error('❌ Error calling refresh function:', error.message);
      console.log('\n📝 This could be due to:');
      console.log('1. RLS (Row Level Security) restrictions');
      console.log('2. Missing materialized view');
      console.log('3. Insufficient permissions');
      console.log('\n🔧 Please run the SQL script manually in Supabase Dashboard:');
      console.log('📄 File: fix-materialized-view.sql');
      console.log('🔗 URL: https://supabase.com/dashboard/project/kewhzkfvswbimmwtpymw/sql');
      return false;
    }
    
    console.log('✅ Successfully called refresh function');
    
    // Try to verify by querying the materialized view
    const { data: testData, error: testError } = await supabase
      .from('pemakaian_bahan_daily_mv')
      .select('*', { count: 'exact', head: true });
      
    if (testError) {
      console.log('⚠️  Refresh function succeeded but view still not accessible:', testError.message);
      console.log('🔧 Please run the SQL script manually in Supabase Dashboard');
      return false;
    }
    
    console.log(`📊 Materialized view now accessible with ${testData?.length || 0} records`);
    console.log('🎉 Success! Your profit analysis should work now.');
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.log('\n🔧 Please run the SQL script manually in Supabase Dashboard:');
    console.log('📄 File: fix-materialized-view.sql');
    console.log('🔗 URL: https://supabase.com/dashboard/project/kewhzkfvswbimmwtpymw/sql');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Quick materialized view refresh...\n');
  
  const success = await refreshMaterializedView();
  
  if (!success) {
    console.log('\n❌ Automatic refresh failed');
    console.log('📋 Manual steps:');
    console.log('1. Go to: https://supabase.com/dashboard/project/kewhzkfvswbimmwtpymw/sql');
    console.log('2. Copy and paste the content of fix-materialized-view.sql');
    console.log('3. Click "Run" to execute the SQL');
    console.log('4. This will fix the materialized view issue');
  }
}

main().catch(console.error);
