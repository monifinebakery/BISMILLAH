// Debug utility untuk mengecek mengapa harga WAC masih 0

import { supabase } from '@/integrations/supabase/client';

export const debugPriceCalculation = async () => {
  console.log('🔍 [DEBUG] Starting price calculation debugging...');
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ [DEBUG] No authenticated user found');
      return;
    }

    console.log('👤 [DEBUG] User ID:', user.id);

    // 1. Check warehouse items
    console.log('\n📦 [DEBUG] Checking warehouse items...');
    const { data: warehouseItems, error: warehouseError } = await supabase
      .from('bahan_baku')
      .select(`\n          id,\n          -- TODO: Add specific columns for unknown\n        `)         id,\n          -- TODO: Add specific columns for unknown\n        `)
      .eq('user_id', user.id);

    if (warehouseError) {
      console.error('❌ [DEBUG] Error fetching warehouse items:', warehouseError);
      return;
    }

    console.log('📦 [DEBUG] Warehouse items found:', warehouseItems?.length || 0);
    warehouseItems?.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.nama}:`, {
        id: item.id,
        stok: item.stok,
        harga: item.harga_satuan,
        hargaRataRata: item.harga_rata_rata,
        supplier: item.supplier
      });
    });

    // 2. Check purchases
    console.log('\n💰 [DEBUG] Checking purchases...');
    const { data: purch.select(`\n          id,\n          user_id,\n          tanggal,\n          supplier,\n          total_pembelian,\n          status,\n          catatan,\n          created_at,\n          updated_at\n        `) purchaseError } = await supabase
      .from('purchases')
      .select(`\n          id,\n          user_id,\n          tanggal,\n          supplier,\n          total_pembelian,\n          status,\n          catatan,\n          created_at,\n          updated_at\n        `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (purchaseError) {
      console.error('❌ [DEBUG] Error fetching purchases:', purchaseError);
      return;
    }

    console.log('💰 [DEBUG] Purchases found:', purchases?.length || 0);
    
    let completedPurchases = 0;
    let pendingPurchases = 0;
    
    purchases?.forEach((purchase, index) => {
      const items = Array.isArray(purchase.items) ? purchase.items : [];
      console.log(`   ${index + 1}. Purchase ${purchase.id}:`, {
        status: purchase.status,
        totalNilai: purchase.total_nilai,
        itemCount: items.length,
        tanggal: purchase.tanggal
      });

      if (purchase.status === 'completed') {
        completedPurchases++;
      } else {
        pendingPurchases++;
      }

      // Show items in purchase
      items.forEach((item: any, itemIndex: number) => {
        console.log(`      Item ${itemIndex + 1}:`, {
          nama: item.nama || 'No name',
          bahanBakuId: item.bahan_baku_id || item.bahanBakuId || 'No ID',
          jumlah: item.jumlah || item.kuantitas || 0,
          hargaPerSatuan: item.harga_per_satuan || item.hargaSatuan || 0,
          subtotal: item.subtotal || 0
        });
      });
    });

    console.log('\n📊 [DEBUG] Purchase Summary:');
    console.log(`   - Completed: ${completedPurchases}`);
    console.log(`   - Pending: ${pendingPurchases}`);
    console.log(`   - Total: ${purchases?.length || 0}`);

    // 3. Check if warehouse items have matching purchase items
    console.log('\n🔗 [DEBUG] Checking warehouse-purchase relationships...');
    
    if (warehouseItems && purchases) {
      warehouseItems.forEach(warehouseItem => {
        console.log(`\n🏪 [DEBUG] Warehouse item: ${warehouseItem.nama} (${warehouseItem.id})`);
        
        let foundInPurchases = false;
        let totalPurchaseValue = 0;
        let totalPurchaseQty = 0;
        
        purchases.forEach(purchase => {
          if (purchase.status === 'completed' && Array.isArray(purchase.items)) {
            purchase.items.forEach((item: any) => {
              const itemId = item.bahan_baku_id || item.bahanBakuId;
              if (itemId === warehouseItem.id) {
                foundInPurchases = true;
                const qty = Number(item.jumlah || item.kuantitas || 0);
                const price = Number(item.harga_per_satuan || item.hargaSatuan || 0);
                totalPurchaseQty += qty;
                totalPurchaseValue += qty * price;
                
                console.log(`   ✅ Found in purchase ${purchase.id}:`, {
                  qty: qty,
                  unitPrice: price,
                  value: qty * price
                });
              }
            });
          }
        });
        
        if (foundInPurchases) {
          const calculatedWAC = totalPurchaseQty > 0 ? totalPurchaseValue / totalPurchaseQty : 0;
          console.log(`   📈 WAC Calculation:`, {
            totalValue: totalPurchaseValue,
            totalQty: totalPurchaseQty,
            calculatedWAC: calculatedWAC,
            currentWAC: warehouseItem.harga_rata_rata,
            matches: Math.abs(calculatedWAC - (warehouseItem.harga_rata_rata || 0)) < 0.01 ? '✅' : '❌'
          });
        } else {
          console.log(`   ❌ No completed purchases found for this item`);
          console.log(`   💡 Suggestion: Create and complete a purchase for this item`);
        }
      });
    }

    // 4. Suggest next steps
    console.log('\n💡 [DEBUG] Suggestions:');
    
    if (completedPurchases === 0) {
      console.log('   1. ❗ No completed purchases found');
      console.log('   2. 📝 Create a purchase with automatic calculation');
      console.log('   3. ✅ Complete the purchase to trigger WAC calculation');
      console.log('   4. 🔄 Refresh warehouse to see updated prices');
    } else {
      console.log('   1. ✅ Completed purchases exist');
      console.log('   2. 🔄 Check if warehouse sync is working');
      console.log('   3. 🔍 Verify item IDs match between purchases and warehouse');
    }

  } catch (error) {
    console.error('❌ [DEBUG] Error during debugging:', error);
  }
};

// Quick test function for automatic calculation
export const testQuickCalculation = async () => {
  console.log('🧮 [QUICK TEST] Testing automatic price calculation...');
  
  const testCases = [
    { total: 50000, qty: 5, expected: 10000 },
    { total: 75000, qty: 3, expected: 25000 },
    { total: 100000, qty: 10, expected: 10000 },
    { total: 0, qty: 5, expected: 0 },
    { total: 30000, qty: 0, expected: 0 }
  ];

  testCases.forEach((test, index) => {
    const calculated = test.qty > 0 
      ? Math.round((test.total / test.qty) * 100) / 100
      : 0;
    
    const isCorrect = calculated === test.expected;
    
    console.log(`   Test ${index + 1}: ${isCorrect ? '✅' : '❌'}`, {
      input: `Rp ${test.total.toLocaleString('id-ID')} ÷ ${test.qty}`,
      calculated: calculated,
      expected: test.expected,
      status: isCorrect ? 'PASS' : 'FAIL'
    });
  });
};

// Make functions available globally
if (typeof window !== 'undefined') {
  (window as any).debugPriceCalculation = debugPriceCalculation;
  (window as any).testQuickCalculation = testQuickCalculation;
  console.log('🔍 [DEBUG] Price calculation debugging tools loaded');
  console.log('   Run: debugPriceCalculation() - Full system diagnosis');
  console.log('   Run: testQuickCalculation() - Test calculation logic');
}