#!/usr/bin/env node

// Script untuk test chatbot dengan authenticated user
// Jalankan dengan: node test-chatbot-with-auth.cjs

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

console.log('🤖 Testing Chatbot with Authentication\n');

async function testChatbotWithAuth() {
  try {
    // Test 1: Simulate chatbot call with user context
    console.log('📋 Test 1: Simulate chatbot-query call');
    
    // Create a mock Authorization header (you'd need a real JWT token)
    const mockUserId = '23f1793f-070f-47b3-b5e9-71e28f50070b';
    
    // Try to call the function directly
    console.log('🔍 Calling chatbot-query function...');
    
    const { data, error } = await supabase.functions.invoke('chatbot-query', {
      body: {
        intent: 'inventory',
        message: 'cek stok bahan baku',
        context: {
          currentPage: 'test',
          businessName: 'Test Bakery'
        }
      }
    });

    if (error) {
      console.log('❌ Chatbot function error:', error);
      console.log('💡 This might be because user is not authenticated');
    } else {
      console.log('✅ Chatbot function response:', JSON.stringify(data, null, 2));
    }

    // Test 2: Check current auth state
    console.log('\n📋 Test 2: Check current auth state');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
    } else {
      console.log('👤 Current user:', user ? `${user.id} (${user.email})` : 'Not authenticated');
    }

    // Test 3: Recommendations
    console.log('\n📋 Test 3: Next Steps');
    console.log('💡 To fix the chatbot issue:');
    console.log('   1. Make sure user is logged in when testing chatbot');
    console.log('   2. Check if session is valid and not expired');
    console.log('   3. Verify RLS policies allow authenticated user access');
    console.log('   4. Test chatbot from the actual application (not script)');
    console.log('\n🚀 Try testing chatbot from the web app while logged in!');

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

testChatbotWithAuth();
