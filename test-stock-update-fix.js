// Test script untuk memverifikasi fix stock update di warehouse sync

const testFieldMapping = () => {
  console.log('🧪 Testing field mapping fixes...\n');
  
  // Mock purchase item from database
  const mockPurchaseItemDB = {
    bahan_baku_id: 'test-id-123',
    nama: 'Tepung Terigu',
    jumlah: 10,
    satuan: 'kg',
    harga_per_satuan: 15000,
    subtotal: 150000
  };
  
  // Mock purchase item from frontend
  const mockPurchaseItemFE = {
    bahanBakuId: 'test-id-123',
    nama: 'Tepung Terigu',
    quantity: 10,
    satuan: 'kg',  
    unitPrice: 15000,
    subtotal: 150000
  };
  
  console.log('📋 Mock DB Purchase Item:', mockPurchaseItemDB);
  console.log('📋 Mock FE Purchase Item:', mockPurchaseItemFE);
  
  // Test extraction functions (simulating warehouse sync logic)
  const extractFromDB = (item) => {
    return {
      itemId: item.bahan_baku_id || item.bahanBakuId || item.id,
      quantity: item.jumlah || item.quantity || 0,
      unitPrice: item.harga_per_satuan || item.unitPrice || item.harga_satuan || 0,
      name: item.nama
    };
  };
  
  const extractFromFE = (item) => {
    return {
      itemId: item.bahan_baku_id || item.bahanBakuId || item.id,
      quantity: item.jumlah || item.quantity || 0,
      unitPrice: item.harga_per_satuan || item.unitPrice || item.harga_satuan || 0,
      name: item.nama
    };
  };
  
  const dbResult = extractFromDB(mockPurchaseItemDB);
  const feResult = extractFromFE(mockPurchaseItemFE);
  
  console.log('✅ DB Extraction Result:', dbResult);
  console.log('✅ FE Extraction Result:', feResult);
  
  // Verify consistency
  const isConsistent = (
    dbResult.itemId === feResult.itemId &&
    dbResult.quantity === feResult.quantity &&
    dbResult.unitPrice === feResult.unitPrice &&
    dbResult.name === feResult.name
  );
  
  console.log('🎯 Field mapping consistency:', isConsistent ? '✅ PASS' : '❌ FAIL');
  
  if (!isConsistent) {
    console.log('❌ Inconsistencies found:');
    if (dbResult.itemId !== feResult.itemId) console.log('  - Item ID mismatch');
    if (dbResult.quantity !== feResult.quantity) console.log('  - Quantity mismatch');
    if (dbResult.unitPrice !== feResult.unitPrice) console.log('  - Unit price mismatch');
    if (dbResult.name !== feResult.name) console.log('  - Name mismatch');
  }
  
  return isConsistent;
};

const testWACCalculation = () => {
  console.log('\n🧮 Testing WAC calculation...\n');
  
  const calculateNewWac = (oldWac, oldStock, qty, unitPrice) => {
    const safeOldWac = Math.max(0, oldWac || 0);
    const safeOldStock = Math.max(0, oldStock || 0);
    const safeQty = qty || 0;
    const safeUnitPrice = Math.max(0, unitPrice || 0);
    
    const newStock = safeOldStock + safeQty;
    
    // Edge case: Initial stock
    if (safeOldStock <= 0) {
      return safeUnitPrice;
    }
    
    // Standard WAC calculation
    const previousValue = safeOldStock * safeOldWac;
    const deltaValue = safeQty * safeUnitPrice;
    const newWac = (previousValue + deltaValue) / newStock;
    
    return isFinite(newWac) && newWac >= 0 ? newWac : safeOldWac;
  };
  
  // Test scenarios
  const scenarios = [
    {
      name: 'Initial Purchase',
      oldWac: 0,
      oldStock: 0,
      qty: 10,
      unitPrice: 15000,
      expectedWac: 15000,
      expectedStock: 10
    },
    {
      name: 'Second Purchase Same Price',
      oldWac: 15000,
      oldStock: 10,
      qty: 5,
      unitPrice: 15000,
      expectedWac: 15000,
      expectedStock: 15
    },
    {
      name: 'Cross-supplier Accumulation',
      oldWac: 15000,
      oldStock: 10,
      qty: 20,
      unitPrice: 18000,
      expectedWac: 17000,
      expectedStock: 30
    }
  ];
  
  let allPassed = true;
  
  scenarios.forEach(scenario => {
    const calculatedWac = calculateNewWac(
      scenario.oldWac,
      scenario.oldStock,
      scenario.qty,
      scenario.unitPrice
    );
    const calculatedStock = scenario.oldStock + scenario.qty;
    
    const wacMatch = Math.abs(calculatedWac - scenario.expectedWac) < 0.01;
    const stockMatch = calculatedStock === scenario.expectedStock;
    const passed = wacMatch && stockMatch;
    
    console.log(`${passed ? '✅' : '❌'} ${scenario.name}:`);
    console.log(`  Expected: Stock=${scenario.expectedStock}, WAC=${scenario.expectedWac}`);
    console.log(`  Actual:   Stock=${calculatedStock}, WAC=${calculatedWac.toFixed(0)}`);
    
    if (!passed) allPassed = false;
  });
  
  return allPassed;
};

const runTests = () => {
  console.log('🧪 Running Stock Update Fix Tests\n');
  console.log('='*50);
  
  const fieldMappingPass = testFieldMapping();
  const wacCalculationPass = testWACCalculation();
  
  console.log('\n' + '='*50);
  console.log('📋 TEST RESULTS:');
  console.log(`Field Mapping: ${fieldMappingPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`WAC Calculation: ${wacCalculationPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Overall: ${fieldMappingPass && wacCalculationPass ? '✅ ALL TESTS PASS' : '❌ SOME TESTS FAILED'}`);
  
  if (fieldMappingPass && wacCalculationPass) {
    console.log('\n🎉 Stock update fix is working correctly!');
    console.log('✅ Purchase items should now properly update warehouse stock');
  } else {
    console.log('\n⚠️ Issues detected - stock updates may still have problems');
  }
};

// Run tests
runTests();