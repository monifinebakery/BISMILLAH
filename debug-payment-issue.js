// Debug Payment Issue - Cek kenapa paid user muncul upgrade popup
// Run this with: node debug-payment-issue.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Simple .env parser
function loadEnv() {
  try {
    const envFile = readFileSync('.env', 'utf8');
    const envVars = {};
    envFile.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    return envVars;
  } catch (error) {
    console.warn('⚠️  Could not load .env file, using process.env');
    return process.env;
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugPaymentIssue() {
  console.log('🔍 Starting Payment Issue Debugging...\n');
  
  try {
    // 1. Cek semua payment records
    console.log('1️⃣ Checking all payment records...');
    const { data: allPayments, error: allError } = await supabase
      .from('user_payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Error fetching payments:', allError);
      return;
    }

    console.log(`📊 Found ${allPayments?.length || 0} total payment records\n`);

    // 2. Analyze payment patterns
    const paidPayments = allPayments?.filter(p => p.is_paid === true) || [];
    const linkedPayments = paidPayments.filter(p => p.user_id !== null);
    const unlinkedPayments = paidPayments.filter(p => p.user_id === null);

    console.log('📈 Payment Analysis:');
    console.log(`   Total Paid Records: ${paidPayments.length}`);
    console.log(`   ✅ Linked to Users: ${linkedPayments.length}`);
    console.log(`   ⚠️  Unlinked (NULL user_id): ${unlinkedPayments.length}`);
    console.log('');

    // 3. Show unlinked paid payments (this is likely the issue!)
    if (unlinkedPayments.length > 0) {
      console.log('🚨 PROBLEM FOUND: Unlinked Paid Payments');
      console.log('These payments are PAID but not linked to any user:');
      console.table(unlinkedPayments.map(p => ({
        id: p.id,
        email: p.email,
        order_id: p.order_id,
        payment_status: p.payment_status,
        is_paid: p.is_paid,
        user_id: p.user_id || 'NULL ❌',
        created_at: p.created_at
      })));
    }

    // 4. Check auth users and their emails
    console.log('\n4️⃣ Checking auth users...');
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Error fetching users:', userError);
      return;
    }

    console.log(`👥 Found ${users?.length || 0} auth users\n`);

    // 5. Try to match unlinked payments with users by email
    console.log('5️⃣ Attempting to match unlinked payments with users...');
    
    for (const payment of unlinkedPayments) {
      const matchingUser = users?.find(u => u.email?.toLowerCase() === payment.email?.toLowerCase());
      
      if (matchingUser) {
        console.log(`🎯 MATCH FOUND:`);
        console.log(`   Payment ID: ${payment.id}`);
        console.log(`   Email: ${payment.email}`);
        console.log(`   Order ID: ${payment.order_id}`);
        console.log(`   Should be linked to User: ${matchingUser.id}`);
        console.log(`   User Email: ${matchingUser.email}`);
        console.log('');
        
        // Offer to fix this automatically
        console.log(`💡 This payment should be linked! Run fix script to link it.`);
      } else {
        console.log(`❓ No matching user found for payment email: ${payment.email}`);
      }
    }

    // 6. Summary and recommendations
    console.log('\n📋 SUMMARY:');
    if (unlinkedPayments.length > 0) {
      console.log('❌ ISSUE CONFIRMED: Found paid users who are not linked properly');
      console.log('🔧 SOLUTION: Run the fix script to link these payments to users');
      console.log('\n💡 To fix manually, you can:');
      console.log('1. Use the link_payment_to_user() function in Supabase');
      console.log('2. Or run: npm run fix-payment-linking');
    } else {
      console.log('✅ No unlinked paid payments found. Issue might be elsewhere.');
      console.log('🔍 Check payment status matching logic in usePaymentStatus.ts');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug
debugPaymentIssue().catch(console.error);
