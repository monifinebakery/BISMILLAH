// Auto-fix Payment Linking - Link unlinked paid payments to users
// Run this with: node fix-payment-linking.js

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
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || 
                          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('   Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Use service key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPaymentLinking() {
  console.log('🔧 Starting Payment Linking Fix...\n');
  
  try {
    // 1. Get unlinked paid payments
    console.log('1️⃣ Finding unlinked paid payments...');
    const { data: unlinkedPayments, error: paymentsError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .is('user_id', null)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('❌ Error fetching payments:', paymentsError);
      return;
    }

    console.log(`📊 Found ${unlinkedPayments?.length || 0} unlinked paid payments\n`);

    if (!unlinkedPayments || unlinkedPayments.length === 0) {
      console.log('✅ No unlinked payments found. All payments are properly linked!');
      return;
    }

    // 2. Get all auth users
    console.log('2️⃣ Fetching auth users...');
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Error fetching users:', userError);
      return;
    }

    console.log(`👥 Found ${users?.length || 0} auth users\n`);

    // 3. Try to link payments
    console.log('3️⃣ Attempting to link payments to users...\n');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const payment of unlinkedPayments) {
      console.log(`🔗 Processing payment ${payment.id}...`);
      console.log(`   Email: ${payment.email}`);
      console.log(`   Order ID: ${payment.order_id}`);
      
      // Find matching user
      const matchingUser = users?.find(u => 
        u.email?.toLowerCase().trim() === payment.email?.toLowerCase().trim()
      );
      
      if (!matchingUser) {
        console.log(`   ❌ No matching user found for email: ${payment.email}`);
        failCount++;
        continue;
      }
      
      console.log(`   🎯 Found matching user: ${matchingUser.id}`);
      
      // Try to link using the stored function
      try {
        const { data: linkResult, error: linkError } = await supabase
          .rpc('link_payment_to_user', {
            p_order_id: payment.order_id,
            p_user_id: matchingUser.id,
            p_user_email: matchingUser.email
          });

        if (linkError) {
          console.log(`   ❌ RPC Error: ${linkError.message}`);
          
          // Fallback: direct update
          console.log(`   🔄 Trying direct update...`);
          const { error: updateError } = await supabase
            .from('user_payments')
            .update({ 
              user_id: matchingUser.id,
              email: matchingUser.email,
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id)
            .is('user_id', null); // Safety check
          
          if (updateError) {
            console.log(`   ❌ Direct update failed: ${updateError.message}`);
            failCount++;
            continue;
          } else {
            console.log(`   ✅ Direct update successful!`);
            successCount++;
          }
        } else {
          console.log(`   ✅ RPC link successful!`);
          console.log(`   📋 Result: ${JSON.stringify(linkResult, null, 2)}`);
          successCount++;
        }
      } catch (error) {
        console.log(`   ❌ Unexpected error: ${error.message}`);
        failCount++;
      }
      
      console.log(''); // Empty line for readability
    }

    // 4. Summary
    console.log('📊 LINKING RESULTS:');
    console.log(`   ✅ Successfully linked: ${successCount}`);
    console.log(`   ❌ Failed to link: ${failCount}`);
    console.log(`   📊 Total processed: ${unlinkedPayments.length}`);
    
    if (successCount > 0) {
      console.log('\n🎉 Payment linking completed!');
      console.log('💡 Users should now be able to access the app without upgrade popup');
      console.log('🔄 Ask affected users to refresh their browser or restart the app');
    }

    if (failCount > 0) {
      console.log('\n⚠️  Some payments could not be linked automatically');
      console.log('📞 You may need to manually investigate these cases');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Verification function
async function verifyFix() {
  console.log('\n\n🔍 VERIFICATION: Checking if fix worked...');
  
  try {
    const { data: remainingUnlinked, error } = await supabase
      .from('user_payments')
      .select('*')
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .is('user_id', null);

    if (error) {
      console.error('❌ Error during verification:', error);
      return;
    }

    if (remainingUnlinked && remainingUnlinked.length > 0) {
      console.log(`⚠️  Still ${remainingUnlinked.length} unlinked payments remaining`);
      console.table(remainingUnlinked.map(p => ({
        id: p.id,
        email: p.email,
        order_id: p.order_id,
        created_at: p.created_at
      })));
    } else {
      console.log('✅ Verification passed! All paid payments are now linked to users.');
    }
  } catch (error) {
    console.error('❌ Verification error:', error);
  }
}

// Main execution
async function main() {
  await fixPaymentLinking();
  await verifyFix();
}

main().catch(console.error);
