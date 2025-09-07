// Test utility to debug warehouse sync issues
import { PurchaseApiService } from '@/components/purchase/services/purchaseApi';
import { supabase } from '@/integrations/supabase/client';

export const testWarehouseSync = async () => {
  console.log('🧪 [TEST] Starting warehouse sync test...');
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ [TEST] No authenticated user found');
      return;
    }

    console.log('👤 [TEST] Testing with user:', user.id);

    // Get all purchases
    const { data: purchases } = await supabase
      .from('purchases')
      .select(`\n          id,\n          user_id,\n          tanggal,\n          supplier,\n          total_pembelian,\n          status,\n          catatan,\n          created_at,\n          updated_at\n        `)         id,\n          user_id,\n          tanggal,\n          supplier,\n          total_pembelian,\n          status,\n          catatan,\n          created_at,\n          updated_at\n        `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    console.log('📦 [TEST] Found purchases:', purchases?.length || 0);
    
    if (purchases && purchases.length > 0) {
      const testPurchase = purchases[0];
      console.log('🔍 [TEST] Testing with purchase:', testPurchase);
      
      // Try to set status to completed
      console.log('🔄 [TEST] Setting purchase to completed...');
      const result = await PurchaseApiService.setPurchaseStatus(
        testPurchase.id,
        user.id,
        'completed'
      );
      
      if (result.success) {
        con.select(`\n          id,\n          user_id,\n          tanggal,\n          supplier,\n          total_pembelian,\n          status,\n          catatan,\n          created_at,\n          updated_at\n        `)[TEST] Purchase status updated successfully');
        
        // Check warehouse items
        const { data: warehouseItems } = await supabase
          .from('bahan_baku')
          .select(`\n          id,\n          user_id,\n          tanggal,\n          supplier,\n          total_pembelian,\n          status,\n          catatan,\n          created_at,\n          updated_at\n        `)
          .eq('user_id', user.id);
          
        console.log('🏪 [TEST] Warehouse items after sync:', warehouseItems);
      } else {
        console.error('❌ [TEST] Failed to update purchase status:', result.error);
      }
    } else {
      console.log('📭 [TEST] No purchases found to test with');
    }

  } catch (error) {
    console.error('❌ [TEST] Error during test:', error);
  }
};

// Auto-run test on development
if (typeof window !== 'undefined') {
  (window as any).testWarehouseSync = testWarehouseSync;
  console.log('🧪 [TEST] Test utility loaded. Run testWarehouseSync() in console to debug.');
}