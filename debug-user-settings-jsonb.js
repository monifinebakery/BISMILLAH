#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import process from 'process';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserSettingsJsonbFields() {
  console.log('🔍 Checking user_settings JSONB fields for invalid data...\n');

  try {
    // Get all user settings
    const { data: allSettings, error } = await supabase
      .from('user_settings')
      .select('*');

    if (error) {
      console.error('❌ Error fetching user settings:', error);
      return;
    }

    if (!allSettings || allSettings.length === 0) {
      console.log('ℹ️  No user settings found');
      return;
    }

    console.log(`📊 Found ${allSettings.length} user settings records\n`);

    let problemsFound = 0;

    allSettings.forEach((setting, index) => {
      console.log(`\n--- Record ${index + 1} (user_id: ${setting.user_id}) ---`);
      
      // Check notifications field
      console.log('📧 Notifications:', typeof setting.notifications, setting.notifications);
      if (typeof setting.notifications === 'boolean') {
        console.log('⚠️  PROBLEM: notifications is boolean, should be object');
        problemsFound++;
      } else if (setting.notifications === null) {
        console.log('⚠️  PROBLEM: notifications is null, should be object');
        problemsFound++;
      }

      // Check backup_settings field
      console.log('💾 Backup Settings:', typeof setting.backup_settings, setting.backup_settings);
      if (typeof setting.backup_settings === 'boolean') {
        console.log('⚠️  PROBLEM: backup_settings is boolean, should be object');
        problemsFound++;
      } else if (setting.backup_settings === null) {
        console.log('⚠️  PROBLEM: backup_settings is null, should be object');
        problemsFound++;
      }

      // Check security_settings field
      console.log('🔒 Security Settings:', typeof setting.security_settings, setting.security_settings);
      if (typeof setting.security_settings === 'boolean') {
        console.log('⚠️  PROBLEM: security_settings is boolean, should be object');
        problemsFound++;
      } else if (setting.security_settings === null) {
        console.log('⚠️  PROBLEM: security_settings is null, should be object');
        problemsFound++;
      }
    });

    console.log('\n=== SUMMARY ===');
    console.log(`Total records: ${allSettings.length}`);
    console.log(`Problems found: ${problemsFound}`);
    
    if (problemsFound > 0) {
      console.log('\n❌ Issues detected! Run the fix migration script.');
    } else {
      console.log('\n✅ No JSONB field issues found!');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Test connectivity first
async function testConnection() {
  console.log('🔗 Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful\n');
    return true;
  } catch (error) {
    console.error('❌ Connection test error:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 User Settings JSONB Diagnostic Tool\n');
  
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  await checkUserSettingsJsonbFields();
}

main().catch(console.error);
