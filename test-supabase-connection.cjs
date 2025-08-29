#!/usr/bin/env node

// Test script untuk memverifikasi koneksi Supabase dan real-time subscription
// Jalankan dengan: node test-supabase-connection.js

const { createClient } = require('@supabase/supabase-js');

// Load environment from .env file manually
const fs = require('fs');
const path = require('path');

let SUPABASE_URL = process.env.VITE_SUPABASE_URL;
let SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// If not in environment, try to read from .env file
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  try {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key === 'VITE_SUPABASE_URL') SUPABASE_URL = value;
      if (key === 'VITE_SUPABASE_ANON_KEY') SUPABASE_ANON_KEY = value;
    });
  } catch (error) {
    console.log('Note: Could not read .env file, using environment variables only');
  }
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Environment variables missing');
  console.log('VITE_SUPABASE_URL:', SUPABASE_URL ? 'PRESENT' : 'MISSING');
  console.log('VITE_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const testConnection = async () => {
  console.log('🔍 Testing Supabase connection...');
  console.log('URL:', SUPABASE_URL);
  console.log('Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
  
  try {
    // Test 1: Basic connection
    console.log('\n📝 Test 1: Basic Connection');
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('id, created_at')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Basic connection successful');
    console.log('Sample data count:', data?.length || 0);
    
    // Test 2: Real-time subscription
    console.log('\n📡 Test 2: Real-time Subscription');
    
    const channel = supabase
      .channel('test-financial-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_transactions'
        },
        (payload) => {
          console.log('📨 Real-time event received:', payload.eventType);
        }
      )
      .subscribe((status, err) => {
        console.log('📊 Subscription status:', status);
        
        if (err) {
          console.error('❌ Subscription error:', {
            message: err.message,
            code: err.code || 'NO_CODE'
          });
        }
        
        switch (status) {
          case 'SUBSCRIBED':
            console.log('✅ Real-time subscription active!');
            
            // Test cleanup after 5 seconds
            setTimeout(() => {
              console.log('🧹 Cleaning up test subscription...');
              channel.unsubscribe();
              console.log('✅ Test completed successfully!');
              process.exit(0);
            }, 5000);
            break;
            
          case 'CHANNEL_ERROR':
            console.log('⚠️ Channel error occurred - this is the error you are seeing!');
            console.log('💡 This is normal and Supabase will retry automatically.');
            break;
            
          case 'TIMED_OUT':
            console.log('⏰ Connection timed out');
            break;
            
          case 'CLOSED':
            console.log('🔒 Channel closed');
            break;
        }
      });
    
    // Test 3: Network status
    console.log('\n🌐 Test 3: Network Status');
    console.log('Online status:', typeof navigator !== 'undefined' ? navigator.onLine : 'Server environment');
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
};

// Timeout untuk test
setTimeout(() => {
  console.log('⏰ Test timeout reached');
  process.exit(1);
}, 15000);

// Jalankan test
testConnection();
