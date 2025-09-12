// Debug script untuk mengecek order completion workflow
// Jalankan dengan: node debug-order-completion.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugOrderCompletion() {
  console.log('🔍 Debug Order Completion Workflow');
  console.log('=====================================');
  
  try {
    // 1. Cek apakah stored procedure ada
    console.log('\n1. Checking stored procedure...');
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'complete_order_and_deduct_stock')
      .single();
    
    if (funcError) {
      console.log('❌ Stored procedure tidak ditemukan:', funcError.message);
    } else {
      console.log('✅ Stored procedure complete_order_and_deduct_stock ditemukan');
    }
    
    // 2. Cek orders dengan status completed
    console.log('\n2. Checking recent completed orders...');
    const { data: completedOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, nomor_pesanan, status, nama_pelanggan, total_pesanan, created_at, updated_at')
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (ordersError) {
      console.log('❌ Error mengambil orders:', ordersError.message);
    } else {
      console.log(`✅ Ditemukan ${completedOrders.length} orders completed:`);
      completedOrders.forEach(order => {
        console.log(`   - ${order.nomor_pesanan}: ${order.nama_pelanggan} (${order.total_pesanan})`);
        console.log(`     Created: ${order.created_at}`);
        console.log(`     Updated: ${order.updated_at}`);
      });
    }
    
    // 3. Cek financial transactions terkait orders
    console.log('\n3. Checking financial transactions...');
    const { data: transactions, error: transError } = await supabase
      .from('financial_transactions')
      .select('id, type, category, amount, description, related_id, created_at')
      .eq('type', 'income')
      .eq('category', 'Penjualan Produk')
      .not('related_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (transError) {
      console.log('❌ Error mengambil transactions:', transError.message);
    } else {
      console.log(`✅ Ditemukan ${transactions.length} financial transactions:`);
      transactions.forEach(trans => {
        console.log(`   - ${trans.description}: ${trans.amount}`);
        console.log(`     Order ID: ${trans.related_id}`);
        console.log(`     Created: ${trans.created_at}`);
      });
    }
    
    // 4. Cek activities terkait stock reduction
    console.log('\n4. Checking stock reduction activities...');
    const { data: activities, error: actError } = await supabase
      .from('activities')
      .select('id, title, description, type, value, created_at')
      .eq('title', 'Stok Berkurang')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (actError) {
      console.log('❌ Error mengambil activities:', actError.message);
    } else {
      console.log(`✅ Ditemukan ${activities.length} stock reduction activities:`);
      activities.forEach(activity => {
        console.log(`   - ${activity.description}`);
        console.log(`     Value: ${activity.value}`);
        console.log(`     Created: ${activity.created_at}`);
      });
    }
    
    // 5. Cek pemakaian_bahan records
    console.log('\n5. Checking pemakaian_bahan records...');
    const { data: pemakaian, error: pemError } = await supabase
      .from('pemakaian_bahan')
      .select('id, bahan_id, jumlah_pakai, satuan, tanggal_pakai, keterangan, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (pemError) {
      console.log('❌ Error mengambil pemakaian_bahan:', pemError.message);
    } else {
      console.log(`✅ Ditemukan ${pemakaian.length} pemakaian_bahan records:`);
      pemakaian.forEach(p => {
        console.log(`   - ${p.keterangan}: ${p.jumlah_pakai} ${p.satuan}`);
        console.log(`     Tanggal: ${p.tanggal_pakai}`);
        console.log(`     Created: ${p.created_at}`);
      });
    }
    
    // 6. Test stored procedure dengan order terbaru
    if (completedOrders && completedOrders.length > 0) {
      const testOrderId = completedOrders[0].id;
      console.log(`\n6. Testing stored procedure dengan order: ${completedOrders[0].nomor_pesanan}`);
      
      const { data: testResult, error: testError } = await supabase
        .rpc('complete_order_and_deduct_stock', { order_id: testOrderId });
      
      if (testError) {
        console.log('❌ Error testing stored procedure:', testError.message);
      } else {
        console.log('✅ Stored procedure response:', JSON.stringify(testResult, null, 2));
      }
    }
    
    // 7. Cek current stock levels
    console.log('\n7. Checking current stock levels...');
    const { data: stock, error: stockError } = await supabase
      .from('bahan_baku')
      .select('id, nama, stok, satuan, minimum, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10);
    
    if (stockError) {
      console.log('❌ Error mengambil stock:', stockError.message);
    } else {
      console.log(`✅ Current stock levels:`);
      stock.forEach(item => {
        const status = item.stok <= item.minimum ? '⚠️ LOW' : '✅ OK';
        console.log(`   - ${item.nama}: ${item.stok} ${item.satuan} ${status}`);
        console.log(`     Last updated: ${item.updated_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

// Jalankan debug
debugOrderCompletion().then(() => {
  console.log('\n🏁 Debug selesai');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});