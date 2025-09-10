# 🛡️ ERROR PREVENTION & MONITORING GUIDE

## Kenapa Error Bisa Terjadi di User tapi Tidak di Development?

### 1. **Perbedaan Environment**
- Browser version berbeda
- Extensions browser yang block scripts
- Antivirus/firewall blocking
- Network conditions (3G/4G vs WiFi)
- Device specs (RAM, CPU)
- OS yang berbeda

### 2. **Cache Issues**
- Service Worker cache lama
- Browser cache stale
- CDN cache outdated
- localStorage corrupt

### 3. **Data Issues**
- User punya data format lama
- Database migration belum jalan
- Null/undefined dari API
- JSONB fields return unexpected types

## 🚀 Sistem Pencegahan Error yang Sudah Diimplementasi

### 1. **Enhanced Error Boundary** (`errorBoundaryEnhanced.tsx`)
- ✅ Automatic error logging ke Supabase
- ✅ User-friendly error messages
- ✅ Auto-recovery dengan reload button
- ✅ Error tracking di localStorage
- ✅ Different fallback untuk app/page/component level

### 2. **Runtime Safety Utilities** (`runtimeSafety.ts`)
Semua operasi berbahaya sudah di-wrap dengan safety functions:

```typescript
// Safe JSON parsing
safeJsonParse(data, fallback)

// Safe array operations
safeArray.map(items, fn, fallback)
safeArray.filter(items, fn, fallback)

// Safe localStorage
safeStorage.getItem(key, fallback)
safeStorage.setItem(key, value)

// Safe number parsing
safeNumber.parse(value, fallback)

// Safe async operations
safeAsync(asyncFn, fallback)

// Safe network requests dengan retry
safeFetch(url, { retries: 3, timeout: 10000 })
```

### 3. **Debug Helper Script** (`debug-helper.js`)
Script untuk troubleshooting di browser user:

```javascript
// User bisa jalankan ini di console
generateDebugReport() // Generate full system report
clearAllData()        // Clear all caches & reload
```

## 📊 Monitoring Production Errors

### Database Table untuk Error Logging
```sql
CREATE TABLE error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  error_message TEXT,
  error_stack TEXT,
  component_stack TEXT,
  level VARCHAR(50),
  browser_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query cepat
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
```

## 🔧 How to Use in Components

### 1. Wrap Components dengan Error Boundary
```tsx
import { ErrorBoundaryEnhanced } from '@/utils/errorBoundaryEnhanced';

// App level
<ErrorBoundaryEnhanced level="app">
  <App />
</ErrorBoundaryEnhanced>

// Page level
<ErrorBoundaryEnhanced level="page">
  <DashboardPage />
</ErrorBoundaryEnhanced>

// Component level
<ErrorBoundaryEnhanced level="component">
  <ComplexCalculator />
</ErrorBoundaryEnhanced>
```

### 2. Use Runtime Safety untuk Operations
```tsx
import { safeArray, safeStorage, safeNumber } from '@/utils/runtimeSafety';

// Safe array mapping
const items = safeArray.map(data?.items, item => ({
  ...item,
  price: safeNumber.parse(item.price, 0)
}), []);

// Safe localStorage
const settings = safeStorage.getItem('userSettings', {});

// Safe number parsing
const total = safeNumber.parse(response?.total, 0);
```

### 3. Defensive Coding Pattern
```tsx
// BEFORE (bisa error)
const items = data.items.map(item => item.name);

// AFTER (safe)
const items = safeArray.map(data?.items, item => item?.name, []);

// BEFORE (bisa error)
const price = Number(data.price);

// AFTER (safe)
const price = safeNumber.parse(data?.price, 0);

// BEFORE (bisa error)
const settings = JSON.parse(localStorage.getItem('settings'));

// AFTER (safe)
const settings = safeStorage.getItem('settings', {});
```

## 🚨 Common Error Patterns & Solutions

### 1. **Boolean Iteration Error**
```tsx
// PROBLEM
categories.map(...) // categories bisa false dari DB

// SOLUTION
(categories || []).map(...)
// atau
safeArray.map(categories, fn, [])
```

