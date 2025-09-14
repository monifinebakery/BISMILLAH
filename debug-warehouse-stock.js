// Debug Script untuk Masalah Stok Warehouse
// Jalankan script ini di browser console pada halaman warehouse (localhost:5174)

console.log('🔍 Starting Warehouse Stock Debug...');

async function debugWarehouseStock() {
  try {
    // Check if we're authenticated
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error('❌ Not authenticated. Please login first.');
      return;
    }

    console.log('👤 User ID:', user.id);

    // 1. Get all warehouse items
    console.log('\n📦 STEP 1: Fetching warehouse items...');
    const { data: items, error } = await window.supabase
      .from('bahan_baku')
      .select('id, nama, stok, minimum, harga_satuan, supplier, created_at, updated_at')
      .eq('user_id', user.id)
      .order('nama');

    if (error) {
      console.error('❌ Error fetching warehouse items:', error);
      return;
    }

    console.log(`📊 Found ${items?.length || 0} warehouse items`);

    if (!items || items.length === 0) {
      console.log('ℹ️ No warehouse items found.');
      return;
    }

    // 2. Analyze stock data
    console.log('\n🔍 STEP 2: Analyzing stock data...');
    
    const analysis = {
      totalItems: items.length,
      outOfStock: [],
      lowStock: [],
      normalStock: [],
      dataIssues: []
    };

    items.forEach(item => {
      const stok = Number(item.stok) || 0;
      const minimum = Number(item.minimum) || 0;
      
      // Check for data type issues
      if (typeof item.stok !== 'number' && item.stok !== null) {
        analysis.dataIssues.push({
          id: item.id,
          nama: item.nama,
          issue: `Stok bukan number: ${typeof item.stok} (${item.stok})`,
          rawValue: item.stok
        });
      }
      
      // Categorize by stock level
      if (stok <= 0) {
        analysis.outOfStock.push({
          id: item.id,
          nama: item.nama,
          stok: stok,
          minimum: minimum,
          rawStok: item.stok,
          supplier: item.supplier
        });
      } else if (stok <= minimum) {
        analysis.lowStock.push({
          id: item.id,
          nama: item.nama,
          stok: stok,
          minimum: minimum,
          rawStok: item.stok,
          supplier: item.supplier
        });
      } else {
        analysis.normalStock.push({
          id: item.id,
          nama: item.nama,
          stok: stok,
          minimum: minimum,
          rawStok: item.stok,
          supplier: item.supplier
        });
      }
    });

    // 3. Display results
    console.log('\n📋 ANALYSIS RESULTS:');
    console.log('='.repeat(60));
    console.log(`📊 Total Items: ${analysis.totalItems}`);
    console.log(`🔴 Out of Stock: ${analysis.outOfStock.length}`);
    console.log(`🟡 Low Stock: ${analysis.lowStock.length}`);
    console.log(`🟢 Normal Stock: ${analysis.normalStock.length}`);
    console.log(`⚠️ Data Issues: ${analysis.dataIssues.length}`);

    // Show out of stock items
    if (analysis.outOfStock.length > 0) {
      console.log('\n🔴 OUT OF STOCK ITEMS:');
      analysis.outOfStock.forEach(item => {
        console.log(`  • ${item.nama}`);
        console.log(`    - Stok: ${item.stok} (raw: ${item.rawStok})`);
        console.log(`    - Minimum: ${item.minimum}`);
        console.log(`    - Supplier: ${item.supplier || 'N/A'}`);
        console.log(`    - ID: ${item.id}`);
        console.log('');
      });
    }

    // Show data issues
    if (analysis.dataIssues.length > 0) {
      console.log('\n⚠️ DATA TYPE ISSUES:');
      analysis.dataIssues.forEach(issue => {
        console.log(`  • ${issue.nama}: ${issue.issue}`);
        console.log(`    - ID: ${issue.id}`);
        console.log(`    - Raw Value: ${JSON.stringify(issue.rawValue)}`);
        console.log('');
      });
    }

    // 4. Check recent purchases for out of stock items
    if (analysis.outOfStock.length > 0) {
      console.log('\n🛒 STEP 3: Checking recent purchases for out of stock items...');
      
      for (const item of analysis.outOfStock) {
        const { data: purchases, error: purchaseError } = await window.supabase
          .from('purchase_items')
          .select(`
            id, nama, kuantitas, satuan, harga_satuan, subtotal, created_at,
            purchases!inner(id, status, tanggal_pembelian, created_at)
          `)
          .eq('purchases.user_id', user.id)
          .ilike('nama', `%${item.nama}%`)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!purchaseError && purchases && purchases.length > 0) {
          console.log(`\n📦 Recent purchases for "${item.nama}":`);
          purchases.forEach(purchase => {
            console.log(`  • ${purchase.kuantitas} ${purchase.satuan} - ${purchase.purchases.status}`);
            console.log(`    Date: ${new Date(purchase.created_at).toLocaleDateString('id-ID')}`);
            console.log(`    Purchase ID: ${purchase.purchases.id}`);
          });
        } else {
          console.log(`\n📦 No recent purchases found for "${item.nama}"`);
        }
      }
    }

    // Store results globally for further inspection
    window.warehouseDebugResults = analysis;
    
    console.log('\n💡 RECOMMENDATIONS:');
    if (analysis.outOfStock.length > 0) {
      console.log('• Check if recent purchases were properly synced to warehouse');
      console.log('• Verify that purchase completion process updates warehouse stock');
      console.log('• Use fixWarehouseItem(itemId) to manually fix specific items');
    }
    if (analysis.dataIssues.length > 0) {
      console.log('• Fix data type issues in database');
      console.log('• Ensure all stok values are properly stored as numbers');
    }
    
    console.log('\n🔧 Available functions:');
    console.log('• window.warehouseDebugResults - View full analysis results');
    console.log('• debugSpecificItem(itemId) - Debug specific warehouse item');
    
    return analysis;

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Function to debug specific item
window.debugSpecificItem = async (itemId) => {
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error('❌ Not authenticated');
      return;
    }

    // Get item details
    const { data: item, error } = await window.supabase
      .from('bahan_baku')
      .select('*')
      .eq('id', itemId)
      .eq('user_id', user.id)
      .single();

    if (error || !item) {
      console.error('❌ Item not found:', error);
      return;
    }

    console.log('\n🔍 ITEM DETAILS:');
    console.log('='.repeat(40));
    console.log(`Name: ${item.nama}`);
    console.log(`Stock: ${item.stok} (type: ${typeof item.stok})`);
    console.log(`Minimum: ${item.minimum}`);
    console.log(`Unit: ${item.satuan}`);
    console.log(`Price: ${item.harga_satuan}`);
    console.log(`WAC: ${item.harga_rata_rata || 'N/A'}`);
    console.log(`Supplier: ${item.supplier}`);
    console.log(`Created: ${new Date(item.created_at).toLocaleString('id-ID')}`);
    console.log(`Updated: ${new Date(item.updated_at).toLocaleString('id-ID')}`);

    // Get purchase history
    const { data: purchases } = await window.supabase
      .from('purchase_items')
      .select(`
        id, nama, kuantitas, satuan, harga_satuan, subtotal, created_at,
        purchases!inner(id, status, tanggal_pembelian, total_pembelian)
      `)
      .eq('purchases.user_id', user.id)
      .or(`bahan_baku_id.eq.${itemId},nama.ilike.%${item.nama}%`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (purchases && purchases.length > 0) {
      console.log('\n📦 PURCHASE HISTORY:');
      purchases.forEach((purchase, index) => {
        console.log(`${index + 1}. ${purchase.kuantitas} ${purchase.satuan} - ${purchase.purchases.status}`);
        console.log(`   Date: ${new Date(purchase.created_at).toLocaleDateString('id-ID')}`);
        console.log(`   Price: ${purchase.harga_satuan}`);
      });
    } else {
      console.log('\n📦 No purchase history found');
    }

  } catch (error) {
    console.error('❌ Debug specific item error:', error);
  }
};

// Run the debug
debugWarehouseStock().then(result => {
  if (result) {
    console.log('\n✅ Debug completed. Check results above.');
    if (result.outOfStock.length > 0) {
      console.log(`\n🚨 FOUND ${result.outOfStock.length} ITEMS WITH ZERO STOCK!`);
      console.log('This might be the cause of "stok habis" display.');
    }
  }
});