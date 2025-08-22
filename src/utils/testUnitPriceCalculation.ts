// Test utility to verify automatic unit price calculation from purchases
import { PurchaseApiService } from '@/components/purchase/services/purchaseApi';
import { supabase } from '@/integrations/supabase/client';
import { generateUUID } from '@/utils/uuid';

export const testUnitPriceCalculation = async () => {
  console.log('🧪 [UNIT PRICE TEST] Testing automatic unit price calculation...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ [UNIT PRICE TEST] No authenticated user found');
      return;
    }

    console.log('👤 [UNIT PRICE TEST] Testing with user:', user.id);

    // Create a test warehouse item or use existing one
    let testItemId = generateUUID();
    let testItemName = `Test Item ${Date.now()}`;
    
    // Check if we have any existing warehouse items
    const { data: existingItems } = await supabase
      .from('bahan_baku')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    if (existingItems && existingItems.length > 0) {
      testItemId = existingItems[0].id;
      testItemName = existingItems[0].nama;
      console.log('🔍 [UNIT PRICE TEST] Using existing warehouse item:', testItemName);
    } else {
      // Create a new test item
      const { error: createError } = await supabase
        .from('bahan_baku')
        .insert({
          id: testItemId,
          user_id: user.id,
          nama: testItemName,
          kategori: 'Test',
          stok: 0,
          satuan: 'kg',
          minimum: 5,
          harga_satuan: 0, // Start with zero price
          harga_rata_rata: 0
        });
      
      if (createError) {
        console.error('❌ [UNIT PRICE TEST] Failed to create test item:', createError);
        return;
      }
      console.log('✅ [UNIT PRICE TEST] Created test warehouse item:', testItemName);
    }

    // Get initial warehouse state
    const { data: beforeItem } = await supabase
      .from('bahan_baku')
      .select('*')
      .eq('id', testItemId)
      .eq('user_id', user.id)
      .single();

    console.log('📋 [UNIT PRICE TEST] Initial warehouse state:', {
      nama: beforeItem?.nama,
      stok: beforeItem?.stok,
      harga_satuan: beforeItem?.harga_satuan,
      harga_rata_rata: beforeItem?.harga_rata_rata
    });

    // Test case: Buy 10 kg for Rp 50,000 total
    // Expected unit price: 50,000 / 10 = 5,000 per kg
    const testQuantity = 10;
    const testTotalPayment = 50000;
    const expectedUnitPrice = testTotalPayment / testQuantity; // 5,000

    const testPurchase = {
      supplier: 'Test Supplier',
      tanggal: new Date(),
      totalNilai: testTotalPayment,
      items: [{
        bahanBakuId: testItemId,
        nama: testItemName,
        kuantitas: testQuantity,
        satuan: 'kg',
        hargaSatuan: expectedUnitPrice, // This should be calculated as total / quantity
        subtotal: testTotalPayment,
        keterangan: '[UNIT PRICE TEST] Testing automatic calculation'
      }],
      status: 'pending' as const,
      metodePerhitungan: 'AVERAGE' as const
    };

    console.log('💰 [UNIT PRICE TEST] Test case:', {
      totalPayment: testTotalPayment,
      quantity: testQuantity,
      expectedUnitPrice: expectedUnitPrice,
      description: `Buy ${testQuantity} kg for Rp ${testTotalPayment.toLocaleString()}`
    });

    // Create the purchase
    const createResult = await PurchaseApiService.createPurchase(testPurchase, user.id);
    
    if (!createResult.success || !createResult.purchaseId) {
      console.error('❌ [UNIT PRICE TEST] Failed to create purchase:', createResult.error);
      return;
    }

    console.log('✅ [UNIT PRICE TEST] Purchase created:', createResult.purchaseId);

    // Complete the purchase to trigger warehouse sync
    console.log('🔄 [UNIT PRICE TEST] Completing purchase to trigger warehouse sync...');
    const completeResult = await PurchaseApiService.setPurchaseStatus(
      createResult.purchaseId,
      user.id,
      'completed'
    );

    if (!completeResult.success) {
      console.error('❌ [UNIT PRICE TEST] Failed to complete purchase:', completeResult.error);
      return;
    }

    console.log('✅ [UNIT PRICE TEST] Purchase completed successfully');

    // Wait a moment for the sync to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check the warehouse item after sync
    const { data: afterItem } = await supabase
      .from('bahan_baku')
      .select('*')
      .eq('id', testItemId)
      .eq('user_id', user.id)
      .single();

    console.log('📋 [UNIT PRICE TEST] Final warehouse state:', {
      nama: afterItem?.nama,
      stok: afterItem?.stok,
      harga_satuan: afterItem?.harga_satuan,
      harga_rata_rata: afterItem?.harga_rata_rata
    });

    // Verify the results
    const stockChanged = (afterItem?.stok || 0) > (beforeItem?.stok || 0);
    const unitPriceSet = (afterItem?.harga_satuan || 0) > 0;
    const wacSet = (afterItem?.harga_rata_rata || 0) > 0;
    const priceMatches = Math.abs((afterItem?.harga_satuan || 0) - expectedUnitPrice) < 0.01;
    const wacMatches = Math.abs((afterItem?.harga_rata_rata || 0) - expectedUnitPrice) < 0.01;

    console.log('🧪 [UNIT PRICE TEST] Results Summary:');
    console.log(`  ✅ Stock increased: ${stockChanged} (${beforeItem?.stok || 0} → ${afterItem?.stok || 0})`);
    console.log(`  ✅ Unit price set: ${unitPriceSet} (${afterItem?.harga_satuan || 0})`);
    console.log(`  ✅ WAC set: ${wacSet} (${afterItem?.harga_rata_rata || 0})`);
    console.log(`  ✅ Price calculation correct: ${priceMatches} (expected: ${expectedUnitPrice}, actual: ${afterItem?.harga_satuan || 0})`);
    console.log(`  ✅ WAC calculation correct: ${wacMatches} (expected: ${expectedUnitPrice}, actual: ${afterItem?.harga_rata_rata || 0})`);

    const allTestsPassed = stockChanged && unitPriceSet && wacSet && priceMatches && wacMatches;

    if (allTestsPassed) {
      console.log('🎉 [UNIT PRICE TEST] ALL TESTS PASSED! Unit price calculation is working correctly.');
    } else {
      console.log('❌ [UNIT PRICE TEST] Some tests failed. The fix may need further investigation.');
    }

    return {
      success: allTestsPassed,
      results: {
        stockChanged,
        unitPriceSet,
        wacSet,
        priceMatches,
        wacMatches,
        expectedUnitPrice,
        actualUnitPrice: afterItem?.harga_satuan || 0,
        actualWac: afterItem?.harga_rata_rata || 0
      }
    };

  } catch (error) {
    console.error('❌ [UNIT PRICE TEST] Error during test:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testUnitPriceCalculation = testUnitPriceCalculation;
}