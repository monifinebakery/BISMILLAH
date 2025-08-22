# Debug OTP Redirect Issue

## Problem Overview
User gets stuck on OTP verification page after successful OTP verification, instead of being redirected to dashboard.

## Root Cause Analysis
1. **Multiple Redirect Mechanisms**: EmailAuthPage had multiple competing redirect methods
2. **Race Conditions**: AuthGuard, AuthContext, and EmailAuthPage all trying to handle redirects
3. **Complex State Management**: Too many nested timeout and redirect calls

## Solutions Implemented

### 1. Simplified EmailAuthPage Redirect Logic
**File**: `src/components/EmailAuthPage.tsx`

**Before**: Multiple redirect methods
- `triggerRedirectCheck()`
- `window.location.replace('/')`
- `window.location.href = '/'`
- Multiple timeouts with different delays

**After**: Single reliable redirect method
```typescript
// Wait a moment for AuthContext to update user state, then redirect
setTimeout(() => {
  if (mountedRef.current) {
    logger.info('EmailAuth: Redirecting to dashboard');
    window.location.href = '/';
  }
}, 100);
```

### 2. Simplified AuthGuard Logic
**File**: `src/components/AuthGuard.tsx`

**Changes**:
- Removed immediate redirect timeout logic
- Simplified debug logging
- Let React Router's `<Navigate>` component handle redirects reliably
- Removed complex useEffect chains

### 3. Cleaned Up AuthContext
**File**: `src/contexts/AuthContext.tsx`

**Changes**:
- Removed redirect logic from `triggerRedirectCheck()`
- Removed automatic redirect on `SIGNED_IN` event
- Let AuthGuard handle all redirects consistently

## Testing Steps

1. Open http://localhost:5174/auth
2. Enter email: `monifinebakery@gmail.com`
3. Complete hCaptcha if enabled
4. Click "Kirim Kode Verifikasi"
5. Enter the 6-digit OTP code received in email
6. Click "Verifikasi Kode"
7. Should see success message and automatic redirect to dashboard

## Debug Console Logs

When testing, check browser console for these log messages:

### Successful Flow:
```
🔍 [AuthGuard #X] State: { hasUser: false, isReady: true, ... }
EmailAuth: Starting OTP verification...
EmailAuth: OTP verification successful
EmailAuth: Executing successful login redirect
EmailAuth: Redirecting to dashboard
🔍 [AuthGuard #Y] State: { hasUser: true, isReady: true, ... }
🚀 [AuthGuard #Y] EXECUTING REDIRECT to / for user: email@example.com
✅ [AuthGuard #Z] Rendering protected content for user: email@example.com
```

### If Still Stuck:
1. Check if user state is updating in AuthContext
2. Check if AuthGuard is detecting the user change
3. Check if there are any JavaScript errors in console

## Manual Debug Commands

Open browser dev console and run:

```javascript
// Check current auth state
console.log('User:', window.__DEBUG_AUTH_USER__);
console.log('Ready:', window.__DEBUG_AUTH_READY__);
console.log('Loading:', window.__DEBUG_AUTH_LOADING__);

// Force redirect if user exists but stuck on auth page
if (window.__DEBUG_AUTH_USER__ && window.location.pathname === '/auth') {
  window.location.href = '/';
}
```

## Additional Notes

- The simplified approach relies on React Router's `<Navigate>` component which is more reliable than manual window.location calls
- AuthGuard now has a single responsibility: determine if user should see protected content or be redirected
- EmailAuthPage focuses only on OTP verification, leaving redirect handling to AuthGuard
- All debug logs are prefixed with emojis for easy identification

## Deployment Considerations

For Netlify deployment, ensure:
1. `_redirects` file is properly configured for SPA routing
2. Environment variables are set correctly
3. hCaptcha keys are configured if CAPTCHA is enabled
