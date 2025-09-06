#!/usr/bin/env node

/**
 * Fix import syntax errors caused by auto-fix script
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing import syntax errors...\n');

function fixImportSyntax(content) {
  // Pattern untuk mencari duplikasi import yang rusak
  const brokenImportPattern = /import \{\s*import \{ safeDom \} from '@\/utils\/browserApiSafeWrappers';\s*\n\s*/g;
  
  // Perbaiki pattern yang rusak
  content = content.replace(brokenImportPattern, '');
  
  // Pattern untuk mencari multiline import yang rusak
  const multilineImportPattern = /import \{\s*\n\s*import \{ safeDom \} from '@\/utils\/browserApiSafeWrappers';\s*\n\s*/g;
  content = content.replace(multilineImportPattern, 'import {\n');
  
  // Pastikan ada import safeDom jika digunakan tapi belum di-import
  const usesSafeDom = content.includes('safeDom.');
  const hasCorrectImport = content.includes("import { safeDom } from '@/utils/browserApiSafeWrappers'");
  
  if (usesSafeDom && !hasCorrectImport) {
    // Tambahkan import di tempat yang tepat
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ') || lines[i].startsWith('import{')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, "import { safeDom } from '@/utils/browserApiSafeWrappers';");
      content = lines.join('\n');
    }
  }
  
  return content;
}

function fixFile(filePath) {
  try {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    const fixedContent = fixImportSyntax(originalContent);
    
    if (originalContent !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      console.log(`✅ Fixed import syntax in ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function scanAndFixDirectory(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixedCount += scanAndFixDirectory(filePath);
    } else if (file.match(/\.(ts|tsx)$/)) {
      if (fixFile(filePath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

// Main execution
const srcDir = path.join(__dirname, 'src');
const fixedCount = scanAndFixDirectory(srcDir);

console.log(`\n🎉 Fixed ${fixedCount} files with import syntax errors.`);
console.log('Now trying build again...\n');
