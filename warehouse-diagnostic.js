// Warehouse Stock & WAC Diagnostic Script
// Run this script in the browser console to diagnose stock calculation issues
// Copy and paste entire script into the browser console on localhost:5174

console.log('🔧 Starting Warehouse Stock & WAC Diagnostic...');

async function runWarehouseDiagnostic() {
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error('❌ Not authenticated');
      return;
    }

    console.log('👤 User ID:', user.id);

    // 1. Get warehouse items with detailed info
    console.log('\n📦 STEP 1: Fetching warehouse items...');
    const { data: warehouseItems, error: warehouseError } = await window.supabase
      .from('bahan_baku')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (warehouseError) {
      console.error('❌ Error fetching warehouse items:', warehouseError);
      return;
    }

    console.log(`📊 Found ${warehouseItems?.length || 0} warehouse items`);

    // 2. Get completed purchases with items
    console.log('\n🛒 STEP 2: Fetching completed purchases...');
    const { data: purchases, error: purchaseError } = await window.supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (purchaseError) {
      console.error('❌ Error fetching purchases:', purchaseError);
      return;
    }

    console.log(`🛒 Found ${purchases?.length || 0} completed purchases`);

    // 3. Analyze each warehouse item
    console.log('\n🔍 STEP 3: Analyzing warehouse items...');
    
    const analysis = [];

    warehouseItems?.forEach(item => {
      const itemAnalysis = {
        id: item.id,
        nama: item.nama,
        stok: item.stok,
        harga_satuan: item.harga_satuan,
        harga_rata_rata: item.harga_rata_rata,
        supplier: item.supplier,
        issues: [],
        recommendations: []
      };

      // Check for missing WAC when purchases exist
      let totalQtyFromPurchases = 0;
      let totalValueFromPurchases = 0;
      let purchaseCount = 0;

      purchases?.forEach(purchase => {
        if (purchase.items && Array.isArray(purchase.items)) {
          purchase.items.forEach(purchaseItem => {
            const purchaseItemId = purchaseItem.bahanBakuId || purchaseItem.bahan_baku_id || purchaseItem.id;
            if (purchaseItemId === item.id) {
              const qty = Number(purchaseItem.kuantitas || purchaseItem.jumlah || 0);
              const price = Number(purchaseItem.hargaSatuan || purchaseItem.harga_satuan || 0);
              totalQtyFromPurchases += qty;
              totalValueFromPurchases += qty * price;
              purchaseCount++;
            }
          });
        }
      });

      // Calculate expected WAC from purchases
      const expectedWAC = totalQtyFromPurchases > 0 ? totalValueFromPurchases / totalQtyFromPurchases : 0;

      if (purchaseCount > 0 && (!item.harga_rata_rata || item.harga_rata_rata === 0)) {
        itemAnalysis.issues.push('Missing WAC despite having purchase history');
        itemAnalysis.recommendations.push(`Expected WAC: ${expectedWAC.toFixed(2)}`);
      }

      if (expectedWAC > 0 && item.harga_rata_rata && Math.abs(item.harga_rata_rata - expectedWAC) > 1) {
        itemAnalysis.issues.push(`WAC mismatch: DB=${item.harga_rata_rata}, Expected=${expectedWAC.toFixed(2)}`);
        itemAnalysis.recommendations.push('Recalculate WAC from purchase history');
      }

      if (totalQtyFromPurchases > 0 && totalQtyFromPurchases !== item.stok) {
        itemAnalysis.issues.push(`Stock mismatch: DB=${item.stok}, Expected=${totalQtyFromPurchases}`);
        itemAnalysis.recommendations.push('Sync stock with purchase history');
      }

      // Store calculated values for fixing
      itemAnalysis.expectedWAC = expectedWAC;
      itemAnalysis.expectedStock = totalQtyFromPurchases;
      itemAnalysis.purchaseCount = purchaseCount;

      analysis.push(itemAnalysis);
    });

    // 4. Show results
    console.log('\n📋 ANALYSIS RESULTS:');
    console.log('='.repeat(80));

    const itemsWithIssues = analysis.filter(item => item.issues.length > 0);
    const itemsWithoutIssues = analysis.filter(item => item.issues.length === 0);

    console.log(`✅ Items without issues: ${itemsWithoutIssues.length}`);
    console.log(`❌ Items with issues: ${itemsWithIssues.length}`);

    if (itemsWithIssues.length > 0) {
      console.log('\n🔴 ITEMS WITH ISSUES:');
      itemsWithIssues.forEach(item => {
        console.log(`\n📦 ${item.nama} (ID: ${item.id})`);
        console.log(`   Current: Stock=${item.stok}, WAC=${item.harga_rata_rata || 'N/A'}, Price=${item.harga_satuan}`);
        console.log(`   Expected: Stock=${item.expectedStock}, WAC=${item.expectedWAC.toFixed(2)}`);
        console.log(`   Purchase Count: ${item.purchaseCount}`);
        console.log('   Issues:');
        item.issues.forEach(issue => console.log(`     - ${issue}`));
        console.log('   Recommendations:');
        item.recommendations.forEach(rec => console.log(`     → ${rec}`));
      });
    }

    // 5. Provide fix functions
    console.log('\n🔧 AVAILABLE FIX FUNCTIONS:');
    console.log('Use these functions to fix identified issues:');
    console.log('• fixWarehouseItem(itemId) - Fix specific item');
    console.log('• fixAllWarehouseItems() - Fix all items with issues');
    console.log('• recalculateWAC(itemId) - Recalculate WAC for specific item');

    // Store analysis globally for fix functions
    window.warehouseAnalysis = analysis;
    window.warehouseItemsWithIssues = itemsWithIssues;

    return {
      totalItems: warehouseItems?.length || 0,
      completedPurchases: purchases?.length || 0,
      itemsWithIssues: itemsWithIssues.length,
      itemsWithoutIssues: itemsWithoutIssues.length,
      analysis
    };

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  }
}

