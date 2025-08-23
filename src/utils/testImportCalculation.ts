// Test utility untuk menguji automatic price calculation di import

import { supabase } from '@/integrations/supabase/client';
import { PurchaseApiService } from '@/components/purchase/services/purchaseApi';

export const testImportCalculation = async () => {
  console.log('🧪 [TEST IMPORT CALC] Starting automatic price calculation test...');
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ [TEST IMPORT CALC] No authenticated user found');
      return;
    }

    console.log('👤 [TEST IMPORT CALC] Testing with user:', user.id);

    // Test data: import purchase with automatic calculation
    const testImportPurchase = {
      supplier: 'TEST_SUPPLIER',
      tanggal: new Date(),
      totalNilai: 50000, // Total payment: Rp 50,000
      items: [
        {
          bahanBakuId: '',
          nama: 'Test Import Bahan',
          kuantitas: 5, // 5 units
          satuan: 'kg',
          hargaSatuan: 0, // Will be calculated automatically: 50000 ÷ 5 = 10000
          subtotal: 0,
          keterangan: '[TEST] Manual calculation test'
        }
      ],
      status: 'pending' as const,
      metodePerhitungan: 'AVERAGE' as const
    };

    // Calculate what the price should be
    const expectedUnitPrice = testImportPurchase.totalNilai / testImportPurchase.items[0].kuantitas;
    console.log('📊 [TEST IMPORT CALC] Expected calculation:', {
      totalPayment: testImportPurchase.totalNilai,
      quantity: testImportPurchase.items[0].kuantitas,
      expectedUnitPrice: expectedUnitPrice
    });

    // Apply the same calculation logic as import
    const calculatedItems = testImportPurchase.items.map(item => {
      const calculatedUnitPrice = item.kuantitas > 0 
        ? Math.round((testImportPurchase.totalNilai / item.kuantitas) * 100) / 100
        : 0;
        
      const subtotal = item.kuantitas * calculatedUnitPrice;
      
      return {
        ...item,
        hargaSatuan: calculatedUnitPrice,
        subtotal: subtotal,
        keterangan: `[IMPORTED] Harga otomatis: Rp ${testImportPurchase.totalNilai.toLocaleString('id-ID')} ÷ ${item.kuantitas} = Rp ${calculatedUnitPrice.toLocaleString('id-ID')}`
      };
    });

    const finalPurchase = {
      ...testImportPurchase,
      items: calculatedItems
    };

    console.log('🔧 [TEST IMPORT CALC] Purchase with automatic calculation:', finalPurchase);

    // Create the purchase
    const result = await PurchaseApiService.createPurchase(finalPurchase, user.id);
    
    if (result.success && result.purchaseId) {
      console.log('✅ [TEST IMPORT CALC] Purchase created successfully:', result.purchaseId);
      
      // Fetch the created purchase to verify
      const { data: verifyPurchase } = await PurchaseApiService.fetchPurchaseById(result.purchaseId, user.id);
      
      if (verifyPurchase) {
        console.log('🔍 [TEST IMPORT CALC] Verification - created purchase:', {
          id: verifyPurchase.id,
          totalNilai: verifyPurchase.totalNilai,
          items: verifyPurchase.items.map(item => ({
            nama: item.nama,
            kuantitas: item.kuantitas,
            hargaSatuan: item.hargaSatuan,
            subtotal: item.subtotal,
            calculationCheck: item.kuantitas * item.hargaSatuan === item.subtotal ? '✅' : '❌'
          }))
        });

        // Test completing the purchase to trigger warehouse sync
        console.log('🔄 [TEST IMPORT CALC] Testing completion and warehouse sync...');
        const statusResult = await PurchaseApiService.setPurchaseStatus(result.purchaseId, user.id, 'completed');
        
        if (statusResult.success) {
          console.log('✅ [TEST IMPORT CALC] Purchase completed successfully');
          console.log('💡 [TEST IMPORT CALC] Check warehouse items to see if stock was updated with correct WAC');
          
          // Check warehouse for any updates
          const { data: warehouseItems } = await supabase
            .from('bahan_baku')
            .select('*')
            .eq('user_id', user.id);
          
          console.log('🏪 [TEST IMPORT CALC] Current warehouse items:', warehouseItems?.map(item => ({
            id: item.id,
            nama: item.nama,
            stok: item.stok,
            harga: item.harga_satuan,
            wac: item.harga_rata_rata
          })));
          
        } else {
          console.error('❌ [TEST IMPORT CALC] Failed to complete purchase:', statusResult.error);
        }
        
      } else {
        console.error('❌ [TEST IMPORT CALC] Could not verify created purchase');
      }
      
    } else {
      console.error('❌ [TEST IMPORT CALC] Failed to create purchase:', result.error);
    }

  } catch (error) {
    console.error('❌ [TEST IMPORT CALC] Test error:', error);
  }
};

