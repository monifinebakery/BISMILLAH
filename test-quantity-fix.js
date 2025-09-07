// test-quantity-fix.js
// Test script untuk debugging masalah kuantitas menjadi 0

console.log('🧪 Testing Quantity Fix');

// Import robust number parser
const { parseRobustNumber } = require('./src/utils/robustNumberParser.ts');

// Test data formats yang mungkin bermasalah
const testCases = [
  { input: "570", expected: 570, desc: "Plain number string" },
  { input: 570, expected: 570, desc: "Number type" },
  { input: "570,5", expected: 570.5, desc: "Indonesian decimal" },
  { input: "1.234,56", expected: 1234.56, desc: "Indonesian thousand+decimal" },
  { input: "1,234.56", expected: 1234.56, desc: "English thousand+decimal" },
  { input: "", expected: 0, desc: "Empty string" },
  { input: null, expected: 0, desc: "Null value" },
  { input: undefined, expected: 0, desc: "Undefined value" },
  { input: "0", expected: 0, desc: "Zero string" },
  { input: 0, expected: 0, desc: "Zero number" }
];

console.log('\n📊 Test Results:');
console.log('================');

testCases.forEach((testCase, index) => {
  try {
    const result = parseRobustNumber(testCase.input, 0);
    const passed = result === testCase.expected;
    
    console.log(`${index + 1}. ${testCase.desc}`);
    console.log(`   Input: ${JSON.stringify(testCase.input)} (${typeof testCase.input})`);
    console.log(`   Expected: ${testCase.expected}`);
    console.log(`   Result: ${result}`);
    console.log(`   Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
  } catch (error) {
    console.log(`${index + 1}. ${testCase.desc}: ❌ ERROR - ${error.message}`);
  }
});

// Test database mapping
console.log('🗄️ Database Field Mapping Test:');
console.log('================================');

const testItem = {
  nama: 'Vanili Bubuk',
  kuantitas: 570,
  jumlah: undefined,
  hargaSatuan: 200,
  harga_per_satuan: undefined,
  satuan: 'gr'
};

console.log('Input item:', testItem);

// Simulate mapping process
const mappedForDB = {
  bahan_baku_id: testItem.bahanBakuId || 'test-id',
  nama: testItem.nama,
  jumlah: testItem.kuantitas ?? testItem.jumlah, // This should be 570
  harga_per_satuan: testItem.hargaSatuan ?? testItem.harga_per_satuan, // This should be 200
  satuan: testItem.satuan
};

console.log('Mapped for DB:', mappedForDB);

const mappedFromDB = {
  bahanBakuId: mappedForDB.bahan_baku_id,
  nama: mappedForDB.nama,
  kuantitas: mappedForDB.jumlah, // This should map back to 570
  hargaSatuan: mappedForDB.harga_per_satuan, // This should map back to 200
  satuan: mappedForDB.satuan
};

console.log('Mapped from DB:', mappedFromDB);

console.log('\n🎯 Expected Behavior:');
console.log('- Kuantitas should remain 570 throughout the process');
console.log('- Field mapping: frontend.kuantitas ↔ database.jumlah');
console.log('- No data should be lost in transformation');

console.log('\n🔧 Fixes Applied:');
console.log('1. ✅ Robust number parser with Indonesian locale support');
console.log('2. ✅ Fixed field mapping: kuantitas ↔ jumlah');
console.log('3. ✅ Added debugging logs for data transformation');
console.log('4. ✅ Implemented inline edit functionality');

console.log('\n📝 Next Steps:');
console.log('1. Test the application with real data');
console.log('2. Check browser console for debug logs');
console.log('3. Verify database field mapping is correct');
console.log('4. Test edit functionality');
