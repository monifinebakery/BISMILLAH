#!/usr/bin/env node

/**
 * Quick test for Indonesian date parsing
 */

// Simulate the Indonesian date parsing function
function parseIndonesianDate(input) {
  const monthMap = {
    'januari': 1, 'jan': 1,
    'februari': 2, 'feb': 2,
    'maret': 3, 'mar': 3,
    'april': 4, 'apr': 4,
    'mei': 5,
    'juni': 6, 'jun': 6,
    'juli': 7, 'jul': 7,
    'agustus': 8, 'agu': 8,
    'september': 9, 'sep': 9,
    'oktober': 10, 'okt': 10,
    'november': 11, 'nov': 11,
    'desember': 12, 'des': 12
  };
  
  const normalized = input.toLowerCase().trim();
  
  // Pattern: "8 Agustus 2025" or "30 Januari 2024"
  const match = normalized.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
  if (match) {
    const [, dayStr, monthStr, yearStr] = match;
    const month = monthMap[monthStr];
    
    if (month) {
      const day = parseInt(dayStr, 10);
      const year = parseInt(yearStr, 10);
      
      // Validate day range
      if (day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day);
        // Double-check the date is valid (handles Feb 30, etc)
        if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
          return date;
        }
      }
    }
  }
  
  return null;
}

console.log('🇮🇩 Testing Indonesian Date Parsing\n');

const testCases = [
  '8 Agustus 2025',
  '30 Januari 2024',
  '15 Februari 2025',
  '1 Maret 2024',
  '25 Desember 2025',
  '31 Mei 2024',
  '8 agu 2025', // Short form
  'invalid date',
  '32 Januari 2024', // Invalid day
  '8 InvalidMonth 2025' // Invalid month
];

testCases.forEach(testCase => {
  const result = parseIndonesianDate(testCase);
  const success = result !== null;
  
  console.log(`${success ? '✅' : '❌'} "${testCase}"`);
  if (success) {
    console.log(`    → ${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`);
    console.log(`    → ${result.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`);
  }
  console.log('');
});

console.log('🎯 User Scenario Test:');
const userInput = '8 Agustus 2025';
const userResult = parseIndonesianDate(userInput);
if (userResult) {
  console.log(`✅ SUCCESS: "${userInput}" parsed successfully!`);
  console.log(`   Date: ${userResult.toISOString().split('T')[0]}`);
  console.log(`   Display: ${userResult.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`);
} else {
  console.log(`❌ FAILED: "${userInput}" could not be parsed`);
}

console.log('\n🚀 This should now work in the purchase form!');
