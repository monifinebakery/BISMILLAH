#!/usr/bin/env node

// Script untuk test chatbot dengan authentication yang bener
// Jalankan dengan: node test-chatbot-auth.cjs

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

console.log('🔐 Testing Chatbot Authentication Flow\n');

async function testChatbotAuth() {
  try {
    // Test 1: Check current session
    console.log('📋 Test 1: Checking current session');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
      console.log('💡 You need to be logged in to the web app first');
      return;
    }

    if (!sessionData?.session) {
      console.log('❌ No active session found');
      console.log('💡 Please log in to the web app first');
      return;
    }

    const userId = sessionData.session.user.id;
    console.log('✅ Session found for user:', userId);

    // Test 2: Check if we can access bahan_baku table with auth
    console.log('\n📋 Test 2: Testing bahan_baku table access');
    const { data: bahanData, error: bahanError } = await supabase
      .from('bahan_baku')
      .select('nama, stok, satuan, user_id')
      .eq('user_id', userId)
      .limit(5);

    if (bahanError) {
      console.log('❌ Database access error:', bahanError.message);
      console.log('💡 This is the error the chatbot should now show!');
      return;
    }

    console.log('✅ Database access successful');
    console.log('📊 Found', bahanData?.length || 0, 'bahan baku records');

    if (bahanData && bahanData.length > 0) {
      console.log('📋 Sample data:');
      bahanData.forEach((item, i) => {
        console.log(`   ${i+1}. ${item.nama} - ${item.stok} ${item.satuan}`);
      });
    }

    // Test 3: Test the chatbot function directly
    console.log('\n📋 Test 3: Testing chatbot-query function');
    const { data: chatbotData, error: chatbotError } = await supabase.functions.invoke('chatbot-query', {
      body: {
        intent: 'inventory',
        message: 'cek stok bahan baku',
        userId: userId,
        context: {
          currentPage: 'test',
          businessName: 'Test Bakery'
        }
      }
    });

    if (chatbotError) {
      console.log('❌ Chatbot function error:', chatbotError);
      console.log('💡 This error should now be visible in the chatbot!');
    } else {
      console.log('✅ Chatbot function success:', JSON.stringify(chatbotData, null, 2));
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testChatbotAuth();
