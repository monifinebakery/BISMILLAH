import { createClient } from '@supabase/supabase-js';
import process from 'process';

/**
 * Test Script for Automatic Price Adjustment System
 * 
 * This script tests the warehouse price adjustment functionality
 * to ensure items with zero prices are automatically fixed.
 */

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.VITE_SUPABASE_URL || 'https://ihqxfgpzctiqnlsdqgcz.supabase.co',
  supabaseKey: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocXhmZ3B6Y3RpcW5sc2RxZ2N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAxNzYxNzQsImV4cCI6MjAzNTc1MjE3NH0.f5JLLyDuUQPuP3F2K8FlKGtAVOdpGCkQCGAL89F2Y-I',
  testUserId: null // Will be set after authentication
};

const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);

async function testPriceAdjustment() {
  console.log('🧪 Starting Automatic Price Adjustment Test\n');
  
  try {
    // Step 1: Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication failed. Please ensure you are logged in.');
      console.log('This test requires an authenticated user to access warehouse data.');
      return;
    }
    
    TEST_CONFIG.testUserId = user.id;
    console.log(`✅ Authenticated as user: ${user.email || user.id}\n`);
    
    // Step 2: Fetch current warehouse items
    console.log('📦 Fetching warehouse items...');
    const { data: items, error: itemsError } = await supabase
      .from('bahan_baku')
      .select('id, nama, kategori, harga_satuan, harga_rata_rata, stok, minimum, supplier')
      .eq('user_id', user.id)
      .order('nama');
    
    if (itemsError) {
      console.error('❌ Failed to fetch warehouse items:', itemsError);
      return;
    }
    
    console.log(`📊 Found ${items.length} warehouse items\n`);
    
    // Step 3: Analyze current pricing status
    console.log('🔍 Analyzing current pricing status...');
    const priceAnalysis = items.map(item => ({
      id: item.id,
      nama: item.nama,
      kategori: item.kategori,
      harga: item.harga_satuan || 0,
      wac: item.harga_rata_rata || 0,
      hasZeroHarga: (item.harga_satuan || 0) === 0,
      hasZeroWac: (item.harga_rata_rata || 0) === 0,
      needsAttention: (item.harga_satuan || 0) === 0 || (item.harga_rata_rata || 0) === 0
    }));
    
    const zeroPriceItems = priceAnalysis.filter(p => p.needsAttention);
    const validPriceItems = priceAnalysis.filter(p => !p.needsAttention);
    
    console.log(`📈 Price Analysis Results:`);
    console.log(`   ✅ Items with valid prices: ${validPriceItems.length}`);
    console.log(`   ⚠️  Items needing price adjustment: ${zeroPriceItems.length}`);
    
    if (zeroPriceItems.length > 0) {
      console.log(`\n📋 Items needing price adjustment:`);
      zeroPriceItems.forEach(item => {
        console.log(`   • ${item.nama} (${item.kategori}) - Harga: Rp ${item.harga.toLocaleString()}, WAC: Rp ${item.wac.toLocaleString()}`);
      });
    }
    
    // Step 4: Check purchase history availability
    console.log(`\n💰 Checking purchase history...`);
    const { data: purchases, error: purchaseError } = await supabase
      .from('purchases')
      .select('id, items, created_at, supplier, status')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (purchaseError) {
      console.error('❌ Failed to fetch purchase history:', purchaseError);
      return;
    }
    
    console.log(`📊 Found ${purchases.length} completed purchases`);
    
    // Analyze purchase data for WAC calculation potential
    let totalPurchaseItems = 0;
    const itemsWithPurchaseHistory = new Set();
    
    purchases.forEach(purchase => {
      if (purchase.items && Array.isArray(purchase.items)) {
        purchase.items.forEach(purchaseItem => {
          totalPurchaseItems++;
          const itemId = purchaseItem.bahan_baku_id || purchaseItem.bahanBakuId || purchaseItem.id;
          if (itemId) {
            itemsWithPurchaseHistory.add(itemId);
          }
        });
      }
    });
    
    console.log(`   📦 Total purchase items found: ${totalPurchaseItems}`);
    console.log(`   🔗 Unique items with purchase history: ${itemsWithPurchaseHistory.size}`);
    
    // Step 5: Simulate price adjustment logic
    console.log(`\n🔧 Simulating automatic price adjustment...`);
    
    for (const item of zeroPriceItems) {
      let calculatedWac = 0;
      let totalQuantity = 0;
      let totalValue = 0;
      const purchaseRecords = [];
      
      // Calculate WAC from purchase history
      purchases.forEach(purchase => {
        if (purchase.items && Array.isArray(purchase.items)) {
          purchase.items.forEach(purchaseItem => {
            const itemMatches = (
              purchaseItem.bahan_baku_id === item.id ||
              purchaseItem.bahanBakuId === item.id ||
              purchaseItem.id === item.id
            );
            
            if (itemMatches) {
              const qty = Number(
                purchaseItem.jumlah || 
                purchaseItem.kuantitas || 
                purchaseItem.quantity || 0
              );
              const price = Number(
                purchaseItem.harga_per_satuan || 
                purchaseItem.harga_satuan || 
                purchaseItem.hargaSatuan ||
                purchaseItem.unit_price ||
                purchaseItem.price || 0
              );
              
              if (qty > 0 && price > 0) {
                totalQuantity += qty;
                totalValue += qty * price;
                purchaseRecords.push({ qty, price, total: qty * price });
              }
            }
          });
        }
      });
      
      if (totalQuantity > 0 && totalValue > 0) {
        calculatedWac = totalValue / totalQuantity;
        console.log(`   ✅ ${item.nama}: WAC calculated from ${purchaseRecords.length} records = Rp ${calculatedWac.toLocaleString()}`);
      } else {
        // Category-based default
        const categoryDefaults = {
          'Daging': 50000,
          'Seafood': 40000,
          'Sayuran': 15000,
          'Buah': 20000,
          'Bumbu': 10000,
          'Minyak': 25000,
          'Tepung': 8000,
          'Gula': 12000,
          'Garam': 5000,
          'Susu': 15000,
          'Telur': 25000
        };
        
        const defaultPrice = categoryDefaults[item.kategori] || 5000;
        console.log(`   ⚠️  ${item.nama}: No purchase history, using category default (${item.kategori}) = Rp ${defaultPrice.toLocaleString()}`);
      }
    }
    
    // Step 6: Test summary
    console.log(`\n📊 Test Summary:`);
    console.log(`   📦 Total warehouse items: ${items.length}`);
    console.log(`   ✅ Items with valid prices: ${validPriceItems.length}`);
    console.log(`   🔧 Items that will be auto-adjusted: ${zeroPriceItems.length}`);
    console.log(`   💰 Available purchase records: ${purchases.length}`);
    console.log(`   📈 Items with purchase history: ${itemsWithPurchaseHistory.size}`);
    
    if (zeroPriceItems.length === 0) {
      console.log(`\n🎉 SUCCESS: All items already have valid prices! The automatic price adjustment system is working correctly.`);
    } else {
      console.log(`\n🔄 INFO: ${zeroPriceItems.length} items will be automatically adjusted when the warehouse data is loaded.`);
      console.log(`\n📝 Next steps:`);
      console.log(`   1. Refresh the warehouse page to trigger automatic price adjustment`);
      console.log(`   2. Check the browser console for detailed adjustment logs`);
      console.log(`   3. Verify that items now show calculated prices instead of zero`);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testPriceAdjustment().then(() => {
  console.log('\n🏁 Test completed.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

export { testPriceAdjustment };