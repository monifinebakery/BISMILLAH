// Copy and paste this into browser console at http://localhost:5174

// Test 1: Check if supabase client is available
console.log('🔍 Checking Supabase client...');
const supabase = window.supabase || window.__supabase || (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentOwner?.current?.memoizedProps?.supabase);

if (!supabase) {
  console.error('❌ Supabase client not found!');
  console.log('Try: import { supabase } from "./src/integrations/supabase/client"');
} else {
  console.log('✅ Supabase client found!');
}

// Test 2: Check stored procedure
async function testStoredProcedure() {
  try {
    console.log('\n🔍 Testing stored procedure...');
    
    // Try to call with dummy ID to see if function exists
    const { data, error } = await supabase.rpc('complete_order_and_deduct_stock', {
      order_id: '00000000-0000-0000-0000-000000000000'
    });
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.error('❌ Stored procedure NOT FOUND!');
        return false;
      } else {
        console.log('✅ Stored procedure exists! (Got expected error for dummy ID)');
        console.log('Error:', error.message);
      }
    }
    
    return true;
  } catch (e) {
    console.error('❌ Error testing stored procedure:', e);
    return false;
  }
}

// Test 3: Find orders to test with
async function findTestOrder() {
  try {
    console.log('\n🔍 Looking for test orders...');
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'completed')
      .limit(5);
    
    if (error) {
      console.error('❌ Error fetching orders:', error);
      return null;
    }
    
    console.log('📦 Found orders:', orders?.length || 0);
    orders?.forEach(order => {
      console.log(`   ${order.nomor_pesanan}: ${order.status} - Rp${order.total_pesanan}`);
    });
    
    return orders?.[0] || null;
  } catch (e) {
    console.error('❌ Error finding orders:', e);
    return null;
  }
}

// Test 4: Check current stock
async function checkStock() {
  try {
    console.log('\n🔍 Checking current stock...');
    
    const { data: stock, error } = await supabase
      .from('bahan_baku')
      .select('nama, stok_saat_ini, satuan')
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching stock:', error);
      return;
    }
    
    console.log('📊 Current stock:');
    stock?.forEach(item => {
      console.log(`   ${item.nama}: ${item.stok_saat_ini} ${item.satuan}`);
    });
  } catch (e) {
    console.error('❌ Error checking stock:', e);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive test...');
  
  const procedureExists = await testStoredProcedure();
  if (!procedureExists) {
    console.log('❌ Cannot continue - stored procedure missing');
    return;
  }
  
  const testOrder = await findTestOrder();
  await checkStock();
  
  if (testOrder) {
    console.log('\n🎯 Ready to test with order:', testOrder.nomor_pesanan);
    console.log('Run this to test completion:');
    console.log(`
// Test order completion
const result = await supabase.rpc('complete_order_and_deduct_stock', { order_id: '${testOrder.id}' });
console.log('Result:', result);
`);
  }
}

// Auto-run
if (typeof window !== 'undefined') {
  runAllTests();
}