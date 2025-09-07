// Test WAC System - Copy ke browser console
console.log('🧪 TESTING WAC SYSTEM...');

async function testWACSystem() {
  try {
    // Get user
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error('❌ Not authenticated');
      return;
    }
    
    console.log('✅ User:', user.id);
    
    // 1. CHECK PURCHASES STATUS
    console.log('\n📋 STEP 1: Check purchases status...');
    const { data: purchases } = await window.supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    console.log('📦 Recent Purchases:');
    purchases?.forEach(p => {
      console.log(`   ${p.id}: Status=${p.status}, Total=${p.total_nilai || 'N/A'}, Date=${p.tanggal}`);
    });
    
    const completedPurchases = purchases?.filter(p => p.status === 'completed') || [];
    console.log(`\n✅ Completed purchases: ${completedPurchases.length}`);
    console.log(`⏳ Pending purchases: ${purchases?.filter(p => p.status === 'pending').length || 0}`);
    
    // 2. CHECK BAHAN_BAKU WAC VALUES
    console.log('\n📦 STEP 2: Check warehouse WAC values...');
    const { data: bahanBaku } = await window.supabase
      .from('bahan_baku')
      .select('id, nama, stok, harga_satuan, harga_rata_rata, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    console.log('📊 Warehouse Items:');
    bahanBaku?.forEach(b => {
      const hasWAC = b.harga_rata_rata && b.harga_rata_rata > 0;
      console.log(`   ${b.nama}: Stock=${b.stok}, Price=${b.harga_satuan}, WAC=${b.harga_rata_rata || 0} ${hasWAC ? '✅' : '❌'}`);
    });
    
    const itemsWithWAC = bahanBaku?.filter(b => b.harga_rata_rata && b.harga_rata_rata > 0) || [];
    const itemsWithoutWAC = bahanBaku?.filter(b => !b.harga_rata_rata || b.harga_rata_rata === 0) || [];
    
    console.log(`\n✅ Items with WAC: ${itemsWithWAC.length}`);
    console.log(`❌ Items without WAC: ${itemsWithoutWAC.length}`);
    
    // 3. CHECK PURCHASE ITEMS LINKING
    if (completedPurchases.length > 0) {
      console.log('\n🔗 STEP 3: Check purchase-warehouse linking...');
      
      const samplePurchase = completedPurchases[0];
      console.log(`📋 Checking purchase: ${samplePurchase.id}`);
      console.log(`   Items:`, samplePurchase.items);
      
      if (samplePurchase.items && Array.isArray(samplePurchase.items)) {
        samplePurchase.items.forEach((item, index) => {
          const itemId = item.bahanBakuId || item.bahan_baku_id || item.id;
          console.log(`   Item ${index + 1}: ID=${itemId}, Qty=${item.kuantitas || item.jumlah}, Price=${item.hargaSatuan || item.harga_satuan}`);
          
          // Check if this item exists in warehouse
          const warehouseItem = bahanBaku?.find(b => b.id === itemId);
          if (warehouseItem) {
            console.log(`     ✅ Found in warehouse: ${warehouseItem.nama} (WAC: ${warehouseItem.harga_rata_rata || 0})`);
          } else {
            console.log(`     ❌ NOT found in warehouse!`);
          }
        });
      }
    }
    
    // 4. MANUAL WAC CALCULATION TEST
    if (completedPurchases.length > 0 && bahanBaku?.length > 0) {
      console.log('\n🧮 STEP 4: Manual WAC calculation test...');
      
      const testItem = bahanBaku[0];
      console.log(`\n🎯 Testing WAC for: ${testItem.nama}`);
      console.log(`   Current: Stock=${testItem.stok}, WAC=${testItem.harga_rata_rata || 0}`);
      
      // Find purchases that include this item
      let totalQty = 0;
      let totalValue = 0;
      
      completedPurchases.forEach(purchase => {
        if (purchase.items && Array.isArray(purchase.items)) {
          purchase.items.forEach(item => {
            const itemId = item.bahanBakuId || item.bahan_baku_id || item.id;
            if (itemId === testItem.id) {
              const qty = Number(item.kuantitas || item.jumlah || 0);
              const price = Number(item.hargaSatuan || item.harga_satuan || 0);
              totalQty += qty;
              totalValue += qty * price;
              console.log(`     Purchase ${purchase.id}: +${qty} @ ${price} = ${qty * price}`);
            }
          });
        }
      });
      
      const calculatedWAC = totalQty > 0 ? totalValue / totalQty : 0;
      console.log(`\n📊 Manual WAC calculation:`);
      console.log(`   Total Qty: ${totalQty}`);
      console.log(`   Total Value: ${totalValue}`);
      console.log(`   Calculated WAC: ${calculatedWAC}`);
      console.log(`   Current WAC: ${testItem.harga_rata_rata || 0}`);
      console.log(`   Match: ${Math.abs(calculatedWAC - (testItem.harga_rata_rata || 0)) < 0.01 ? '✅ YES' : '❌ NO'}`);
    }
    
    // 5. RECOMMENDATIONS
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('=' .repeat(50));
    
    if (completedPurchases.length === 0) {
      console.log('🔧 ISSUE: No completed purchases found');
      console.log('   SOLUTION: Complete at least one purchase to enable WAC calculation');
      console.log('   Go to: Purchases → Set status to "Completed"');
    }
    
    if (itemsWithoutWAC.length > 0 && completedPurchases.length > 0) {
      console.log('🔧 ISSUE: Items have no WAC despite completed purchases');
      console.log('   SOLUTION: Check purchase-warehouse item linking');
      console.log('   Make sure bahanBakuId in purchase matches bahan_baku.id');
    }
    
    if (itemsWithWAC.length > 0) {
      console.log('✅ WORKING: Some items have valid WAC');
      console.log('   Your WAC system is functional!');
    }
    
    return {
      purchaseCount: purchases?.length || 0,
      completedPurchases: completedPurchases.length,
      warehouseItems: bahanBaku?.length || 0,
      itemsWithWAC: itemsWithWAC.length,
      itemsWithoutWAC: itemsWithoutWAC.length,
      isWorking: itemsWithWAC.length > 0 && completedPurchases.length > 0
    };
    
  } catch (error) {
    console.error('❌ WAC test error:', error);
  }
}

