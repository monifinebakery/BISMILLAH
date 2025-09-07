// Test WAC Fix - Copy ke browser console
console.log('🧪 TESTING WAC FIX...');

async function testWacFix() {
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error('❌ Not authenticated');
      return;
    }
    
    console.log('✅ User:', user.id);
    
    // 1. CHECK COMPLETED PURCHASES
    console.log('\n📋 STEP 1: Get completed purchases...');
    
    const { data: purchases, error: purchaseError } = await window.supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('tanggal', { ascending: false })
      .limit(5);
    
    if (purchaseError) {
      console.error('❌ Error fetching purchases:', purchaseError);
      return;
    }
    
    if (!purchases || purchases.length === 0) {
      console.log('⚠️ No completed purchases found. Creating test data...');
      return;
    }
    
    console.log(`✅ Found ${purchases.length} completed purchases`);
    
    // 2. ANALYZE PURCHASE ITEMS STRUCTURE
    console.log('\n📊 STEP 2: Analyze purchase items structure...');
    
    const samplePurchase = purchases[0];
    console.log(`\n📋 Sample Purchase: ${samplePurchase.id}`);
    console.log(`   Supplier: ${samplePurchase.supplier}`);
    console.log(`   Total: ${samplePurchase.total_nilai}`);
    console.log(`   Items:`, samplePurchase.items);
    
    if (samplePurchase.items && Array.isArray(samplePurchase.items)) {
      console.log(`\n   📦 Items breakdown:`);
      samplePurchase.items.forEach((item, index) => {
        console.log(`     ${index + 1}. Item analysis:`);
        
        // Test field variations
        const itemId = item.bahanBakuId || item.bahan_baku_id || item.id;
        const qty = item.kuantitas || item.jumlah || 0;
        const price = item.hargaSatuan || item.harga_per_satuan || item.harga_satuan || 0;
        
        console.log(`        ID variations: bahanBakuId=${item.bahanBakuId}, bahan_baku_id=${item.bahan_baku_id}, id=${item.id}`);
        console.log(`        QTY variations: kuantitas=${item.kuantitas}, jumlah=${item.jumlah}`);
        console.log(`        PRICE variations: hargaSatuan=${item.hargaSatuan}, harga_per_satuan=${item.harga_per_satuan}, harga_satuan=${item.harga_satuan}`);
        console.log(`        RESOLVED: ID=${itemId}, QTY=${qty}, PRICE=${price}`);
        console.log(`        NAME: ${item.nama || item.namaBarang || 'Unknown'}`);
      });
    }
    
    // 3. MANUAL WAC RECALCULATION TEST
    console.log('\n🧮 STEP 3: Manual WAC recalculation test...');
    
    // Get warehouse items
    const { data: warehouseItems, error: warehouseError } = await window.supabase
      .from('bahan_baku')
      .select('*')
      .eq('user_id', user.id)
      .limit(3);
    
    if (warehouseError) {
      console.error('❌ Error fetching warehouse items:', warehouseError);
      return;
    }
    
    if (!warehouseItems || warehouseItems.length === 0) {
      console.log('⚠️ No warehouse items found');
      return;
    }
    
    console.log(`✅ Testing WAC calculation for ${warehouseItems.length} items`);
    
    // Test fixed WAC calculation logic
    const testItem = warehouseItems[0];
    console.log(`\n🎯 Testing: ${testItem.nama} (${testItem.id})`);
    console.log(`   Current WAC: ${testItem.harga_rata_rata || 0}`);
    console.log(`   Current Stock: ${testItem.stok}`);
    
    // Calculate expected WAC using FIXED logic
    let totalQuantity = 0;
    let totalValue = 0;
    let purchaseCount = 0;
    
    purchases.forEach(purchase => {
      if (purchase.items && Array.isArray(purchase.items)) {
        purchase.items.forEach((item) => {
          // ✅ FIXED FLEXIBLE ID MATCHING
          const itemId = item.bahanBakuId || item.bahan_baku_id || item.id;
          
          if (itemId === testItem.id) {
            // ✅ FIXED FLEXIBLE FIELD MATCHING
            const qty = Number(item.kuantitas || item.jumlah || 0);
            const price = Number(
              item.hargaSatuan || 
              item.harga_per_satuan || 
              item.harga_satuan || 
              0
            );
            
            if (qty > 0 && price > 0) {
              totalQuantity += qty;
              totalValue += qty * price;
              purchaseCount++;
              console.log(`     ✅ Purchase ${purchase.id}: +${qty} @ Rp${price} = Rp${qty * price}`);
            }
          }
        });
      }
    });
    
    const expectedWAC = totalQuantity > 0 ? totalValue / totalQuantity : testItem.harga_satuan || 0;
    
    console.log(`\n📊 WAC Calculation Result:`);
    console.log(`   Purchases found: ${purchaseCount}`);
    console.log(`   Total quantity: ${totalQuantity}`);
    console.log(`   Total value: Rp${totalValue}`);
    console.log(`   Expected WAC: Rp${expectedWAC}`);
    console.log(`   Current WAC: Rp${testItem.harga_rata_rata || 0}`);
    
    const wacMatch = Math.abs(expectedWAC - (testItem.harga_rata_rata || 0)) < 0.01;
    console.log(`   WAC Status: ${wacMatch ? '✅ MATCHES' : '❌ MISMATCH'}`);
    
    // 4. AUTOMATIC FIX IF NEEDED
    if (!wacMatch && expectedWAC > 0) {
      console.log(`\n🔧 STEP 4: Applying WAC fix...`);
      
      const { error: updateError } = await window.supabase
        .from('bahan_baku')
        .update({ 
          harga_rata_rata: expectedWAC,
          updated_at: new Date().toISOString()
        })
        .eq('id', testItem.id)
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('❌ Failed to update WAC:', updateError);
      } else {
        console.log(`✅ WAC FIXED! Updated from Rp${testItem.harga_rata_rata || 0} to Rp${expectedWAC}`);
        
        // Verify fix
        const { data: updatedItem } = await window.supabase
          .from('bahan_baku')
          .select('harga_rata_rata')
          .eq('id', testItem.id)
          .eq('user_id', user.id)
          .single();
        
        console.log(`✅ Verification: New WAC = Rp${updatedItem?.harga_rata_rata || 0}`);
      }
    } else if (expectedWAC === 0) {
      console.log('ℹ️ No valid purchase data found for WAC calculation');
    } else {
      console.log('✅ WAC is already correct, no fix needed');
    }
    
    // 5. BULK FIX FOR ALL ITEMS
    console.log('\n🔄 STEP 5: Offer bulk WAC recalculation...');
    
    window.runBulkWacFix = async () => {
      console.log('🔄 Running bulk WAC recalculation...');
      
      let fixedCount = 0;
      let skippedCount = 0;
      
      for (const item of warehouseItems) {
        let itemTotalQty = 0;
        let itemTotalValue = 0;
        
        purchases.forEach(purchase => {
          if (purchase.items && Array.isArray(purchase.items)) {
            purchase.items.forEach((purchaseItem) => {
              const itemId = purchaseItem.bahanBakuId || purchaseItem.bahan_baku_id || purchaseItem.id;
              
              if (itemId === item.id) {
                const qty = Number(purchaseItem.kuantitas || purchaseItem.jumlah || 0);
                const price = Number(
                  purchaseItem.hargaSatuan || 
                  purchaseItem.harga_per_satuan || 
                  purchaseItem.harga_satuan || 
                  0
                );
                
                if (qty > 0 && price > 0) {
                  itemTotalQty += qty;
                  itemTotalValue += qty * price;
                }
              }
            });
          }
        });
        
        const newWac = itemTotalQty > 0 ? itemTotalValue / itemTotalQty : item.harga_satuan || 0;
        const currentWac = item.harga_rata_rata || 0;
        
        if (Math.abs(newWac - currentWac) > 0.01 && newWac > 0) {
          const { error: updateError } = await window.supabase
            .from('bahan_baku')
            .update({ 
              harga_rata_rata: newWac,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id)
            .eq('user_id', user.id);
          
          if (!updateError) {
            console.log(`✅ ${item.nama}: WAC updated from ${currentWac} to ${newWac}`);
            fixedCount++;
          } else {
            console.error(`❌ ${item.nama}: Failed to update WAC`);
          }
        } else {
          skippedCount++;
        }
      }
      
      console.log(`\n📊 Bulk WAC Fix Results:`);
      console.log(`   ✅ Fixed: ${fixedCount} items`);
      console.log(`   ⏭️ Skipped: ${skippedCount} items`);
      console.log(`   🎯 Total processed: ${warehouseItems.length} items`);
    };
    
    console.log('\n💡 Available Commands:');
    console.log('• runBulkWacFix() - Fix WAC for all warehouse items');
    
    return {
      purchasesFound: purchases.length,
      warehouseItems: warehouseItems.length,
      testItem: testItem.nama,
      wacFixed: !wacMatch && expectedWAC > 0
    };
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testWacFix();

console.log('\n🎯 Test completed! Use runBulkWacFix() if needed.');
