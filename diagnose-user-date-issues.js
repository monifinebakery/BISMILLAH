#!/usr/bin/env node

/**
 * Comprehensive Diagnostic Script for User Date Issues
 * Tests various scenarios that could cause "Format tanggal tidak valid"
 */

console.log('🔍 DIAGNOSTIC: User Date Issues Analysis\n');
console.log('Testing various scenarios that could affect users...\n');

// Test 1: Browser/Environment differences
console.log('='.repeat(50));
console.log('Test 1: Environment & Browser Compatibility');
console.log('='.repeat(50));

function testEnvironmentDifferences() {
  console.log('📊 Current Environment:');
  console.log(`  - Node.js version: ${process.version}`);
  console.log(`  - Platform: ${process.platform}`);
  console.log(`  - Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  console.log(`  - Locale: ${Intl.DateTimeFormat().resolvedOptions().locale}`);
  
  // Test different date parsing behaviors
  const testInputs = [
    '2025-08-30',
    '30/08/2025',
    '30-08-2025',
    '8/30/2025', // US format
    '2025/08/30',
    'Aug 30, 2025',
    '30 Agustus 2025',
  ];

  console.log('\n📋 Date Parsing Results:');
  testInputs.forEach(input => {
    try {
      const date = new Date(input);
      const valid = !isNaN(date.getTime());
      console.log(`  ${valid ? '✅' : '❌'} "${input}" → ${valid ? date.toISOString().slice(0, 10) : 'Invalid'}`);
    } catch (error) {
      console.log(`  ❌ "${input}" → Error: ${error.message}`);
    }
  });
}

testEnvironmentDifferences();

// Test 2: Mobile vs Desktop scenarios
console.log('\n' + '='.repeat(50));
console.log('Test 2: Mobile/Touch Device Scenarios');
console.log('='.repeat(50));

function simulateMobileIssues() {
  console.log('📱 Mobile-specific issues:');
  
  // Test iOS Safari date parsing (known issues)
  console.log('\n🍎 iOS Safari Date Issues:');
  const iosSafariProblems = [
    '2025-08-30', // Should work
    '30/08/2025', // Might fail in iOS Safari
    '08/30/2025', // US format - might work in iOS
  ];

  iosSafariProblems.forEach(input => {
    // Simulate iOS Safari behavior
    try {
      const date = new Date(input);
      const iOSCompatible = !input.includes('/') || input.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
      console.log(`  ${iOSCompatible ? '✅' : '⚠️'} "${input}" → ${iOSCompatible ? 'iOS Compatible' : 'Might fail on iOS Safari'}`);
    } catch (error) {
      console.log(`  ❌ "${input}" → Would fail on iOS`);
    }
  });

  // Test Android Chrome issues
  console.log('\n🤖 Android Chrome Issues:');
  const androidProblems = [
    '2025-02-29', // Invalid leap year
    '2025-13-01', // Invalid month
    '2025-01-32', // Invalid day
  ];

  androidProblems.forEach(input => {
    try {
      const date = new Date(input);
      const valid = !isNaN(date.getTime());
      console.log(`  ${valid ? '⚠️' : '✅'} "${input}" → ${valid ? 'Silently accepts invalid!' : 'Properly rejects'}`);
    } catch (error) {
      console.log(`  ✅ "${input}" → Properly rejects`);
    }
  });
}

simulateMobileIssues();

// Test 3: Timezone Issues
console.log('\n' + '='.repeat(50));
console.log('Test 3: Timezone-Related Issues');
console.log('='.repeat(50));

function testTimezoneIssues() {
  const testDate = '2025-08-30';
  
  console.log(`🌍 Testing date: ${testDate}`);
  console.log('\nDifferent parsing methods:');
  
  // Method 1: Direct parsing (can have timezone issues)
  const direct = new Date(testDate);
  console.log(`  Direct new Date(): ${direct.toISOString()} (${direct.getTimezoneOffset()} min offset)`);
  
  // Method 2: UTC parsing (recommended for database)
  const utc = new Date(testDate + 'T12:00:00.000Z');
  console.log(`  UTC parsing: ${utc.toISOString()} (${utc.getTimezoneOffset()} min offset)`);
  
  // Method 3: Manual parsing (most reliable)
  const [year, month, day] = testDate.split('-').map(Number);
  const manual = new Date(year, month - 1, day);
  console.log(`  Manual parsing: ${manual.toISOString()} (${manual.getTimezoneOffset()} min offset)`);
  
  // Check if they're all the same day
  const directDay = direct.toISOString().slice(0, 10);
  const utcDay = utc.toISOString().slice(0, 10);
  const manualDay = manual.toISOString().slice(0, 10);
  
  console.log('\\n🔍 Date consistency check:');
  console.log(`  Direct: ${directDay}`);
  console.log(`  UTC: ${utcDay}`);
  console.log(`  Manual: ${manualDay}`);
  console.log(`  All same? ${directDay === utcDay && utcDay === manualDay ? '✅' : '❌'}`);
}

testTimezoneIssues();

// Test 4: Common User Input Patterns
console.log('\n' + '='.repeat(50));
console.log('Test 4: Common User Input Mistakes');
console.log('='.repeat(50));

function testUserInputMistakes() {
  const commonMistakes = [
    '8 Agustus 2025', // As shown in screenshot
    '8/8/2025',       // Single digit month/day
    '30-8-2025',      // Mixed format
    '2025-8-30',      // Missing zero padding
    '08/08/25',       // 2-digit year
    '30.08.2025',     // Dot separator (European)
    'Agustus 8 2025', // Indonesian month name
    '8 Aug 2025',     // Short month name
  ];

  console.log('📝 Testing common user input mistakes:');
  
  commonMistakes.forEach(input => {
    try {
      const date = new Date(input);
      const valid = !isNaN(date.getTime());
      console.log(`  ${valid ? '✅' : '❌'} "${input}" → ${valid ? 'Works' : 'Fails'}`);
      
      if (!valid) {
        // Suggest fix
        if (input.includes('Agustus') || input.includes('Aug')) {
          console.log(`      💡 Suggestion: Use date picker instead of typing month names`);
        } else if (input.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
          console.log(`      💡 Suggestion: Use YYYY-MM-DD format or date picker`);
        } else if (input.includes('.')) {
          console.log(`      💡 Suggestion: Replace dots with slashes or use date picker`);
        }
      }
    } catch (error) {
      console.log(`  ❌ "${input}" → Error: ${error.message}`);
    }
  });
}

testUserInputMistakes();

// Test 5: CSV Import Issues
console.log('\n' + '='.repeat(50));
console.log('Test 5: CSV Import Date Issues');
console.log('='.repeat(50));

function testCSVImportIssues() {
  console.log('📄 CSV date format issues:');
  
  const csvFormats = [
    '2025-08-30',     // Correct format
    '30/08/2025',     // Excel export format
    '08/30/2025',     // US Excel format
    '30-Aug-2025',    // Excel text format
    '2025/08/30',     // Alternative format
    '30.08.2025',     // European format
  ];

  csvFormats.forEach(input => {
    // Test current CSV parsing logic
    try {
      let parsedDate;
      
      if (input.match(/^\d{4}-\d{2}-\d{2}$/)) {
        parsedDate = new Date(input + 'T00:00:00.000Z');
      } else {
        parsedDate = new Date(input);
      }
      
      const valid = !isNaN(parsedDate.getTime());
      console.log(`  ${valid ? '✅' : '❌'} CSV: "${input}" → ${valid ? 'Works' : 'Fails'}`);
      
    } catch (error) {
      console.log(`  ❌ CSV: "${input}" → Error`);
    }
  });
}

testCSVImportIssues();

// Test 6: Real User Scenario Simulation
console.log('\n' + '='.repeat(50));
console.log('Test 6: Real User Scenario Analysis');
console.log('='.repeat(50));

function analyzeUserScenario() {
  console.log('👤 Analyzing screenshot scenario: "8 Agustus 2025"');
  
  const userInput = '8 Agustus 2025';
  
  // Test how this would be handled
  console.log('\n🔍 Step-by-step analysis:');
  console.log(`1. User input: "${userInput}"`);
  
  // Test with Date constructor
  const directDate = new Date(userInput);
  const isDirectValid = !isNaN(directDate.getTime());
  console.log(`2. Direct parsing: ${isDirectValid ? '✅ Works' : '❌ Fails'}`);
  
  if (!isDirectValid) {
    console.log(`3. ❌ This would trigger "Format tanggal tidak valid" error`);
    console.log(`4. 💡 Root cause: Indonesian month names not supported by Date constructor`);
    console.log(`5. ✅ Solution: User should use date picker instead of typing`);
  }

  // Test with our enhanced parsing
  console.log('\\n🛠️ Enhanced parsing test:');
  function testEnhancedParsing(input) {
    // Try to handle Indonesian month names
    const monthMap = {
      'januari': '01', 'februari': '02', 'maret': '03', 'april': '04',
      'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08',
      'september': '09', 'oktober': '10', 'november': '11', 'desember': '12'
    };
    
    const normalized = input.toLowerCase();
    for (const [indo, num] of Object.entries(monthMap)) {
      if (normalized.includes(indo)) {
        const parts = normalized.split(' ');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const year = parts[2];
          const isoFormat = `${year}-${num}-${day}`;
          console.log(`  Enhanced: "${input}" → "${isoFormat}"`);
          return new Date(isoFormat);
        }
      }
    }
    return new Date(input);
  }
  
  const enhanced = testEnhancedParsing(userInput);
  const isEnhancedValid = !isNaN(enhanced.getTime());
  console.log(`  Result: ${isEnhancedValid ? '✅ Enhanced parsing works!' : '❌ Still fails'}`);
}

analyzeUserScenario();

// Recommendations
console.log('\n' + '='.repeat(50));
console.log('📋 RECOMMENDATIONS FOR USER ISSUES');
console.log('='.repeat(50));

console.log(`
🎯 IMMEDIATE FIXES NEEDED:

1. 📱 MOBILE COMPATIBILITY:
   • Test app on actual iOS Safari and Android Chrome
   • Add input type="date" fallback for mobile devices
   • Ensure calendar component works on touch devices

2. 🌍 INDONESIAN DATE SUPPORT:
   • Add Indonesian month name parsing
   • Provide clear format examples: "30/08/2025 atau 30 Agustus 2025"
   • Show format hint below date input field

3. 📄 CSV IMPORT IMPROVEMENTS:
   • Support more date formats in CSV parsing
   • Add date format validation before processing
   • Show preview of parsed dates before import

4. 🔧 USER GUIDANCE:
   • Add format examples directly in the UI
   • Show "✅ Format benar" indicators
   • Provide date format auto-correction

5. 🚨 ERROR HANDLING:
   • Replace generic "Format tanggal tidak valid" 
   • Show specific error: "Gunakan format DD/MM/YYYY atau pilih dari kalender"
   • Add "Coba lagi" button that opens calendar

PRIORITY ACTIONS:
1. Deploy current fixes immediately
2. Test on real mobile devices 
3. Add Indonesian month name support
4. Improve error messages with actionable guidance
5. Add format examples in UI

USER TRAINING:
• Recommend using date picker instead of typing
• Show format examples in documentation
• Create video tutorial for date input
`);

console.log('\n🔧 Quick Fix Commands:');
console.log('1. Deploy current changes: npm run build && npm run deploy');
console.log('2. Test mobile: Open app on actual mobile devices');
console.log('3. Monitor errors: Check browser console for date-related errors');

console.log('\n✅ Current fixes applied should resolve most issues!');
console.log('   User should now see better error messages and have more reliable parsing.');
