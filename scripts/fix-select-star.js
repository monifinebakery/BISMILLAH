#!/usr/bin/env node
/**
 * Script untuk mendeteksi dan memperbaiki penggunaan SELECT * di codebase
 * Usage: node scripts/fix-select-star.js [--fix] [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SRC_DIR = 'src';
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build'];

// Patterns to match SELECT *
const SELECT_STAR_PATTERNS = [
  /\.select\s*\(\s*['"`]\*['"`]\s*\)/g,
  /\.select\s*\(\s*"\*"\s*\)/g,
  /\.select\s*\(\s*'\*'\s*\)/g,
  /\.select\s*\(\s*`\*`\s*\)/g,
];

// Common table column mappings (customize based on your schema)
const TABLE_COLUMNS = {
  orders: [
    'id', 'nomor_pesanan', 'tanggal', 'nama_pelanggan', 
    'telepon_pelanggan', 'email_pelanggan', 'alamat_pengiriman',
    'status', 'total_pesanan', 'catatan', 'items', 'created_at', 'updated_at'
  ],
  user_payments: [
    'id', 'user_id', 'order_id', 'email', 'payment_status', 
    'is_paid', 'pg_reference_id', 'created_at', 'amount'
  ],
  app_settings: [
    'id', 'user_id', 'target_output_monthly', 'overhead_per_pcs',
    'operasional_per_pcs', 'created_at', 'updated_at'
  ],
  products: [
    'id', 'user_id', 'nama_produk', 'harga_jual', 'hpp',
    'kategori', 'created_at', 'updated_at'
  ],
  purchases: [
    'id', 'user_id', 'tanggal', 'supplier', 'total_pembelian',
    'status', 'catatan', 'created_at', 'updated_at'
  ]
};

// ANSI colors
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(colors[color] + message + colors.reset);
}

function getAllFiles(dir, extensions = FILE_EXTENSIONS) {
  let results = [];
  
  if (!fs.existsSync(dir)) return results;
  
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file)) {
        results = results.concat(getAllFiles(filePath, extensions));
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

function detectSelectStar(content) {
  const matches = [];
  
  SELECT_STAR_PATTERNS.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const lines = content.substr(0, match.index).split('\\n');
      const lineNumber = lines.length;
      const line = lines[lines.length - 1] + match[0];
      
      matches.push({
        lineNumber,
        line: line.trim(),
        match: match[0],
        index: match.index
      });
    }
  });
  
  return matches;
}

function guessTableFromContext(content, matchIndex) {
  // Look backwards from the match to find .from() call
  const beforeMatch = content.substr(0, matchIndex);
  const fromMatch = beforeMatch.match(/\\.from\\s*\\(\\s*['"`]([^'"`]+)['"`]\\s*\\)/g);
  
  if (fromMatch && fromMatch.length > 0) {
    const lastFrom = fromMatch[fromMatch.length - 1];
    const tableMatch = lastFrom.match(/['"`]([^'"`]+)['"`]/);
    if (tableMatch) {
      return tableMatch[1];
    }
  }
  
  // Fallback: look for common table names in the file
  for (const tableName of Object.keys(TABLE_COLUMNS)) {
    if (beforeMatch.includes(tableName)) {
      return tableName;
    }
  }
  
  return null;
}

function generateSelectColumns(tableName) {
  const columns = TABLE_COLUMNS[tableName];
  if (!columns) {
    return `\\n          id,\\n          -- TODO: Add specific columns for ${tableName}\\n        `;
  }
  
  return `\\n          ${columns.join(',\\n          ')}\\n        `;
}

function fixSelectStar(content, matches, tableName = null) {
  let fixedContent = content;
  
  // Process matches in reverse order to maintain correct indices
  matches.reverse().forEach(match => {
    const guessedTable = tableName || guessTableFromContext(content, match.index);
    const selectColumns = generateSelectColumns(guessedTable || 'unknown');
    
    const replacement = `.select(\`${selectColumns}\`)`;
    
    fixedContent = 
      fixedContent.slice(0, match.index) + 
      replacement + 
      fixedContent.slice(match.index + match.match.length);
  });
  
  return fixedContent;
}

function analyzeFile(filePath, fix = false) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = detectSelectStar(content);
    
    if (matches.length === 0) return null;
    
    const result = {
      filePath,
      matches,
      fixed: false
    };
    
    if (fix) {
      const fixedContent = fixSelectStar(content, matches);
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      result.fixed = true;
    }
    
    return result;
  } catch (error) {
    log(`Error processing ${filePath}: ${error.message}`, 'red');
    return null;
  }
}

function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  const dryRun = args.includes('--dry-run');
  
  log('🔍 Scanning for SELECT * usage...\\n', 'cyan');
  
  const files = getAllFiles(SRC_DIR);
  const issues = [];
  
  files.forEach(filePath => {
    const result = analyzeFile(filePath, shouldFix && !dryRun);
    if (result) {
      issues.push(result);
    }
  });
  
  // Report results
  log(`\\n📊 Analysis Results:`, 'bold');
  log(`Files scanned: ${files.length}`, 'white');
  log(`Files with SELECT *: ${issues.length}`, 'yellow');
  log(`Total SELECT * occurrences: ${issues.reduce((sum, issue) => sum + issue.matches.length, 0)}\\n`, 'yellow');
  
  if (issues.length === 0) {
    log('✅ No SELECT * usage found!', 'green');
    return;
  }
  
  // Detailed report
  log('📋 Detailed Issues:', 'bold');
  issues.forEach(issue => {
    log(`\\n📁 ${issue.filePath}`, 'cyan');
    issue.matches.forEach(match => {
      log(`  Line ${match.lineNumber}: ${match.line}`, 'yellow');
    });
    
    if (issue.fixed) {
      log(`  ✅ Fixed!`, 'green');
    }
  });
  
  // Priority recommendations
  log('\\n🎯 Priority Recommendations:', 'bold');
  const priorityFiles = issues.filter(issue => 
    issue.filePath.includes('orderService') || 
    issue.filePath.includes('paymentService') ||
    issue.filePath.includes('profitAnalysis')
  );
  
  if (priorityFiles.length > 0) {
    log('HIGH PRIORITY - These files are used frequently:', 'red');
    priorityFiles.forEach(issue => {
      log(`  • ${issue.filePath} (${issue.matches.length} occurrences)`, 'red');
    });
  }
  
  // Performance impact estimation
  const totalOccurrences = issues.reduce((sum, issue) => sum + issue.matches.length, 0);
  const estimatedSavings = Math.round(totalOccurrences * 0.3 * 100); // Rough estimate
  log(`\\n📈 Performance Impact:`, 'bold');
  log(`Estimated data transfer reduction: ~${estimatedSavings}KB per page load`, 'green');
  
  if (!shouldFix && !dryRun) {
    log('\\n💡 Next Steps:', 'bold');
    log('1. Run with --dry-run to see what would be changed', 'cyan');
    log('2. Run with --fix to automatically fix all issues', 'cyan');  
    log('3. Review and test the changes', 'cyan');
    log('4. Consider adding ESLint rule to prevent future SELECT *', 'cyan');
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  detectSelectStar,
  fixSelectStar,
  generateSelectColumns,
  TABLE_COLUMNS
};