// Quick fix function to manually update WAC
window.forceWACUpdate = async (itemId) => {
  console.log(`🔄 Force updating WAC for item: ${itemId}`);
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) return console.error('Not authenticated');
    
    // Get completed purchases
    const { data: purchases } = await window.supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed');
    
    let totalQty = 0;
    let totalValue = 0;
    
    // Calculate WAC from all completed purchases
    purchases?.forEach(purchase => {
      if (purchase.items && Array.isArray(purchase.items)) {
        purchase.items.forEach(item => {
          const purchaseItemId = item.bahanBakuId || item.bahan_baku_id || item.id;
          if (purchaseItemId === itemId) {
            const qty = Number(item.kuantitas || item.jumlah || 0);
            const price = Number(item.hargaSatuan || item.harga_satuan || 0);
            totalQty += qty;
            totalValue += qty * price;
          }
        });
      }
    });
    
    const newWAC = totalQty > 0 ? totalValue / totalQty : 0;
    
    if (newWAC > 0) {
      // Update the warehouse item
      const { error } = await window.supabase
        .from('bahan_baku')
        .update({ harga_rata_rata: newWAC })
        .eq('id', itemId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      console.log(`✅ WAC updated to: ${newWAC}`);
      return newWAC;
    } else {
      console.log('⚠️ No purchase data found for WAC calculation');
    }
  } catch (error) {
    console.error('❌ Force WAC update failed:', error);
  }
};

// Run the test
testWACSystem();

console.log('\n🎯 Available functions:');
console.log('• testWACSystem() - Run full WAC system test');
console.log('• forceWACUpdate(itemId) - Manually update WAC for specific item');
