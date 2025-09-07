#!/usr/bin/env node

/**
 * Script untuk menganalisis bundle size dan code splitting
 * Menampilkan informasi detail tentang chunk yang dihasilkan
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBuildDirectory() {
  const buildDir = path.join(process.cwd(), 'dist');
  const jsDir = path.join(buildDir, 'assets');
  
  if (!fs.existsSync(jsDir)) {
    console.log(colorize('❌ Build directory tidak ditemukan. Jalankan `npm run build` terlebih dahulu.', 'red'));
    return;
  }

  console.log(colorize('\n🚀 ANALISIS BUNDLE SIZE & CODE SPLITTING', 'cyan'));
  console.log(colorize('=' .repeat(60), 'cyan'));

  const files = fs.readdirSync(jsDir)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const filePath = path.join(jsDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        path: filePath
      };
    })
    .sort((a, b) => b.size - a.size);

  let totalSize = 0;
  let mainBundleSize = 0;
  let chunkSizes = [];

  console.log(colorize('\n📊 BREAKDOWN FILE JAVASCRIPT:', 'yellow'));
  console.log(colorize('-'.repeat(60), 'yellow'));

  files.forEach((file, index) => {
    totalSize += file.size;
    
    const isMainBundle = file.name.includes('index') || file.name.includes('main');
    const isChunk = file.name.includes('chunk') || file.name.includes('-');
    
    if (isMainBundle) {
      mainBundleSize += file.size;
    } else if (isChunk) {
      chunkSizes.push(file.size);
    }

    const sizeFormatted = formatBytes(file.size);
    const percentage = ((file.size / totalSize) * 100).toFixed(1);
    
    let icon = '📦';
    let color = 'reset';
    
    if (isMainBundle) {
      icon = '🎯';
      color = 'green';
    } else if (isChunk) {
      icon = '🧩';
      color = 'blue';
    }
    
    console.log(`${icon} ${colorize(file.name.padEnd(35), color)} ${sizeFormatted.padStart(10)} (${percentage}%)`);
  });

  // Analisis code splitting effectiveness
  const chunkCount = chunkSizes.length;
  const averageChunkSize = chunkCount > 0 ? chunkSizes.reduce((a, b) => a + b, 0) / chunkCount : 0;
  const splittingRatio = ((totalSize - mainBundleSize) / totalSize * 100).toFixed(1);

  console.log(colorize('\n📈 STATISTIK CODE SPLITTING:', 'magenta'));
  console.log(colorize('-'.repeat(60), 'magenta'));
  console.log(`🎯 Main Bundle Size:     ${colorize(formatBytes(mainBundleSize), 'green')}`);
  console.log(`🧩 Total Chunks:         ${colorize(chunkCount.toString(), 'blue')}`);
  console.log(`📊 Average Chunk Size:   ${colorize(formatBytes(averageChunkSize), 'blue')}`);
  console.log(`📦 Total Bundle Size:    ${colorize(formatBytes(totalSize), 'yellow')}`);
  console.log(`⚡ Code Splitting Ratio: ${colorize(splittingRatio + '%', 'cyan')}`);

  // Rekomendasi
  console.log(colorize('\n💡 REKOMENDASI:', 'yellow'));
  console.log(colorize('-'.repeat(60), 'yellow'));
  
  if (mainBundleSize > 500 * 1024) { // 500KB
    console.log(colorize('⚠️  Main bundle terlalu besar (>500KB). Pertimbangkan code splitting lebih lanjut.', 'red'));
  } else {
    console.log(colorize('✅ Main bundle size optimal (<500KB).', 'green'));
  }
  
  if (chunkCount < 3) {
    console.log(colorize('⚠️  Terlalu sedikit chunks. Pertimbangkan memecah komponen besar.', 'yellow'));
  } else if (chunkCount > 20) {
    console.log(colorize('⚠️  Terlalu banyak chunks. Pertimbangkan menggabungkan chunks kecil.', 'yellow'));
  } else {
    console.log(colorize('✅ Jumlah chunks optimal (3-20).', 'green'));
  }
  
  if (averageChunkSize < 10 * 1024) { // 10KB
    console.log(colorize('⚠️  Rata-rata chunk terlalu kecil (<10KB). Pertimbangkan menggabungkan.', 'yellow'));
  } else if (averageChunkSize > 200 * 1024) { // 200KB
    console.log(colorize('⚠️  Rata-rata chunk terlalu besar (>200KB). Pertimbangkan memecah lebih lanjut.', 'yellow'));
  } else {
    console.log(colorize('✅ Rata-rata chunk size optimal (10KB-200KB).', 'green'));
  }

  if (parseFloat(splittingRatio) < 30) {
    console.log(colorize('⚠️  Code splitting ratio rendah (<30%). Implementasi lebih banyak lazy loading.', 'yellow'));
  } else {
    console.log(colorize('✅ Code splitting ratio baik (>30%).', 'green'));
  }
}

function analyzeCodeSplittingConfig() {
  console.log(colorize('\n🔧 ANALISIS KONFIGURASI CODE SPLITTING:', 'cyan'));
  console.log(colorize('-'.repeat(60), 'cyan'));
  
  const configPath = path.join(process.cwd(), 'src', 'config', 'codeSplitting.ts');
  
  if (fs.existsSync(configPath)) {
    console.log(colorize('✅ File konfigurasi code splitting ditemukan.', 'green'));
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Analisis komponen yang dikonfigurasi
    const lazyImports = (configContent.match(/React\.lazy/g) || []).length;
    const webpackChunks = (configContent.match(/webpackChunkName/g) || []).length;
    const errorHandlers = (configContent.match(/\.catch\(/g) || []).length;
    
    console.log(`📦 Lazy Components:      ${colorize(lazyImports.toString(), 'blue')}`);
    console.log(`🏷️  Webpack Chunks:       ${colorize(webpackChunks.toString(), 'blue')}`);
    console.log(`🛡️  Error Handlers:       ${colorize(errorHandlers.toString(), 'blue')}`);
    
    if (lazyImports === webpackChunks && lazyImports === errorHandlers) {
      console.log(colorize('✅ Konfigurasi code splitting lengkap dan konsisten.', 'green'));
    } else {
      console.log(colorize('⚠️  Konfigurasi tidak konsisten. Periksa lazy imports, chunk names, dan error handlers.', 'yellow'));
    }
  } else {
    console.log(colorize('❌ File konfigurasi code splitting tidak ditemukan.', 'red'));
  }
}

function generateReport() {
  const reportPath = path.join(process.cwd(), 'bundle-analysis-report.json');
  const buildDir = path.join(process.cwd(), 'dist', 'assets');
  
  if (!fs.existsSync(buildDir)) {
    return;
  }

  const files = fs.readdirSync(buildDir)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const filePath = path.join(buildDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        sizeFormatted: formatBytes(stats.size)
      };
    })
    .sort((a, b) => b.size - a.size);

  const report = {
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
    files: files,
    recommendations: []
  };

  // Tambahkan rekomendasi
  const mainBundle = files.find(f => f.name.includes('index') || f.name.includes('main'));
  if (mainBundle && mainBundle.size > 500 * 1024) {
    report.recommendations.push('Main bundle size terlalu besar, pertimbangkan code splitting lebih lanjut');
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(colorize(`\n📄 Report disimpan di: ${reportPath}`, 'cyan'));
}

function main() {
  console.log(colorize('🔍 BUNDLE ANALYZER - CODE SPLITTING ANALYSIS', 'bright'));
  
  try {
    analyzeBuildDirectory();
    analyzeCodeSplittingConfig();
    generateReport();
    
    console.log(colorize('\n🎉 Analisis selesai!', 'green'));
    console.log(colorize('\n💡 Tips:', 'yellow'));
    console.log('   - Jalankan `npm run build` untuk update analisis');
    console.log('   - Gunakan `npm run preview` untuk test bundle di production mode');
    console.log('   - Monitor bundle size secara berkala untuk menjaga performa');
    
  } catch (error) {
    console.error(colorize('❌ Error saat analisis:', 'red'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzeBuildDirectory,
  analyzeCodeSplittingConfig,
  formatBytes
};