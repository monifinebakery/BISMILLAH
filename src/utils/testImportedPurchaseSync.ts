// Test utility for imported purchase warehouse sync
import { PurchaseApiService } from '@/components/purchase/services/purchaseApi';
import { supabase } from '@/integrations/supabase/client';

export const testImportedPurchaseSync = async () => {
  console.log('🧪 [IMPORTED TEST] Testing imported purchase warehouse sync...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ [IMPORTED TEST] No authenticated user found');
      return;
    }

    // Look for imported purchases (those with [IMPORTED] in item descriptions)
    const { data: purchases } = await supabase
      .from('purchases')
      .select(`\n          id,\n          user_id,\n          tanggal,\n          supplier,\n          total_pembelian,\n          status,\n          catatan,\n          created_at,\n          updated_at\n        `)         id,\n          user_id,\n          tanggal,\n          supplier,\n          total_pembelian,\n          status,\n          catatan,\n          created_at,\n          updated_at\n        `)
      .eq('user_id', user.id);

    if (!purchases || purchases.length === 0) {
      console.log('📭 [IMPORTED TEST] No purchases found');
      return;
    }

    // Find purchases with imported items
    const importedPurchases = purchases.filter(p => {
      const items = p.items || [];
      return items.some((item: any) => 
        typeof item?.keterangan === 'string' && 
        item.keterangan.toUpperCase().includes('IMPORTED')
      );
    });

    console.log('📦 [IMPORTED TEST] Found imported purchases:', importedPurchases.length);

    if (importedPurchases.length === 0) {
      console.log('💡 [IMPORTED TEST] No imported purchases found. Creating test purchase...');
      await createTestImportedPurchase(user.id);
      return;
    }

    const testPurchase = importedPurchases[0];
    console.log('🔍 [IMPORTED TEST] Testing with purchase:', testPurchase.select(`\n          id,\n          user_id,\n          tanggal,\n          supplier,\n          total_pembelian,\n          status,\n          catatan,\n          created_at,\n          updated_at\n        `)nsole.log('🔍 [IMPORTED TEST] Purchase items:', testPurchase.items);

    // Check warehouse before
    const { data: warehouseBefore } = await supabase
      .from('bahan_baku')
      .select(`\n          id,\n          user_id,\n          tanggal,\n          supplier,\n          total_pembelian,\n          status,\n          catatan,\n          created_at,\n          updated_at\n        `)
      .eq('user_id', user.id);
    
    console.log('🏪 [IMPORTED TEST] Warehouse before:', warehouseBefore?.map(item => ({
      id: item.id,
      nama: item.nama,
      stok: item.stok
    })));

    // Set to pending first, then to completed to test the manual sync
    console.log('🔄 [IMPORTED TEST] Setting purchase to pending first...');
    await PurchaseApiService.setPurchaseStatus(testPurchase.id, user.id, 'pending');
    
    console.log('🔄 [IMPORTED TEST] Now setting purchase to completed (should force sync)...');
    const result = await PurchaseApiS.select(`\n          id,\n          user_id,\n          tanggal,\n          supplier,\n          total_pembelian,\n          status,\n          catatan,\n          created_at,\n          updated_at\n        `)rchaseStatus(testPurchase.id, user.id, 'completed');
    
    if (result.success) {
      console.log('✅ [IMPORTED TEST] Status updated successfully');
      
      // Wait a moment for sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check warehouse after
      const { data: warehouseAfter } = await supabase
        .from('bahan_baku')
        .select(`\n          id,\n          user_id,\n          tanggal,\n          supplier,\n          total_pembelian,\n          status,\n          catatan,\n          created_at,\n          updated_at\n        `)
        .eq('user_id', user.id);
      
      console.log('🏪 [IMPORTED TEST] Warehouse after:', warehouseAfter?.map(item => ({
        id: item.id,
        nama: item.nama,
        stok: item.stok
      })));
      
      // Compare changes
      if (warehouseBefore && warehouseAfter) {
        let hasChanges = false;
        warehouseAfter.forEach(after => {
          const before = warehouseBefore.find(b => b.id === after.id);
          if (before && before.stok !== after.stok) {
            console.log(`✅ [IMPORTED TEST] Stock updated: ${after.nama} ${before.stok} -> ${after.stok}`);
            hasChanges = true;
          }
        });
        
        if (!hasChanges) {
   .select(`\n          id,\n          user_id,\n          tanggal,\n          supplier,\n          total_pembelian,\n          status,\n          catatan,\n          created_at,\n          updated_at\n        `)le.warn('⚠️ [IMPORTED TEST] No stock changes detected - sync may have failed');
        }
      }
      
    } else {
      console.error('❌ [IMPORTED TEST] Failed to update status:', result.error);
    }

  } catch (error) {
    console.error('❌ [IMPORTED TEST] Error during test:', error);
  }
};

const createTestImportedPurchase = async (userId: string) => {
  console.log('🛠️ [IMPORTED TEST] Creating test imported purchase...');
  
  try {
    // Get or create a warehouse item to test with
    let { data: warehouseItem } = await supabase
      .from('bahan_baku')
      .select(`\n          id,\n          user_id,\n          tanggal,\n          supplier,\n          total_pembelian,\n          status,\n          catatan,\n          created_at,\n          updated_at\n        `)
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (!warehouseItem) {
      // Create a test item first
      const { data: newItem } = await supabase
        .from('bahan_baku')
        .insert({
          user_id: userId,
          nama: 'Test Item for Import',
          kategori: 'Test',
          stok: 10,
          satuan: 'kg',
          minimum: 5,
          harga_satuan: 1000,
          harga_rata_rata: 1000
        })
        .select()
        .single();
      
      warehouseItem = newItem;
    }

    if (!warehouseItem) {
      console.error('❌ [IMPORTED TEST] Could not create test warehouse item');
      return;
    }

    // Create test imported purchase
    const testPurchase = {
      supplier: 'Test Supplier',
      tanggal: new Date(),
      total_nilai: 5000,
      items: [{
        bahanBakuId: warehouseItem.id,
        nama: warehouseItem.nama,
        kuantitas: 5,
        satuan: warehouseItem.satuan,
        hargaSatuan: 1000,
        subtotal: 5000,
        keterangan: '[IMPORTED] Test imported item'
      }],
      status: 'pending' as const,
      metode_perhitungan: 'AVERAGE' as const
    };

    const result = await PurchaseApiService.createPurchase(testPurchase, userId);
    
    if (result.success) {
      console.log('✅ [IMPORTED TEST] Test imported purchase created:', result.purchaseId);
      console.log('💡 [IMPORTED TEST] Run testImportedPurchaseSync() again to test it');
    } else {
      console.error('❌ [IMPORTED TEST] Failed to create test purchase:', result.error);
    }

  } catch (error) {
    console.error('❌ [IMPORTED TEST] Error creating test purchase:', error);
  }
};

// Make available in window for easy testing
if (typeof window !== 'undefined') {
  (window as any).testImportedPurchaseSync = testImportedPurchaseSync;
  console.log('🧪 [IMPORTED TEST] Imported purchase test utility loaded');
}