#!/usr/bin/env node

/**
 * Fix for pemakaian_bahan_daily_mv materialized view issue
 * Error: relation "public.pemakaian_bahan_daily_mv" does not exist
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
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkMaterializedView() {
  console.log('🔍 Checking materialized view status...\n');
  
  try {
    // Try to query the materialized view directly
    const { data: countData, error: countError } = await supabase
      .from('pemakaian_bahan_daily_mv')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Error querying materialized view:', countError.message);
      console.log('🔧 This usually means the view exists but has no data, refreshing...');
      await refreshMaterializedView();
      return true;
    }

    const count = countData?.length || 0;
    console.log('📊 Materialized view exists: ✅ Yes');
    console.log('📈 Records in materialized view:', count);

    if (count === 0) {
      console.log('🔄 Materialized view is empty, refreshing...');
      await refreshMaterializedView();
    } else {
      console.log('✅ Materialized view is working correctly!');
    }

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.log('🔧 Trying to refresh the materialized view...');
    await refreshMaterializedView();
    return false;
  }
}

async function refreshMaterializedView() {
  try {
    console.log('🔄 Refreshing materialized view...');
    
    const { error } = await supabase.rpc('refresh_pemakaian_daily_mv');
    
    if (error) {
      console.error('❌ Error refreshing materialized view:', error);
      console.log('🔧 Trying to recreate the materialized view...');
      await createMaterializedView();
      return;
    }
    
    console.log('✅ Successfully refreshed materialized view');
    
    // Verify it worked
    const { data, error: verifyError } = await supabase
      .from('pemakaian_bahan_daily_mv')
      .select('*', { count: 'exact', head: true });
      
    if (!verifyError) {
      console.log(`📊 Materialized view now contains ${data?.length || 0} records`);
    }
    
  } catch (error) {
    console.error('❌ Error in refresh process:', error);
    await createMaterializedView();
  }
}

async function createMaterializedView() {
  console.log('🔧 Cannot create materialized view programmatically.');
  console.log('📝 Please run the SQL script manually in your Supabase SQL editor:');
  console.log('📄 File: fix-materialized-view.sql');
  console.log('');
  console.log('🔗 Supabase SQL Editor: https://supabase.com/dashboard/project/[your-project]/sql');
}

async function checkBaseTables() {
  console.log('🔍 Checking base tables...\n');
  
  try {
    // Check pemakaian_bahan table
    const { data: pemakainData, error: pemakaianError } = await supabase
      .from('pemakaian_bahan')
      .select('*', { count: 'exact', head: true });
      
    if (pemakaianError) {
      console.error('❌ Error accessing pemakaian_bahan table:', pemakaianError);
      return false;
    }
    
    console.log('📋 pemakaian_bahan table:', `${pemakainData?.length || 0} records`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error checking base tables:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting materialized view diagnostic and fix...\n');
  
  // Check base tables first
  const baseTablesOk = await checkBaseTables();
  
  if (!baseTablesOk) {
    console.log('❌ Base tables have issues, cannot proceed');
    return;
  }
  
  console.log('');
  
  // Check and fix materialized view
  const mvOk = await checkMaterializedView();
  
  if (mvOk) {
    console.log('\n✅ Materialized view fix completed successfully!');
    console.log('🎉 Your profit analysis should work now.');
  } else {
    console.log('\n❌ Could not fix materialized view issue');
    console.log('📝 Please check your Supabase logs for more details');
  }
}

main().catch(console.error);
