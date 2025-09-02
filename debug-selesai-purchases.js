// Debug Purchase "Selesai" - Copy ke browser console
console.log('🔍 DEBUGGING PURCHASE SELESAI → WAC...');

async function debugSelesaiPurchases() {
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error('❌ Not authenticated');
      return;
    }
    
    console.log('✅ User:', user.id);
    
    // 1. CHECK STATUS "SELESAI" PURCHASES
    console.log('\n📋 STEP 1: Check "Selesai" purchases...');
    
    // Check different possible status values
    const statusVariations = ['selesai', 'completed', 'Selesai', 'SELESAI'];
    let allPurchases = [];
    
    for (const status of statusVariations) {
      const { data: purchases } = await window.supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', status)
        .order('tanggal', { ascending: false });
      
      if (purchases && purchases.length > 0) {
        console.log(`📦 Found ${purchases.length} purchases with status: "${status}"`);
        allPurchases.push(...purchases.map(p => ({ ...p, statusFound: status })));
      }
    }
    
    if (allPurchases.length === 0) {
      console.log('⚠️ No purchases found with "selesai" status variations');
      
      // Check all purchases to see what status values exist
      const { data: allPurchaseStatuses } = await window.supabase
        .from('purchases')
        .select('status')
        .eq('user_id', user.id);
      
      const uniqueStatuses = [...new Set(allPurchaseStatuses?.map(p => p.status))];
      console.log('📊 All existing status values:', uniqueStatuses);
      return;
    }
    
    console.log(`\n✅ Total "Selesai" purchases found: ${allPurchases.length}`);
    
    // 2. DETAILED PURCHASE ANALYSIS
    console.log('\n📊 STEP 2: Analyze purchase items...');
    
    const samplePurchases = allPurchases.slice(0, 3); // Check first 3
    
    for (const purchase of samplePurchases) {
      console.log(`\n📋 Purchase ${purchase.id} (${purchase.tanggal}):`);
      console.log(`   Status: ${purchase.status} (detected as: ${purchase.statusFound})`);
      console.log(`   Supplier: ${purchase.supplier}`);
      console.log(`   Total: ${purchase.total_nilai}`);
      console.log(`   Items data type: ${typeof purchase.items}`);
      console.log(`   Items:`, purchase.items);
      
      if (purchase.items && Array.isArray(purchase.items)) {
        console.log(`   📦 ${purchase.items.length} items in this purchase:`);
        
        purchase.items.forEach((item, index) => {
          const itemId = item.bahanBakuId || item.bahan_baku_id || item.id;
          const itemName = item.nama || item.namaBarang || 'Unknown';
          const qty = item.kuantitas || item.jumlah || 0;
          const price = item.hargaSatuan || item.harga_satuan || 0;
          
          console.log(`     ${index + 1}. ${itemName}`);
          console.log(`        ID: ${itemId}`);
          console.log(`        Qty: ${qty}`);
          console.log(`        Price: ${price}`);
          console.log(`        Total: ${qty * price}`);
        });
      } else if (purchase.items) {
        console.log('   ⚠️ Items is not an array, trying to parse...');
        try {
          const parsedItems = typeof purchase.items === 'string' ? JSON.parse(purchase.items) : purchase.items;
          console.log('   📦 Parsed items:', parsedItems);
        } catch (e) {
          console.log('   ❌ Failed to parse items:', e.message);
        }
      } else {
        console.log('   ❌ No items found in this purchase');
      }
    }
    
    // 3. CHECK WAREHOUSE ITEMS
    console.log('\n📦 STEP 3: Check warehouse for these items...');
    
    const { data: warehouseItems } = await window.supabase
      .from('bahan_baku')
      .select('id, nama, stok, harga_satuan, harga_rata_rata')
      .eq('user_id', user.id);
    
    console.log(`📊 Found ${warehouseItems?.length || 0} warehouse items`);
    
    // Extract all item IDs from purchases
    const purchaseItemIds = new Set();
    allPurchases.forEach(purchase => {
      if (purchase.items && Array.isArray(purchase.items)) {
        purchase.items.forEach(item => {
          const itemId = item.bahanBakuId || item.bahan_baku_id || item.id;
          if (itemId) purchaseItemIds.add(itemId);
        });
      }
    });
    
    console.log(`🔗 Unique item IDs from purchases: ${purchaseItemIds.size}`);
    console.log('   IDs:', Array.from(purchaseItemIds).slice(0, 5), purchaseItemIds.size > 5 ? '...' : '');
    
    // Check linking
    let linkedItems = 0;
    let unlinkedItems = 0;
    
    purchaseItemIds.forEach(itemId => {
      const warehouseItem = warehouseItems?.find(w => w.id === itemId);
      if (warehouseItem) {
        linkedItems++;
        const hasWAC = warehouseItem.harga_rata_rata && warehouseItem.harga_rata_rata > 0;
        console.log(`   ✅ ${warehouseItem.nama}: WAC=${warehouseItem.harga_rata_rata || 0} ${hasWAC ? '(Good)' : '(No WAC!)'}`);
      } else {
        unlinkedItems++;
        console.log(`   ❌ Item ID ${itemId}: NOT found in warehouse`);
      }
    });
    
    console.log(`\n📊 Linking Analysis:`);
    console.log(`   ✅ Linked items: ${linkedItems}`);
    console.log(`   ❌ Unlinked items: ${unlinkedItems}`);
    
    // 4. MANUAL WAC CALCULATION FOR ONE ITEM
    if (linkedItems > 0) {
      console.log('\n🧮 STEP 4: Manual WAC calculation test...');
      
      // Find a warehouse item that should have purchases
      const testItem = warehouseItems?.find(w => {
        return Array.from(purchaseItemIds).includes(w.id);
      });
      
      if (testItem) {
        console.log(`\n🎯 Testing WAC for: ${testItem.nama} (${testItem.id})`);
        console.log(`   Current WAC: ${testItem.harga_rata_rata || 0}`);
        console.log(`   Current Price: ${testItem.harga_satuan}`);
        console.log(`   Current Stock: ${testItem.stok}`);
        
        // Calculate expected WAC
        let totalQty = 0;
        let totalValue = 0;
        let purchaseCount = 0;
        
        allPurchases.forEach(purchase => {
          if (purchase.items && Array.isArray(purchase.items)) {
            purchase.items.forEach(item => {
              const itemId = item.bahanBakuId || item.bahan_baku_id || item.id;
              if (itemId === testItem.id) {
                const qty = Number(item.kuantitas || item.jumlah || 0);
                const price = Number(item.hargaSatuan || item.harga_satuan || 0);
                totalQty += qty;
                totalValue += qty * price;
                purchaseCount++;
                console.log(`     Purchase ${purchase.id}: +${qty} @ Rp${price} = Rp${qty * price}`);
              }
            });
          }
        });
        
        const expectedWAC = totalQty > 0 ? totalValue / totalQty : 0;
        
        console.log(`\n📊 Expected WAC calculation:`);
        console.log(`   Total purchases: ${purchaseCount}`);
        console.log(`   Total quantity: ${totalQty}`);
        console.log(`   Total value: Rp${totalValue}`);
        console.log(`   Expected WAC: Rp${expectedWAC}`);
        console.log(`   Current WAC: Rp${testItem.harga_rata_rata || 0}`);
        console.log(`   WAC Match: ${Math.abs(expectedWAC - (testItem.harga_rata_rata || 0)) < 0.01 ? '✅ YES' : '❌ NO'}`);
        
        // If WAC doesn't match, offer to fix it
        if (expectedWAC > 0 && Math.abs(expectedWAC - (testItem.harga_rata_rata || 0)) > 0.01) {
          console.log(`\n🔧 WAC mismatch detected! Expected: ${expectedWAC}, Current: ${testItem.harga_rata_rata || 0}`);
          console.log(`   Run: fixWAC('${testItem.id}') to update this item's WAC`);
          
          // Create fix function
          window.fixWAC = async (itemId) => {
            console.log(`🔄 Fixing WAC for item: ${itemId}`)
            
            const { error } = await window.supabase
              .from('bahan_baku')
              .update({ harga_rata_rata: expectedWAC })
              .eq('id', itemId)
              .eq('user_id', user.id);
              
            if (error) {
              console.error('❌ Failed to update WAC:', error);
            } else {
              console.log(`✅ WAC updated to: Rp${expectedWAC}`);
            }
          };
        }
      }
    }
    
    // 5. RECOMMENDATIONS
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('=' .repeat(50));
    
    if (unlinkedItems > 0) {
      console.log('🔧 ISSUE: Some purchase items are not linked to warehouse');
      console.log('   SOLUTION: Check item IDs in purchases match bahan_baku table');
      console.log('   This is why WAC = 0 even though purchases exist');
    }
    
    if (linkedItems > 0) {
      console.log('✅ GOOD: Some items are properly linked');
      console.log('   Your WAC system should work for these items');
    }
    
    console.log('\n🎯 Next steps:');
    console.log('1. Run fixWAC(itemId) for items that need WAC update');
    console.log('2. Check purchase-warehouse linking for unlinked items');
    console.log('3. Verify WAC appears in profit analysis after fixing');
    
    return {
      totalPurchases: allPurchases.length,
      linkedItems,
      unlinkedItems,
      statusFound: [...new Set(allPurchases.map(p => p.statusFound))]
    };
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugSelesaiPurchases();

console.log('\n🎯 Available after debug:');
console.log('• fixWAC(itemId) - Fix WAC for specific item');
console.log('• debugSelesaiPurchases() - Re-run this debug');
