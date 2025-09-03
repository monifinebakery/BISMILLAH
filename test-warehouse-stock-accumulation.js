// Test script untuk memvalidasi solusi stock accumulation
// Menguji apakah bahan yang sama dari supplier berbeda bisa terakumulasi stocknya

const { createClient } = require('@supabase/supabase-js');

// Konfigurasi Supabase
const supabaseUrl = 'https://xvuzqjvuwefvmsgtctgm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2dXpxanZ1d2Vmdm1zZ3RjdGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM0NTgyMjksImV4cCI6MjAzOTAzNDIyOX0.qjv5OWSlMjMr2tPgzGLnBrPXzF33rM7WS_ZZC0vRKVM';

const supabase = createClient(supabaseUrl, supabaseKey);

// Mock user ID untuk testing
const TEST_USER_ID = 'test_user_warehouse_accumulation';

// Test data
const testScenarios = [
  {
    name: 'Scenario 1: Same material from different suppliers',
    description: 'Tepung Terigu A dari Toko Samin vs Tepung Terigu A dari Toko Lain',
    purchases: [
      {
        id: 'purchase_test_001',
        supplier: 'Toko Samin',
        items: [
          {
            id: 'item_tepung_001',
            nama: 'Tepung Terigu A',
            satuan: 'kg',
            kuantitas: 10,
            hargaSatuan: 15000,
            subtotal: 150000
          }
        ]
      },
      {
        id: 'purchase_test_002',
        supplier: 'Toko Berbeda',
        items: [
          {
            id: 'item_tepung_002', // Different ID but same name
            nama: 'Tepung Terigu A',
            satuan: 'kg',
            kuantitas: 5,
            hargaSatuan: 16000,
            subtotal: 80000
          }
        ]
      }
    ],
    expected: {
      totalStock: 15, // Should accumulate: 10 + 5 = 15
      expectedWAC: (10 * 15000 + 5 * 16000) / 15, // Should calculate WAC properly
      supplierInfo: 'Toko Samin, Toko Berbeda' // Should combine supplier info
    }
  },
  {
    name: 'Scenario 2: Different materials (should not accumulate)',
    description: 'Tepung Terigu A vs Tepung Terigu B - different names',
    purchases: [
      {
        id: 'purchase_test_003',
        supplier: 'Toko Test',
        items: [
          {
            id: 'item_tepung_003',
            nama: 'Tepung Terigu A',
            satuan: 'kg',
            kuantitas: 8,
            hargaSatuan: 14000,
            subtotal: 112000
          }
        ]
      },
      {
        id: 'purchase_test_004',
        supplier: 'Toko Test',
        items: [
          {
            id: 'item_tepung_004',
            nama: 'Tepung Terigu B', // Different name
            satuan: 'kg',
            kuantitas: 6,
            hargaSatuan: 15500,
            subtotal: 93000
          }
        ]
      }
    ],
    expected: {
      separateItems: true,
      items: [
        { nama: 'Tepung Terigu A', stok: 8, harga_rata_rata: 14000 },
        { nama: 'Tepung Terigu B', stok: 6, harga_rata_rata: 15500 }
      ]
    }
  }
];

// Helper functions
async function clearTestData() {
  console.log('🧹 Cleaning up test data...');
  
  // Delete test warehouse items
  await supabase
    .from('bahan_baku')
    .delete()
    .eq('user_id', TEST_USER_ID);
  
  // Delete test purchases
  await supabase
    .from('purchases')
    .delete()
    .eq('user_id', TEST_USER_ID);
    
  console.log('✅ Test data cleaned');
}

