# Environment Files Analysis

## 📁 Files Found:
- `.env` (base)
- `.env.development`
- `.env.preview`
- `.env.production`
- `.env.vercel.preview`
- `.env.vercel.production`

---

## ✅ GOOD CONFIGURATIONS:

### Supabase Configuration:
All files correctly use the same Supabase URL and anon key:
- **URL**: `https://kewhzkfvswbimmwtpymw.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIs...` (consistent across all files)

### App Name Differentiation:
- **Base**: "Kalkulator HPP"
- **Development**: "Kalkulator HPP (Dev)"
- **Preview**: "Kalkulator HPP (Preview)"
- **Production**: "Kalkulator HPP"

### Logging Configuration:
- **Development**: Full logging (debug level)
- **Preview**: Info level logging
- **Production**: Error level only (secure)

---

## ⚠️ ISSUES FOUND:

### 1. Missing Secret Key in Some Files:
- `.env.development` - ❌ Missing `TURNSTILE_SECRET_KEY`
- `.env.preview` - ❌ Missing `TURNSTILE_SECRET_KEY`
- `.env.production` - ❌ Missing `TURNSTILE_SECRET_KEY`
- `.env.vercel.*` - ❌ Missing `TURNSTILE_SECRET_KEY`

Only `.env` has: `TURNSTILE_SECRET_KEY=0x4AAAAAABvpDNsvhD1hRu8mGx1MxxJsgLk`

### 2. Inconsistent CAPTCHA Settings:
- `.env`: `VITE_CAPTCHA_ENABLED=false`
- `.env.development`: `VITE_CAPTCHA_ENABLED=false` ✅
- `.env.preview`: `VITE_CAPTCHA_ENABLED=true` 
- `.env.production`: `VITE_CAPTCHA_ENABLED=true`
- `.env.vercel.preview`: `VITE_CAPTCHA_ENABLED="true\n"` ❌ **Has newline!**
- `.env.vercel.production`: `VITE_CAPTCHA_ENABLED="true\n"` ❌ **Has newline!**

### 3. Vercel Environment Issues:
- Line 26 & 26: `VITE_CAPTCHA_ENABLED="true\n"` contains literal newline
- Missing several variables that should be synced

---

## 🔧 RECOMMENDED FIXES:

### Fix 1: Add Missing Secret Keys
All environment files should have the secret key for server-side validation:
```env
TURNSTILE_SECRET_KEY=0x4AAAAAABvpDNsvhD1hRu8mGx1MxxJsgLk
```

### Fix 2: Clean Vercel Environment Variables
Remove the literal "\n" from Vercel files:
- Change: `VITE_CAPTCHA_ENABLED="true\n"`
- To: `VITE_CAPTCHA_ENABLED=true`

### Fix 3: Consistent CAPTCHA Strategy
Based on current setup:
- **Development**: `VITE_CAPTCHA_ENABLED=false` ✅ (localhost issues)
- **Preview**: `VITE_CAPTCHA_ENABLED=true` (should work with proper domain setup)
- **Production**: `VITE_CAPTCHA_ENABLED=true` (should work with proper domain setup)

---

## 📋 ENVIRONMENT PRIORITY:

Vite loads environment files in this order (later overrides earlier):
1. `.env` (base)
2. `.env.local` (not found)
3. `.env.[mode]` (development/production/preview)
4. `.env.[mode].local` (not found)

Vercel files are deployed separately and override local files.

---

## 🚨 SECURITY NOTES:

### Exposed in Repository:
- Supabase URL and anon key (public by design)
- Turnstile sitekey (public by design)
- Turnstile secret key (❌ SHOULD NOT BE IN CLIENT FILES)

### Recommendations:
- Move `TURNSTILE_SECRET_KEY` to server environment only
- Use Vercel dashboard to set secret environment variables
- Consider using different sitekeys for different environments
