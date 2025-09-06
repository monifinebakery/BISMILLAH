#!/usr/bin/env node

/**
 * Test script untuk memastikan tidak ada error "Illegal invocation"
 * Script ini akan menjalankan aplikasi dan melakukan berbagai interaksi untuk memicu potensi error
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Daftar pattern yang berpotensi menyebabkan illegal invocation
const PROBLEMATIC_PATTERNS = [
  // DOM API patterns
  /document\.createElement\(/g,
  /document\.querySelector/g,
  /document\.getElementById/g,
  /document\.addEventListener/g,
  /document\.removeEventListener/g,
  
  // Performance API patterns
  /performance\.now\(\)/g,
  /performance\.mark/g,
  /performance\.measure/g,
  /performance\.getEntriesByType/g,
  
  // Window/Navigator patterns
  /window\.addEventListener/g,
  /window\.removeEventListener/g,
  /navigator\.serviceWorker/g,
  
  // Event listener patterns without proper binding
  /\.addEventListener\(/g,
  /\.removeEventListener\(/g,
];

console.log('🔍 Testing for potential "Illegal invocation" errors...\n');

/**
 * Scan source code for problematic patterns
 */
function scanSourceFiles() {
  console.log('📁 Scanning source files for problematic patterns...');
  
  const srcDir = path.join(__dirname, 'src');
  const results = [];
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        for (const pattern of PROBLEMATIC_PATTERNS) {
          const matches = content.match(pattern);
          if (matches) {
            // Check if file uses safe wrappers
            const usesSafeWrappers = content.includes('browserApiSafeWrappers') || 
                                   content.includes('safeDom') ||
                                   content.includes('safePerformance') ||
                                   content.includes('safeWindow');
            
            if (!usesSafeWrappers) {
              results.push({
                file: filePath.replace(__dirname + '/', ''),
                pattern: pattern.toString(),
                matches: matches.length,
                content: content
              });
            }
          }
        }
      }
    }
  }
  
  try {
    scanDirectory(srcDir);
    
    if (results.length === 0) {
      console.log('✅ No problematic patterns found without safe wrappers!\n');
      return true;
    } else {
      console.log('❌ Found potential issues:');
      results.forEach(result => {
        console.log(`  - ${result.file}: ${result.matches} matches for ${result.pattern}`);
      });
      console.log('\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Error scanning files:', error);
    return false;
  }
}

/**
 * Test build for errors
 */
function testBuild() {
  return new Promise((resolve) => {
    console.log('🔨 Testing build process...');
    
    exec('pnpm build', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Build failed:', error.message);
        resolve(false);
      } else if (stderr && stderr.includes('error')) {
        console.log('❌ Build errors:', stderr);
        resolve(false);
      } else {
        console.log('✅ Build successful!\n');
        resolve(true);
      }
    });
  });
}

/**
 * Test bundle for illegal invocation patterns
 */
function testBundle() {
  console.log('📦 Checking built bundle...');
  
  const distDir = path.join(__dirname, 'dist', 'assets');
  
  try {
    if (!fs.existsSync(distDir)) {
      console.log('❌ Dist directory not found. Run build first.\n');
      return false;
    }
    
    const files = fs.readdirSync(distDir);
    const jsFiles = files.filter(file => file.endsWith('.js'));
    
    let foundIssues = false;
    
    for (const file of jsFiles) {
      const filePath = path.join(distDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Look for common illegal invocation patterns in minified code
      const suspiciousPatterns = [
        /performance\.now(?!\.)/, // performance.now without .call
        /document\.createElement(?!\.)/, // document.createElement without .call
        /\.addEventListener\s*\(\s*[^,)]+\s*,\s*[^,)]+\s*\)/, // addEventListener without proper binding
      ];
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(content)) {
          console.log(`⚠️  Potential issue in ${file}`);
          foundIssues = true;
        }
      }
    }
    
    if (!foundIssues) {
      console.log('✅ Bundle looks good!\n');
      return true;
    } else {
      console.log('❌ Found potential issues in bundle\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking bundle:', error);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting Illegal Invocation Error Test Suite\n');
  
  const results = {
    sourceCheck: false,
    buildCheck: false,
    bundleCheck: false
  };
  
  // Test 1: Source code scan
  results.sourceCheck = scanSourceFiles();
  
  // Test 2: Build test
  results.buildCheck = await testBuild();
  
  // Test 3: Bundle check
  if (results.buildCheck) {
    results.bundleCheck = testBundle();
  }
  
  // Summary
  console.log('📊 Test Results Summary:');
  console.log(`  Source Code Check: ${results.sourceCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Build Check: ${results.buildCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Bundle Check: ${results.bundleCheck ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = results.sourceCheck && results.buildCheck && results.bundleCheck;
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Application should be free of "Illegal invocation" errors.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Review the issues above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
