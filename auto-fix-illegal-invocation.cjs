#!/usr/bin/env node

/**
 * Auto-fix script untuk mengganti semua pola yang berpotensi menyebabkan illegal invocation
 * dengan safe wrapper alternatives
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Auto-fixing illegal invocation patterns...\n');

// Pattern replacements
const REPLACEMENTS = [
  // Performance API
  {
    pattern: /performance\.now\(\)/g,
    replacement: 'safePerformance.now()',
    importNeeded: 'safePerformance'
  },
  {
    pattern: /performance\.mark\(/g,
    replacement: 'safePerformance.mark(',
    importNeeded: 'safePerformance'
  },
  {
    pattern: /performance\.measure\(/g,
    replacement: 'safePerformance.measure(',
    importNeeded: 'safePerformance'
  },
  {
    pattern: /performance\.getEntriesByType\(/g,
    replacement: 'safePerformance.getEntriesByType(',
    importNeeded: 'safePerformance'
  },
  
  // DOM API
  {
    pattern: /document\.createElement\(/g,
    replacement: 'safeDom.createElement(',
    importNeeded: 'safeDom'
  },
  {
    pattern: /document\.querySelector\(/g,
    replacement: 'safeDom.querySelector(',
    importNeeded: 'safeDom'
  },
  {
    pattern: /document\.getElementById\(/g,
    replacement: 'safeDom.getElementById(',
    importNeeded: 'safeDom'
  },
  {
    pattern: /document\.addEventListener\(/g,
    replacement: 'safeDom.addEventListener(document, ',
    importNeeded: 'safeDom',
    specialCase: true
  },
  {
    pattern: /document\.removeEventListener\(/g,
    replacement: 'safeDom.removeEventListener(document, ',
    importNeeded: 'safeDom',
    specialCase: true
  },
  
  // Window API
  {
    pattern: /window\.addEventListener\(/g,
    replacement: 'safeDom.addEventListener(window, ',
    importNeeded: 'safeDom',
    specialCase: true
  },
  {
    pattern: /window\.removeEventListener\(/g,
    replacement: 'safeDom.removeEventListener(window, ',
    importNeeded: 'safeDom',
    specialCase: true
  },
];

// Files to skip (already fixed or should not be modified)
const SKIP_FILES = [
  'browserApiSafeWrappers.ts',
  'main.tsx', // Already manually fixed
  'usePerformanceMonitor.ts', // Already manually fixed
  'preload-optimizer.ts', // Already manually fixed
  'toastSwipeHandler.ts', // Already manually fixed
  'pwaUtils.ts', // Already manually fixed
  'usePreloading.ts', // Already manually fixed
];

function shouldSkipFile(filePath) {
  const fileName = path.basename(filePath);
  return SKIP_FILES.some(skipFile => fileName.includes(skipFile));
}

function hasImport(content, importName) {
  return content.includes(`import { ${importName}`) || 
         content.includes(`import {${importName}`) ||
         content.includes(`${importName}`) && content.includes('browserApiSafeWrappers');
}

function addImport(content, neededImports) {
  if (neededImports.length === 0) return content;
  
  // Check if import already exists
  if (hasImport(content, neededImports[0])) return content;
  
  const importStatement = `import { ${neededImports.join(', ')} } from '@/utils/browserApiSafeWrappers';\n`;
  
  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ') || lines[i].startsWith('import{')) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, importStatement);
  } else {
    // No imports found, add at the top after first comment block
    let insertIndex = 0;
    while (insertIndex < lines.length && 
           (lines[insertIndex].startsWith('//') || 
            lines[insertIndex].startsWith('/*') ||
            lines[insertIndex].trim() === '')) {
      insertIndex++;
    }
    lines.splice(insertIndex, 0, importStatement);
  }
  
  return lines.join('\n');
}

function fixEventListenerCalls(content) {
  // Fix element.addEventListener patterns
  content = content.replace(
    /(\w+)\.addEventListener\(/g,
    (match, element) => {
      if (element === 'document' || element === 'window') {
        return match; // Already handled by other patterns
      }
      return `safeDom.addEventListener(${element}, `;
    }
  );
  
  // Fix element.removeEventListener patterns  
  content = content.replace(
    /(\w+)\.removeEventListener\(/g,
    (match, element) => {
      if (element === 'document' || element === 'window') {
        return match; // Already handled by other patterns
      }
      return `safeDom.removeEventListener(${element}, `;
    }
  );
  
  return content;
}

function fixFile(filePath) {
  if (shouldSkipFile(filePath)) {
    console.log(`⏭️  Skipping ${filePath} (already fixed or excluded)`);
    return false;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let neededImports = new Set();
    
    // Apply replacements
    for (const replacement of REPLACEMENTS) {
      if (replacement.pattern.test(content)) {
        content = content.replace(replacement.pattern, replacement.replacement);
        neededImports.add(replacement.importNeeded);
        modified = true;
      }
    }
    
    // Fix element.addEventListener/removeEventListener patterns
    const originalContent = content;
    content = fixEventListenerCalls(content);
    if (content !== originalContent) {
      neededImports.add('safeDom');
      modified = true;
    }
    
    // Add imports if needed
    if (neededImports.size > 0) {
      content = addImport(content, Array.from(neededImports));
    }
    
    // Write back if modified
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${filePath} (imports: ${Array.from(neededImports).join(', ')})`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function scanAndFix(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixedCount += scanAndFix(filePath);
    } else if (file.match(/\.(ts|tsx)$/) && !file.includes('.test.') && !file.includes('__tests__')) {
      if (fixFile(filePath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

// Main execution
const srcDir = path.join(__dirname, 'src');
const fixedCount = scanAndFix(srcDir);

console.log(`\n🎉 Auto-fix completed! Fixed ${fixedCount} files.`);
console.log('\n📝 Next steps:');
console.log('1. Review the changes with: git diff');
console.log('2. Test the build with: pnpm build');
console.log('3. Run the test script again: node test-illegal-invocation.cjs');