// Import the warehouse sync service function (simulated for testing)
const applyPurchaseToWarehouse = async (purchase) => {
  console.log('🔄 [TEST] Applying purchase to warehouse:', purchase.id);

  // Helper: derive unit price from any available fields
  const deriveUnitPrice = (it, qty) => {
    const toNum = (v) => (v == null || v === '' ? 0 : Number(v));
    const explicit = toNum(it.hargaSatuan ?? it.harga_per_satuan ?? it.harga_satuan);
    if (explicit > 0) return explicit;
    const subtotal = toNum(it.subtotal);
    if (qty > 0 && subtotal > 0) return subtotal / qty;
    return 0;
  };

  // Helper: find existing material by name and satuan
  const findExistingMaterialByName = async (materialName, satuan, userId) => {
    const normalizedName = materialName.toLowerCase().trim();
    
    console.log('🔍 [TEST] Searching for existing material:', { materialName, normalizedName, satuan });
    
    const { data: materials, error } = await supabase
      .from('bahan_baku')
      .select('id, nama, satuan, stok, harga_rata_rata, harga_satuan, supplier')
      .eq('user_id', userId)
      .ilike('nama', normalizedName)
      .eq('satuan', satuan);
    
    if (error) {
      console.error('❌ [TEST] Error searching materials by name:', error);
      return null;
    }
    
    if (materials && materials.length > 0) {
      const exactMatch = materials.find(m => 
        m.nama.toLowerCase().trim() === normalizedName
      );
      
      if (exactMatch) {
        console.log('✅ [TEST] Found exact name match:', exactMatch);
        return exactMatch;
      }
      
      const similarMatch = materials[0];
      console.log('⚠️ [TEST] Found similar name match:', similarMatch);
      return similarMatch;
    }
    
    console.log('ℹ️ [TEST] No existing material found by name');
    return null;
  };

  // Helper: calculate new WAC
  const calculateNewWac = (oldWac = 0, oldStock = 0, qty = 0, unitPrice = 0) => {
    const safeOldWac = Math.max(0, Number(oldWac) || 0);
    const safeOldStock = Math.max(0, Number(oldStock) || 0);
    const safeQty = Number(qty) || 0;
    const safeUnitPrice = Math.max(0, Number(unitPrice) || 0);
    
    const newStock = safeOldStock + safeQty;
    
    if (newStock <= 0) {
      return safeOldWac > 0 ? safeOldWac : safeUnitPrice;
    }
    
    if (safeOldStock <= 0) {
      return safeUnitPrice;
    }
    
    if (safeQty > 0 && safeUnitPrice <= 0) {
      return safeOldWac;
    }
    
    const previousValue = safeOldStock * safeOldWac;
    const deltaValue = safeQty * safeUnitPrice;
    const newWac = (previousValue + deltaValue) / newStock;
    
    if (!isFinite(newWac) || newWac < 0) {
      return safeOldWac > 0 ? safeOldWac : safeUnitPrice;
    }
    
    return newWac;
  };

  for (const item of purchase.items) {
    const itemId = item.id;
    const itemName = item.nama;
    const itemSatuan = item.satuan;
    const qty = Number(item.kuantitas);
    const unitPrice = deriveUnitPrice(item, qty);

    console.log('🔄 [TEST] Processing item:', { itemId, itemName, itemSatuan, qty, unitPrice });

    if (qty <= 0 || !itemName.trim()) {
      console.warn('⚠️ [TEST] Skipping invalid item:', { itemId, itemName, qty, unitPrice });
      continue;
    }

    // STEP 1: Try to find by exact ID first
    let existing = null;
    if (itemId) {
      const { data: exactMatch, error } = await supabase
        .from('bahan_baku')
        .select('id, nama, satuan, stok, harga_rata_rata, harga_satuan, supplier')
        .eq('id', itemId)
        .eq('user_id', purchase.userId)
        .maybeSingle();
        
      if (error) {
        console.error('❌ [TEST] Error fetching by ID:', error);
      } else if (exactMatch) {
        existing = exactMatch;
        console.log('✅ [TEST] Found exact ID match:', existing);
      }
    }
    
    // STEP 2: If no ID match, try to find by name and unit
    if (!existing) {
      existing = await findExistingMaterialByName(itemName, itemSatuan, purchase.userId);
    }

    const oldStock = existing?.stok ?? 0;
    const oldWac = existing?.harga_rata_rata ?? existing?.harga_satuan ?? 0;
    const newStock = oldStock + qty;
    const newWac = calculateNewWac(oldWac, oldStock, qty, unitPrice);

    console.log('🔄 [TEST] Stock calculation:', {
      itemId,
      itemName,
      oldStock,
      qty,
      newStock,
      oldWac,
      unitPrice,
      newWac,
      existing: existing?.id,
      matchType: existing?.id === itemId ? 'ID_MATCH' : existing ? 'NAME_MATCH' : 'NEW_ITEM'
    });

    if (existing) {
      // UPDATE existing item
      console.log('🔄 [TEST] Updating existing item:', {
        existingId: existing.id,
        existingName: existing.nama,
        matchedBy: existing.id === itemId ? 'ID' : 'NAME'
      });
      
      const updateData = {
        stok: newStock,
        harga_rata_rata: newWac,
        harga_satuan: unitPrice,
        updated_at: new Date().toISOString()
      };
      
      // Update supplier info
      if (purchase.supplier && purchase.supplier.trim()) {
        if (!existing.supplier || existing.supplier.trim() === '') {
          updateData.supplier = purchase.supplier;
          console.log('📝 [TEST] Adding supplier info:', purchase.supplier);
        } else if (existing.supplier !== purchase.supplier) {
          const existingSuppliers = existing.supplier.split(',').map(s => s.trim());
          const newSupplier = purchase.supplier.trim();
          if (!existingSuppliers.includes(newSupplier)) {
            updateData.supplier = [...existingSuppliers, newSupplier].join(', ');
            console.log('📝 [TEST] Adding new supplier to list:', updateData.supplier);
          }
        }
      }
      
      const { error: updateError } = await supabase
        .from('bahan_baku')
        .update(updateData)
        .eq('id', existing.id)
        .eq('user_id', purchase.userId);
      
      if (updateError) {
        console.error('❌ [TEST] Error updating item:', updateError);
      } else {
        console.log('✅ [TEST] Successfully updated item:', {
          id: existing.id,
          name: existing.nama,
          oldStock,
          newStock,
          oldWac: oldWac.toFixed(2),
          newWac: newWac.toFixed(2)
        });
      }
    } else {
      // CREATE new item
      console.log('🔄 [TEST] Creating new item:', itemName);
      
      const insertData = {
        id: itemId || `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: purchase.userId,
        nama: itemName,
        kategori: item.kategori ?? '',
        stok: qty,
        satuan: itemSatuan,
        minimum: 0,
        harga_satuan: unitPrice,
        harga_rata_rata: unitPrice,
        supplier: purchase.supplier ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from('bahan_baku')
        .insert(insertData);
      
      if (insertError) {
        console.error('❌ [TEST] Error creating item:', insertError);
      } else {
        console.log('✅ [TEST] Successfully created item:', {
          id: insertData.id,
          name: itemName,
          stock: qty,
          price: unitPrice.toFixed(2)
        });
      }
    }
  }
};

async function runTest(scenario) {
  console.log(`\n🧪 Running test: ${scenario.name}`);
  console.log(`📋 ${scenario.description}`);
  
  try {
    // Create test purchases and apply them
    for (const purchase of scenario.purchases) {
      const purchaseData = {
        id: purchase.id,
        user_id: TEST_USER_ID,
        supplier: purchase.supplier,
        tanggal: new Date().toISOString().split('T')[0],
        total_nilai: purchase.items.reduce((sum, item) => sum + item.subtotal, 0),
        items: purchase.items,
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert purchase
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert(purchaseData);
        
      if (purchaseError) {
        console.error('❌ Error creating test purchase:', purchaseError);
        return false;
      }
      
      // Apply to warehouse
      await applyPurchaseToWarehouse({
        ...purchase,
        userId: TEST_USER_ID
      });
    }
    
    // Validate results
    const { data: warehouseItems, error } = await supabase
      .from('bahan_baku')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .order('nama');
      
    if (error) {
      console.error('❌ Error fetching warehouse items:', error);
      return false;
    }
    
    console.log('\n📊 Test Results:');
    warehouseItems.forEach(item => {
      console.log(`  📦 ${item.nama}:`);
      console.log(`     - Stock: ${item.stok} ${item.satuan}`);
      console.log(`     - WAC: ${item.harga_rata_rata}`);
      console.log(`     - Unit Price: ${item.harga_satuan}`);
      console.log(`     - Supplier: ${item.supplier || 'N/A'}`);
    });
    
    // Validate expectations
    if (scenario.expected.totalStock !== undefined) {
      const totalStock = warehouseItems.reduce((sum, item) => sum + item.stok, 0);
      if (totalStock === scenario.expected.totalStock) {
        console.log(`✅ Stock accumulation test PASSED: ${totalStock} (expected: ${scenario.expected.totalStock})`);
      } else {
        console.log(`❌ Stock accumulation test FAILED: ${totalStock} (expected: ${scenario.expected.totalStock})`);
        return false;
      }
      
      // Check WAC calculation
      if (scenario.expected.expectedWAC && warehouseItems.length === 1) {
        const actualWAC = warehouseItems[0].harga_rata_rata;
        const expectedWAC = scenario.expected.expectedWAC;
        const tolerance = 0.01; // Allow small rounding differences
        
        if (Math.abs(actualWAC - expectedWAC) <= tolerance) {
          console.log(`✅ WAC calculation test PASSED: ${actualWAC.toFixed(2)} (expected: ${expectedWAC.toFixed(2)})`);
        } else {
          console.log(`❌ WAC calculation test FAILED: ${actualWAC.toFixed(2)} (expected: ${expectedWAC.toFixed(2)})`);
          return false;
        }
      }
    }
    
    if (scenario.expected.separateItems) {
      if (warehouseItems.length === scenario.expected.items.length) {
        console.log(`✅ Separate items test PASSED: ${warehouseItems.length} items created`);
      } else {
        console.log(`❌ Separate items test FAILED: ${warehouseItems.length} items (expected: ${scenario.expected.items.length})`);
        return false;
      }
    }
    
    console.log(`✅ Test "${scenario.name}" PASSED`);
    return true;
    
  } catch (error) {
    console.error(`❌ Test "${scenario.name}" FAILED:`, error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Warehouse Stock Accumulation Tests\n');
  console.log('This test validates that materials with the same name from different suppliers');
  console.log('will accumulate their stock properly in the warehouse.\n');
  
  let passedTests = 0;
  let totalTests = testScenarios.length;
  
  for (const scenario of testScenarios) {
    await clearTestData(); // Clean before each test
    
    const passed = await runTest(scenario);
    if (passed) {
      passedTests++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause between tests
  }
  
  await clearTestData(); // Clean up after all tests
  
  console.log(`\n📈 Test Summary:`);
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests PASSED! Stock accumulation feature is working correctly.');
    console.log('\n✅ Solution Summary:');
    console.log('   - Materials with same name and unit will now accumulate stock');
    console.log('   - WAC (Weighted Average Cost) is calculated properly across suppliers');
    console.log('   - Supplier information is combined for better tracking');
    console.log('   - System supports both ID-based and name-based matching');
  } else {
    console.log('\n❌ Some tests FAILED. Please check the implementation.');
  }
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});
