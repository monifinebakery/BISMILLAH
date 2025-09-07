# Fix Turnstile Error 600010 - Domain Configuration

## 🚨 **CURRENT ISSUE:**

```
Turnstile error: 600010
```

**Meaning**: Domain Configuration Error - Sitekey tidak dikonfigurasi untuk domain yang sedang diakses.

---

## 🔍 **PROBLEM ANALYSIS:**

### **Current Configuration:**
- **Sitekey**: `0x4AAAAAABvpDKhb8eM31rVE`
- **Production Domain**: `bismillah-lstzl8onl-monifine-bakerys-projects.vercel.app`
- **Status**: Domain belum ditambahkan ke Cloudflare Turnstile dashboard

### **Root Cause:**
Cloudflare Turnstile widget hanya bisa digunakan di domain yang sudah terdaftar di dashboard.

---

## 🔧 **SOLUTION OPTIONS:**

### **Option 1: Add Domain to Cloudflare (RECOMMENDED)**

1. **Login ke Cloudflare Dashboard**:
   - Go to: https://dash.cloudflare.com/
   - Login dengan akun Cloudflare kamu

2. **Navigate to Turnstile**:
   - Di dashboard, cari dan klik **"Turnstile"**
   - Atau langsung ke: https://dash.cloudflare.com/?to=/:account/turnstile

3. **Find Your Widget**:
   - Cari widget dengan sitekey: `0x4AAAAAABvpDKhb8eM31rVE`
   - Klik **"Edit"** atau **"Settings"**

4. **Add Production Domain**:
   - Di bagian **"Domains"**, tambahkan:
     - `bismillah-lstzl8onl-monifine-bakerys-projects.vercel.app`
     - `*.vercel.app` (wildcard untuk semua Vercel subdomain)
     - Jika ada custom domain, tambahkan juga

5. **Save Settings**:
   - Klik **"Save"** atau **"Update"**
   - Tunggu beberapa menit untuk propagasi

### **Option 2: Use Demo Sitekey (TEMPORARY)**

Jika butuh fix cepat untuk testing, bisa pakai Cloudflare demo sitekey:

```bash
# Demo sitekey (always passes)
vercel env rm VITE_TURNSTILE_SITEKEY production
printf "0x4AAAAAAAjlTNjQR6_j6mGA" | vercel env add VITE_TURNSTILE_SITEKEY production
vercel --prod
```

**Demo Sitekeys:**
- **Always Pass**: `0x4AAAAAAAjlTNjQR6_j6mGA`
- **Always Fail**: `0x4AAAAAAAjlTNjTmaJdaH-Q`
- **Force Interactive**: `0x4AAAAAAAAgCKY8qCgtKd_g`

---

## 📋 **STEP-BY-STEP INSTRUCTIONS:**

### **1. Fix Domain Configuration (PRIMARY)**

```bash
# No command needed - manual process in Cloudflare Dashboard
```

**Manual Steps:**
1. Open https://dash.cloudflare.com/
2. Go to Turnstile section
3. Find widget: `0x4AAAAAABvpDKhb8eM31rVE`
4. Edit → Domains → Add:
   - `bismillah-lstzl8onl-monifine-bakerys-projects.vercel.app`
   - `*.vercel.app` (optional wildcard)
5. Save changes
6. Wait 2-5 minutes for propagation

### **2. Verify Fix**

After adding domain, test the production website:
- Error 600010 should disappear
- CAPTCHA widget should load properly
- No more domain mismatch errors

### **3. Alternative - Custom Domain (OPTIONAL)**

If you have a custom domain, you can also:
1. Add CNAME record pointing to Vercel
2. Configure custom domain in Vercel dashboard
3. Add custom domain to Cloudflare Turnstile
4. Update environment variables if needed

---

## ⚠️ **COMMON ISSUES:**

### **Issue 1: Domain Not Found in Turnstile Dashboard**
**Solution**: You might not be the owner of this Cloudflare account/sitekey. Contact the person who created the Turnstile widget.

### **Issue 2: Multiple Sitekeys**
**Solution**: Make sure you're editing the correct widget. Check that the sitekey matches exactly.

### **Issue 3: Changes Not Taking Effect**
**Solution**: 
- Wait 5-10 minutes for DNS/CDN propagation
- Clear browser cache
- Try incognito/private browsing mode

---

## 🎯 **EXPECTED RESULT:**

### **Before Fix:**
- ❌ Turnstile error: 600010
- ❌ CAPTCHA widget fails to load
- ❌ Domain mismatch error in console

### **After Fix:**
- ✅ No error 600010
- ✅ CAPTCHA widget loads properly
- ✅ Users can complete CAPTCHA challenge
- ✅ OTP sending works with CAPTCHA verification

---

## 🚀 **VERIFICATION:**

After implementing the fix:

1. **Open Production Website**: 
   - https://bismillah-lstzl8onl-monifine-bakerys-projects.vercel.app

2. **Check Browser Console**:
   - Should NOT see error 600010
   - Should see successful CAPTCHA loading logs

3. **Test Functionality**:
   - Enter email address
   - Complete CAPTCHA challenge
   - Send OTP should work

4. **Console Debug Logs**:
   ```javascript
   🔍 CAPTCHA Environment Detection: {
     raw: "true",
     mode: "production",
     isProd: true
   }
   ```

---

## 📝 **NOTES:**

- **Domain changes** take 2-10 minutes to propagate
- **Wildcard domains** (`*.vercel.app`) are recommended for Vercel apps
- **Demo sitekeys** are good for testing but not production security
- **Always use real sitekey** in production for actual protection

---

## 🆘 **IF STILL NOT WORKING:**

1. **Verify Domain Spelling**: Exact match required
2. **Check Account Access**: Make sure you can edit the Turnstile widget
3. **Try Demo Sitekey**: Use temporarily to verify other components work
4. **Contact Support**: If you don't have Cloudflare access

**Most likely fix: Add the production domain to your Cloudflare Turnstile widget!** 🎯
