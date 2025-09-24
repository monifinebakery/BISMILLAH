// Debug script to check and fix warehouse prices
import { supabase } from '/src/integrations/supabase/client.js';

export async function debugAndFixWarehousePrices() {
  console.log('🔧 DEBUG & FIX WAREHOUSE PRICES...');

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No user logged in');
      return;
    }

    console.log('🔍 Checking warehouse data for user:', user.id);

    // 1. Check raw DB data
    console.log('📊 Step 1: Checking raw database data...');
    const { data: rawData, error: rawError } = await supabase
      .from('bahan_baku')
      .select('*')
      .eq('user_id', user.id)
      .limit(10);

    if (rawError) {
      console.error('❌ Error fetching raw data:', rawError);
    } else {
      console.log('📊 RAW DATABASE DATA:', rawData);
      rawData?.forEach(item => {
        console.log(`🏷️ ${item.nama}: harga_satuan=${item.harga_satuan}, harga_rata_rata=${item.harga_rata_rata}`);
      });
    }

    // 2. Check if any items need price fixes
    const itemsWithoutPrice = rawData?.filter(item => !item.harga_satuan || item.harga_satuan === 0) || [];

    if (itemsWithoutPrice.length > 0) {
      console.log('🚨 FOUND ITEMS WITHOUT PRICES - NEED TO FIX:');
      itemsWithoutPrice.forEach(item => {
        console.log(`   - ${item.nama} (ID: ${item.id})`);
      });

      // Try to fix by setting a default price
      console.log('🔧 Attempting to fix prices...');
      for (const item of itemsWithoutPrice) {
        const defaultPrice = 10000; // Default price
        console.log(`   Setting ${item.nama} price to ${defaultPrice}...`);

        const { error: updateError } = await supabase
          .from('bahan_baku')
          .update({ harga_satuan: defaultPrice })
          .eq('id', item.id)
          .eq('user_id', user.id);

        if (updateError) {
          console.error(`❌ Failed to update ${item.nama}:`, updateError);
        } else {
          console.log(`✅ Successfully updated ${item.nama}`);
        }
      }
    } else {
      console.log('✅ All items have valid prices!');
    }

    // 3. Check final state
    console.log('📊 Step 3: Checking final state...');
    const { data: finalData } = await supabase
      .from('bahan_baku')
      .select('*')
      .eq('user_id', user.id)
      .limit(10);

    console.log('📊 FINAL DATABASE DATA:', finalData);
    finalData?.forEach(item => {
      console.log(`🏷️ ${item.nama}: harga_satuan=${item.harga_satuan}`);
    });

    console.log('🎉 WAREHOUSE PRICE CHECK COMPLETE!');
    console.log('💡 Try refreshing the recipe page to see updated prices.');

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

// Run if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - attach to window for console access
  (window as any).debugAndFixWarehousePrices = debugAndFixWarehousePrices;
  console.log('🔧 Debug function available: window.debugAndFixWarehousePrices()');
}
