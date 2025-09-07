# 🔧 Troubleshooting Guide

## React Context Errors

### Error: "Cannot read properties of undefined (reading 'createContext')"

**Penyebab:**
- Chunk splitting yang terlalu aggressive memisahkan React context
- Multiple React instances in different chunks
- Import timing issues

**Solusi yang sudah diterapkan:**

1. **Conservative Chunk Splitting** ✅
   - React ecosystem (react, react-dom, react-router) tetap di vendor chunk
   - Tidak memisahkan React core dari dependencies lainnya

2. **OptimizeDeps Configuration** ✅
   - Force include React dependencies
   - Exclude problematic libraries dari pre-bundling

3. **Clear Cache** ✅
   - Hapus `node_modules/.vite` dan `dist` folder
   - Rebuild dengan konfigurasi baru

### Jika masih error:

#### Quick Fix:
```bash
# Clear cache dan rebuild
rm -rf node_modules/.vite dist
npm run build
```

#### Advanced Fix:
```bash
# Clear node_modules (only if desperate)
rm -rf node_modules
npm install
npm run build
```

## Performance Optimization Status

### ✅ Completed Optimizations:

1. **Bundle Splitting**:
   - `vendor.js`: 671KB (vs 785KB original) - **14% reduction**
   - `index.js`: 349KB (vs 514KB original) - **32% reduction**
   - Heavy libraries separated (Excel, Recharts, Supabase)

2. **Feature Splitting**:
   - `features-heavy`: 214KB (Warehouse, OperationalCosts)
   - `features-analysis`: 242KB (Financial, Profit Analysis)

3. **Library Splitting**:
   - `excel`: 429KB (lazy loaded)
   - `recharts`: 286KB (lazy loaded)
   - `react-query`: 35KB (separated)

### 🎯 Results:
- **Initial Load**: Faster karena Excel/Recharts tidak dimuat upfront
- **Route Navigation**: Lebih cepat dengan feature splitting
- **Memory Usage**: Lebih efisien dengan lazy loading

## Development Commands

### Performance Monitoring:
```bash
# Analyze bundle size
npm run analyze

# Build and check sizes
npm run build

# Dev server with performance monitoring
npm run dev
# Then open browser, performance monitor will show in bottom-right
```

### Cache Management:
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Clear build output
rm -rf dist

# Full clean
npm run clean
```

## Bundle Analysis

### Current Bundle Sizes (After Optimization):
- **Main Bundle** (`index.js`): 349KB → Aplikasi core
- **Vendor Bundle** (`vendor.js`): 672KB → React, UI libs, etc.
- **Excel Bundle** (`excel.js`): 429KB → Lazy loaded saat export
- **Recharts Bundle** (`recharts.js`): 286KB → Lazy loaded saat charting
- **Features Heavy**: 214KB → Warehouse, OperationalCosts
- **Features Analysis**: 242KB → Financial analysis tools

### Loading Strategy:
1. **Critical Path**: Index + Vendor (1MB total)
2. **On-Demand**: Excel, Recharts, Heavy features
3. **Route-Based**: Feature chunks load per navigation

## Common Issues & Solutions

### 1. Context Not Found
```
Error: Cannot read properties of undefined (reading 'createContext')
```
**Fix**: Clear cache and rebuild (sudah diperbaiki di config)

### 2. Chunk Loading Failed
```
Error: Loading chunk failed
```
**Fix**: Check network, clear browser cache

### 3. Module Not Found
```
Error: Cannot resolve module 'xyz'
```
**Fix**: Check import paths, restart dev server

### 4. Memory Issues
```
JavaScript heap out of memory
```
**Fix**: Restart dev server, check for memory leaks

## Emergency Rollback

Jika ada masalah serius dengan optimasi, bisa rollback:

```bash
# Revert vite.config.ts to simple config
git checkout HEAD~1 vite.config.ts

# Or disable chunk splitting temporarily
# Comment out manualChunks in vite.config.ts
```

## Monitoring Tools

### In-App Performance Monitor:
- Available in dev mode (bottom-right button)
- Shows bundle sizes, load times, memory usage
- Real-time performance metrics

### Browser Tools:
- Chrome DevTools > Network tab (bundle sizes)
- Chrome DevTools > Performance tab (loading analysis)
- Lighthouse audit for overall performance

## Success Metrics

### Bundle Size Improvement:
- **Before**: 785KB vendor + 514KB main = 1.3MB initial
- **After**: 672KB vendor + 349KB main = 1MB initial
- **Savings**: ~23% reduction in initial bundle

### Loading Performance:
- Heavy libraries (Excel, Charts) load on-demand
- Feature chunks load per route
- Better caching with separated chunks

### Memory Usage:
- Lazy loading reduces initial memory footprint
- Components unload when not needed
- Better garbage collection

## 🎉 Status: OPTIMIZED & STABLE

Aplikasi telah dioptimasi dengan:
- ✅ Stable chunk splitting
- ✅ React context compatibility
- ✅ Performance monitoring
- ✅ Lazy loading utilities ready
- ✅ Clean build process

**Ready for production use!** 🚀