### 2. **Undefined Property Access**
```tsx
// PROBLEM
user.profile.name

// SOLUTION
user?.profile?.name || 'Default'
// atau
safeGet(user, 'profile.name', 'Default')
```

### 3. **JSON Parse Error**
```tsx
// PROBLEM
JSON.parse(data)

// SOLUTION
safeJsonParse(data, {})
```

### 4. **Number NaN**
```tsx
// PROBLEM
Number(price) * quantity

// SOLUTION
safeNumber.parse(price, 0) * safeNumber.parse(quantity, 1)
```

## 📱 Testing untuk Production

### 1. **Browser Testing Checklist**
- [ ] Chrome latest
- [ ] Chrome -2 versions
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Edge latest
- [ ] Mobile Chrome
- [ ] Mobile Safari

### 2. **Network Conditions**
- [ ] Fast 3G
- [ ] Slow 3G
- [ ] Offline mode
- [ ] High latency (>1000ms)

### 3. **Device Testing**
- [ ] Low-end Android (2GB RAM)
- [ ] iPhone SE (small screen)
- [ ] iPad
- [ ] Desktop 1366x768
- [ ] Desktop 1920x1080

### 4. **Data Edge Cases**
- [ ] Empty data
- [ ] Null values
- [ ] Very large datasets (>1000 items)
- [ ] Special characters in text
- [ ] Different timezones

## 🔍 Debugging Production Issues

### Step 1: Get User Debug Report
```javascript
// Minta user buka console dan jalankan:
generateDebugReport()
// Report akan ter-copy ke clipboard
```

### Step 2: Analyze Report
Check for:
- Browser version
- Service Worker status
- Cache names
- Console errors
- Network connectivity
- localStorage data

### Step 3: Remote Fix Options
```javascript
// Option 1: Clear all caches
clearAllData()

// Option 2: Force update Service Worker
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.update());
});

// Option 3: Reset specific localStorage
localStorage.removeItem('problematicKey');
window.location.reload();
```

## 📈 Monitoring Dashboard Query

```sql
-- Get recent errors
SELECT 
  error_message,
  COUNT(*) as count,
  MAX(created_at) as last_seen,
  array_agg(DISTINCT browser_info->>'userAgent') as browsers
FROM error_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY error_message
ORDER BY count DESC;

-- Get error by user
SELECT 
  u.email,
  COUNT(e.id) as error_count,
  array_agg(DISTINCT e.error_message) as errors
FROM error_logs e
JOIN auth.users u ON e.user_id = u.id
WHERE e.created_at > NOW() - INTERVAL '7 days'
GROUP BY u.email
ORDER BY error_count DESC;
```

## 🚀 Deployment Checklist

Before deploying to production:

1. **Code Safety**
   - [ ] All array operations use safeArray
   - [ ] All JSON parsing uses safeJsonParse
   - [ ] All number parsing uses safeNumber
   - [ ] All components wrapped in ErrorBoundary

2. **Testing**
   - [ ] Test dengan network throttling
   - [ ] Test dengan localStorage penuh
   - [ ] Test dengan data kosong
   - [ ] Test error recovery flows

3. **Monitoring**
   - [ ] Error logging table created
   - [ ] Monitoring dashboard ready
   - [ ] Alert system configured
   - [ ] Debug helper script deployed

4. **Documentation**
   - [ ] User troubleshooting guide
   - [ ] Support team trained
   - [ ] Error codes documented
   - [ ] Recovery procedures written

## 💡 Tips untuk Menghindari Production Errors

1. **Always assume data can be null/undefined**
2. **Use TypeScript strict mode**
3. **Test with real user data**
4. **Monitor error logs daily**
5. **Have rollback plan ready**
6. **Keep Service Worker version updated**
7. **Use feature flags for risky features**
8. **Progressive rollout (10% -> 50% -> 100%)**

---

**Remember**: It's better to show a degraded experience than to crash completely. Always provide fallbacks!