// Fix individual warehouse item
window.fixWarehouseItem = async (itemId) => {
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) return console.error('Not authenticated');

    const item = window.warehouseAnalysis?.find(i => i.id === itemId);
    if (!item) return console.error('Item not found in analysis');

    console.log(`🔧 Fixing item: ${item.nama}`);

    const updateData = {};
    if (item.expectedWAC > 0) {
      updateData.harga_rata_rata = item.expectedWAC;
    }
    if (item.expectedStock >= 0) {
      updateData.stok = item.expectedStock;
    }

    const { error } = await window.supabase
      .from('bahan_baku')
      .update(updateData)
      .eq('id', itemId)
      .eq('user_id', user.id);

    if (error) throw error;

    console.log(`✅ Fixed ${item.nama}:`, updateData);
    return true;
  } catch (error) {
    console.error('❌ Fix failed:', error);
    return false;
  }
};

// Fix all warehouse items with issues
window.fixAllWarehouseItems = async () => {
  if (!window.warehouseItemsWithIssues) {
    return console.error('No analysis data available. Run diagnostic first.');
  }

  console.log(`🔧 Fixing ${window.warehouseItemsWithIssues.length} items...`);

  let fixed = 0;
  let failed = 0;

  for (const item of window.warehouseItemsWithIssues) {
    const success = await window.fixWarehouseItem(item.id);
    if (success) fixed++;
    else failed++;
  }

  console.log(`✅ Fixed: ${fixed}, Failed: ${failed}`);
  
  if (fixed > 0) {
    console.log('🔄 Run diagnostic again to verify fixes');
  }
};

// Recalculate WAC for specific item
window.recalculateWAC = async (itemId) => {
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
      const { error } = await window.supabase
        .from('bahan_baku')
        .update({ 
          harga_rata_rata: newWAC,
          stok: totalQty
        })
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) throw error;

      console.log(`✅ WAC recalculated: ${newWAC.toFixed(2)}, Stock: ${totalQty}`);
      return newWAC;
    } else {
      console.log('⚠️ No purchase data found for WAC calculation');
    }
  } catch (error) {
    console.error('❌ WAC recalculation failed:', error);
  }
};

// Run diagnostic
runWarehouseDiagnostic().then(result => {
  if (result) {
    console.log('\n🎯 SUMMARY:', result);
    
    if (result.itemsWithIssues > 0) {
      console.log('\n💡 NEXT STEPS:');
      console.log('1. Review the items with issues listed above');
      console.log('2. Use fixAllWarehouseItems() to automatically fix all issues');
      console.log('3. Or use fixWarehouseItem(itemId) to fix individual items');
      console.log('4. Run the diagnostic again to verify fixes');
    } else {
      console.log('\n🎉 All warehouse items look good!');
    }
  }
});
