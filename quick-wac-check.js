// SIMPLE WAC CHECK - Copy paste ke browser console
console.log('🚀 QUICK WAC CHECK STARTING...');

async function quickWacCheck() {
  try {
    // Get user
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ Authentication failed:', userError);
      return;
    }
    
    console.log(`✅ Logged in as: ${user.email}`);
    
    // 1. CHECK COMPLETED PURCHASES
    const { data: purchases, error: purchaseError } = await window.supabase
      .from('purchases')
      .select('id, supplier, total_nilai, items, tanggal')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('tanggal', { ascending: false });
    
    if (purchaseError) {
      console.error('❌ Error fetching purchases:', purchaseError);
      return;
    }
    
    console.log(`\n📦 PURCHASES STATUS:`);
    console.log(`   ✅ Completed purchases: ${purchases?.length || 0}`);
    
    if (!purchases || purchases.length === 0) {
      console.log('⚠️ No completed purchases found - WAC cannot be calculated');
      console.log('💡 Solution: Create purchases and mark them as "completed"');
      return;
    }
    
    // Show sample purchase
    const samplePurchase = purchases[0];
    console.log(`\n📋 Sample Purchase (${samplePurchase.id}):`);
    console.log(`   Supplier: ${samplePurchase.supplier}`);
    console.log(`   Total: Rp${samplePurchase.total_nilai?.toLocaleString() || 0}`);
    console.log(`   Items count: ${Array.isArray(samplePurchase.items) ? samplePurchase.items.length : 'Invalid'}`);
    
    // 2. CHECK WAREHOUSE ITEMS
    const { data: warehouseItems, error: warehouseError } = await window.supabase
      .from('bahan_baku')
      .select('id, nama, stok, harga_rata_rata, harga_satuan')
      .eq('user_id', user.id)
      .order('nama');
    
    if (warehouseError) {
      console.error('❌ Error fetching warehouse:', warehouseError);
      return;
    }
    
    console.log(`\n🏪 WAREHOUSE STATUS:`);
    console.log(`   📦 Total items: ${warehouseItems?.length || 0}`);
    
    if (!warehouseItems || warehouseItems.length === 0) {
      console.log('⚠️ No warehouse items found');
      return;
    }
    
    // 3. WAC ANALYSIS
    const zeroWacItems = warehouseItems.filter(item => 
      !item.harga_rata_rata || item.harga_rata_rata === 0
    );
    const validWacItems = warehouseItems.filter(item => 
      item.harga_rata_rata && item.harga_rata_rata > 0
    );
    
    console.log(`\n💰 WAC STATUS:`);
    console.log(`   ✅ Items with valid WAC: ${validWacItems.length}`);
    console.log(`   ❌ Items with WAC = 0: ${zeroWacItems.length}`);
    
    if (zeroWacItems.length > 0) {
      console.log(`\n⚠️ ITEMS NEEDING WAC FIX:`);
      zeroWacItems.slice(0, 5).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.nama}: WAC = ${item.harga_rata_rata || 0}, Stock = ${item.stok}`);
      });
      
      if (zeroWacItems.length > 5) {
        console.log(`   ... and ${zeroWacItems.length - 5} more items`);
      }
    }
    
    if (validWacItems.length > 0) {
      console.log(`\n✅ ITEMS WITH VALID WAC (sample):`);
      validWacItems.slice(0, 3).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.nama}: WAC = Rp${item.harga_rata_rata?.toLocaleString()}, Stock = ${item.stok}`);
      });
    }
    
    // 4. QUICK FIX FUNCTION
    if (zeroWacItems.length > 0) {
      console.log(`\n🔧 QUICK FIX AVAILABLE:`);
      console.log(`   Run: quickFixWac() to fix ${zeroWacItems.length} items`);
      
      window.quickFixWac = async () => {
        console.log(`🔄 Fixing WAC for ${zeroWacItems.length} items...`);
        
        let fixed = 0;
        let failed = 0;
        
        for (const item of zeroWacItems) {
          try {
            // Calculate WAC from purchases
            let totalQty = 0;
            let totalValue = 0;
            
            purchases.forEach(purchase => {
              if (Array.isArray(purchase.items)) {
                purchase.items.forEach(pItem => {
                  // Flexible ID matching
                  const itemId = pItem.bahanBakuId || pItem.bahan_baku_id || pItem.id;
                  
                  if (itemId === item.id) {
                    // Flexible field matching
                    const qty = Number(pItem.kuantitas || pItem.jumlah || 0);
                    const price = Number(pItem.hargaSatuan || pItem.harga_per_satuan || pItem.harga_satuan || 0);
                    
                    if (qty > 0 && price > 0) {
                      totalQty += qty;
                      totalValue += qty * price;
                    }
                  }
                });
              }
            });
            
            if (totalQty > 0 && totalValue > 0) {
              const newWac = totalValue / totalQty;
              
              // Update WAC
              const { error } = await window.supabase
                .from('bahan_baku')
                .update({ 
                  harga_rata_rata: newWac,
                  updated_at: new Date().toISOString()
                })
                .eq('id', item.id)
                .eq('user_id', user.id);
              
              if (error) {
                console.error(`❌ Failed to update ${item.nama}:`, error);
                failed++;
              } else {
                console.log(`✅ ${item.nama}: WAC updated to Rp${newWac.toLocaleString()}`);
                fixed++;
              }
            } else {
              console.log(`⏭️ ${item.nama}: No purchase data found, skipped`);
            }
          } catch (error) {
            console.error(`❌ Error processing ${item.nama}:`, error);
            failed++;
          }
        }
        
        console.log(`\n📊 QUICK FIX RESULTS:`);
        console.log(`   ✅ Fixed: ${fixed} items`);
        console.log(`   ❌ Failed: ${failed} items`);
        console.log(`   🎯 WAC should now be calculated correctly!`);
        
        // Verify
        console.log(`\n🔍 Run quickWacCheck() again to verify`);
      };
    } else {
      console.log(`\n🎉 ALL WAC VALUES LOOK GOOD!`);
      console.log(`   No fixes needed`);
    }
    
    // 5. SUMMARY
    console.log(`\n📊 SUMMARY:`);
    console.log(`   📦 Completed purchases: ${purchases.length}`);
    console.log(`   🏪 Warehouse items: ${warehouseItems.length}`);
    console.log(`   ✅ Items with valid WAC: ${validWacItems.length}`);
    console.log(`   ❌ Items needing fix: ${zeroWacItems.length}`);
    
    const healthScore = warehouseItems.length > 0 ? 
      Math.round((validWacItems.length / warehouseItems.length) * 100) : 0;
    
    console.log(`   🏥 WAC Health Score: ${healthScore}%`);
    
    if (healthScore < 50) {
      console.log(`   🚨 WAC system needs attention!`);
    } else if (healthScore < 90) {
      console.log(`   ⚠️ WAC system partially working`);
    } else {
      console.log(`   🎉 WAC system working well!`);
    }
    
    return {
      purchases: purchases.length,
      warehouseItems: warehouseItems.length,
      validWac: validWacItems.length,
      needsFix: zeroWacItems.length,
      healthScore
    };
    
  } catch (error) {
    console.error('❌ Quick check failed:', error);
  }
}

// Run the check
quickWacCheck();

console.log(`\n💡 AVAILABLE COMMANDS:`);
console.log(`   • quickWacCheck() - Run this check again`);
console.log(`   • quickFixWac() - Fix WAC issues (if any found)`);