// Test manual vs import comparison
export const testManualVsImportComparison = async () => {
  console.log('🧪 [TEST COMPARISON] Testing manual vs import purchase treatment...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ [TEST COMPARISON] No authenticated user found');
      return;
    }

    // Test data for both manual and import
    const testData = {
      supplier: 'TEST_SUPPLIER',
      tanggal: new Date(),
      totalNilai: 30000,
      quantity: 3,
      expectedUnitPrice: 10000
    };

    // Manual purchase (like from form)
    const manualPurchase = {
      supplier: testData.supplier,
      tanggal: testData.tanggal,
      totalNilai: testData.totalNilai,
      items: [{
        bahanBakuId: '',
        nama: 'Manual Entry Test',
        kuantitas: testData.quantity,
        satuan: 'pcs',
        hargaSatuan: testData.expectedUnitPrice, // Manually calculated in form
        subtotal: testData.quantity * testData.expectedUnitPrice,
        keterangan: '[MANUAL] Manual entry test'
      }],
      status: 'pending' as const,
      metodePerhitungan: 'AVERAGE' as const
    };

    // Imported purchase (with automatic calculation)
    const importedPurchase = {
      supplier: testData.supplier,
      tanggal: testData.tanggal,
      totalNilai: testData.totalNilai,
      items: [{
        bahanBakuId: '',
        nama: 'Import Entry Test',
        kuantitas: testData.quantity,
        satuan: 'pcs',
        hargaSatuan: Math.round((testData.totalNilai / testData.quantity) * 100) / 100, // Auto-calculated
        subtotal: testData.quantity * (testData.totalNilai / testData.quantity),
        keterangan: `[IMPORTED] Harga otomatis: Rp ${testData.totalNilai.toLocaleString('id-ID')} ÷ ${testData.quantity} = Rp ${testData.expectedUnitPrice.toLocaleString('id-ID')}`
      }],
      status: 'pending' as const,
      metodePerhitungan: 'AVERAGE' as const
    };

    console.log('📋 [TEST COMPARISON] Creating manual purchase...');
    const manualResult = await PurchaseApiService.createPurchase(manualPurchase, user.id);
    
    console.log('📋 [TEST COMPARISON] Creating imported purchase...');
    const importResult = await PurchaseApiService.createPurchase(importedPurchase, user.id);

    if (manualResult.success && importResult.success) {
      console.log('✅ [TEST COMPARISON] Both purchases created successfully');
      
      // Compare the results
      const { data: manualData } = await PurchaseApiService.fetchPurchaseById(manualResult.purchaseId!, user.id);
      const { data: importData } = await PurchaseApiService.fetchPurchaseById(importResult.purchaseId!, user.id);
      
      console.log('🔍 [TEST COMPARISON] Comparison results:');
      console.log('Manual Purchase:', {
        id: manualData?.id,
        unitPrice: manualData?.items[0]?.hargaSatuan,
        subtotal: manualData?.items[0]?.subtotal,
        total: manualData?.totalNilai
      });
      console.log('Import Purchase:', {
        id: importData?.id,
        unitPrice: importData?.items[0]?.hargaSatuan,
        subtotal: importData?.items[0]?.subtotal,
        total: importData?.totalNilai
      });
      
      // Check if they're treated the same
      const pricesMatch = manualData?.items[0]?.hargaSatuan === importData?.items[0]?.hargaSatuan;
      const subtotalsMatch = manualData?.items[0]?.subtotal === importData?.items[0]?.subtotal;
      
      console.log('🎯 [TEST COMPARISON] Treatment equality:', {
        pricesMatch: pricesMatch ? '✅' : '❌',
        subtotalsMatch: subtotalsMatch ? '✅' : '❌',
        conclusion: (pricesMatch && subtotalsMatch) ? '✅ SAMA - Import dan manual diperlakukan sama!' : '❌ BEDA - Masih ada perbedaan treatment'
      });
      
    } else {
      console.error('❌ [TEST COMPARISON] Failed to create purchases');
    }

  } catch (error) {
    console.error('❌ [TEST COMPARISON] Test error:', error);
  }
};

// Make functions available globally for easy testing
if (typeof window !== 'undefined') {
  (window as any).testImportCalculation = testImportCalculation;
  (window as any).testManualVsImportComparison = testManualVsImportComparison;
  console.log('🧪 [TEST UTILS] Import calculation test utilities loaded');
  console.log('   Run: testImportCalculation() - Test automatic calculation');
  console.log('   Run: testManualVsImportComparison() - Test manual vs import equality');
}