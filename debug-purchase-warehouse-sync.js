// Debug script untuk purchase-warehouse sync
// Cek apakah stok ter-update saat purchase status berubah ke completed

import { supabase } from './src/integrations/supabase/client.js';

async function debugPurchaseWarehouseSync() {
  console.log('🔍 [DEBUG] Starting purchase-warehouse sync debug...');
  
  try {
    // 1. Get latest purchase
    const { data: purchases, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (purchaseError) {
      console.error('❌ Error fetching purchases:', purchaseError);
      return;
    }
    
    console.log('📦 Latest purchases:', purchases?.map(p => ({
      id: p.id,
      supplier: p.supplier,
      status: p.status,
      total_nilai: p.total_nilai,
      itemCount: Array.isArray(p.items) ? p.items.length : 0
    })));
    
    // 2. Get warehouse items
    const { data: warehouseItems, error: warehouseError } = await supabase
      .from('bahan_baku')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(10);
    
    if (warehouseError) {
      console.error('❌ Error fetching warehouse items:', warehouseError);
      return;
    }
    
    console.log('🏪 Latest warehouse items:', warehouseItems?.map(w => ({
      id: w.id,
      nama: w.nama,
      stok: w.stok,
      harga_satuan: w.harga_satuan,
      harga_rata_rata: w.harga_rata_rata,
      supplier: w.supplier,
      updated_at: w.updated_at
    })));
    
    // 3. Find a completed purchase and check if warehouse was updated
    const completedPurchases = purchases?.filter(p => p.status === 'completed') || [];
    console.log('✅ Completed purchases:', completedPurchases.length);
    
    if (completedPurchases.length > 0) {
      const purchase = completedPurchases[0];
      console.log('🔍 Analyzing completed purchase:', {
        id: purchase.id,
        supplier: purchase.supplier,
        status: purchase.status,
        items: purchase.items
      });
      
      // Check each item in the purchase
      if (Array.isArray(purchase.items)) {
        for (const item of purchase.items) {
          console.log('📋 Purchase item:', {
            bahanBakuId: item.bahan_baku_id || item.bahanBakuId,
            nama: item.nama,
            quantity: item.quantity || item.jumlah,
            unitPrice: item.unit_price || item.unitPrice,
            subtotal: item.subtotal
          });
          
          // Find corresponding warehouse item
          const warehouseItem = warehouseItems?.find(w => 
            w.id === (item.bahan_baku_id || item.bahanBakuId) ||
            w.nama.toLowerCase().trim() === item.nama?.toLowerCase().trim()
          );
          
          if (warehouseItem) {
            console.log('🏪 Corresponding warehouse item:', {
              id: warehouseItem.id,
              nama: warehouseItem.nama,
              stok: warehouseItem.stok,
              harga_rata_rata: warehouseItem.harga_rata_rata,
              updated_at: warehouseItem.updated_at
            });
            
            // Check if warehouse was updated after purchase completion
            const purchaseUpdated = new Date(purchase.updated_at);
            const warehouseUpdated = new Date(warehouseItem.updated_at);
            
            console.log('📅 Timestamp comparison:', {
              purchaseUpdated: purchaseUpdated.toISOString(),
              warehouseUpdated: warehouseUpdated.toISOString(),
              warehouseUpdatedAfterPurchase: warehouseUpdated > purchaseUpdated
            });
            
          } else {
            console.log('⚠️ No corresponding warehouse item found for:', item.nama);
          }
        }
      }
    }
    
    // 4. Check for pending purchases that we can test with
    const pendingPurchases = purchases?.filter(p => p.status === 'pending') || [];
    console.log('⏳ Pending purchases available for testing:', pendingPurchases.length);
    
    if (pendingPurchases.length > 0) {
      console.log('🧪 Test candidate:', {
        id: pendingPurchases[0].id,
        supplier: pendingPurchases[0].supplier,
        items: pendingPurchases[0].items?.length || 0
      });
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  debugPurchaseWarehouseSync();
}

export { debugPurchaseWarehouseSync };