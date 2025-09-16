# Vercel Auto-Update Setup Guide

## ✅ Status: READY TO DEPLOY

Sistem auto-update sudah siap digunakan dengan konfigurasi yang sudah ada. Vercel akan otomatis mendeteksi dan memberikan environment variables yang diperlukan.

## 🔧 Environment Variables (Otomatis dari Vercel)

Vercel secara otomatis menyediakan environment variables berikut:

### **System Environment Variables (Auto-injected by Vercel)**
```bash
VERCEL_GIT_COMMIT_SHA=abc123def456...  # Current commit hash
VERCEL_GIT_COMMIT_REF=main            # Git branch name  
VERCEL_GIT_REPO_OWNER=monifinebakery   # Repository owner
VERCEL_GIT_REPO_SLUG=BISMILLAH        # Repository name
VERCEL_URL=your-app.vercel.app         # Deployment URL
```

### **Custom Build Variables (Defined in vite.config.ts)**
```bash
VITE_BUILD_ID=build_1758027294635_ngg1zs  # Auto-generated unique build ID
VITE_COMMIT_HASH=01d6922b                 # Short commit hash (first 8 chars)
VITE_BUILD_TIME=2025-09-16T12:54:54.635Z  # Build timestamp
```

## 🌐 Network Configuration

### **Updated vercel.json** 
CSP header sudah diperbarui untuk mengizinkan GitHub API calls:

```json
{
  "connect-src": "https://api.github.com" // ✅ Added for auto-update
}
```

### **GitHub API Access**
- ✅ **Public Repository**: Tidak perlu token (rate limit 60 calls/hour per IP)
- 🔒 **Optional GitHub Token**: Bisa ditambahkan untuk rate limit lebih tinggi

```bash
# Optional: Higher rate limits (5000 calls/hour)
VITE_GITHUB_TOKEN=your_github_personal_access_token_here
```

## 🚀 Deployment Flow

### **Otomatis saat Deploy ke Vercel:**

1. **Git Push** → Vercel deteksi commit baru
2. **Build Process** → Inject environment variables 
3. **Deploy Success** → App dengan build info baru live
4. **User Opens App** → Auto-update system check GitHub API
5. **Commit Comparison** → Deteksi update tersedia
6. **Banner Shows** → User bisa refresh untuk update

## 📋 Vercel Settings (Tidak Perlu Diubah)

### **Build & Development Settings**
```
Framework Preset: Vite
Build Command: pnpm build
Output Directory: dist
Install Command: pnpm install
Development Command: pnpm dev
```

### **Environment Variables (Optional)**
Jika ingin menambah GitHub token untuk rate limit lebih tinggi:

1. Go to **Project Settings** → **Environment Variables**
2. Add: `VITE_GITHUB_TOKEN` = `your_github_token_here`
3. Scope: **Production, Preview, Development**

### **Function & Build Settings**
- ✅ **Node.js Version**: 18.x (default)
- ✅ **Edge Functions**: Not needed
- ✅ **Build Timeout**: Default (45 minutes)

## ⚙️ Branch Configuration

### **Production Branch**: `main`
- Auto-deploy enabled
- Environment variables inherited
- Build info auto-generated

### **Preview Branch**: `pake-ini` 
- Preview deployments enabled
- Same build process
- Testing environment

## 🔍 Testing Auto-Update

### **Development Testing:**
```bash
# Enable in development
const autoUpdate = useAutoUpdate({
  enableInDev: true, // Enable for testing
  checkInterval: 1   // Check every 1 minute
});
```

### **Production Testing:**
1. **Deploy current version** to production
2. **Push new commit** to main branch  
3. **Wait 5 minutes** (default check interval)
4. **Banner should appear** automatically
5. **Click "Refresh Now"** → App updates

### **Manual Testing:**
- Use `/debug/auto-update` route (if added)
- Use `AutoUpdateDemo` component
- Check browser console logs

## 🛠️ Troubleshooting

### **No Update Banner Appears:**
1. ✅ Check browser console for GitHub API calls
2. ✅ Verify `VERCEL_GIT_COMMIT_SHA` in build logs
3. ✅ Ensure CSP allows `api.github.com` connections
4. ✅ Check if rate limit exceeded (60 calls/hour)

### **GitHub API Rate Limiting:**
```javascript
// Add GitHub token for higher limits
VITE_GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

### **Build Info Not Available:**
1. ✅ Check vite.config.ts build variables injection
2. ✅ Verify Vercel environment variables
3. ✅ Check browser dev tools → Application → Local Storage

## 🎯 Production Checklist

- ✅ **vercel.json** updated with GitHub API CSP
- ✅ **vite.config.ts** configured for build info injection  
- ✅ **App.tsx** integrated with UpdateNotificationBanner
- ✅ **GitHub repository** is public (or token configured)
- ✅ **Branch protection** rules configured if needed
- ✅ **Environment variables** verified in Vercel dashboard

## 📊 Monitoring & Analytics

### **Console Logging (Development)**
```javascript
🔄 UpdateService initialized
🔍 Checking for updates...
✨ Update available! { current: "01d6922b", latest: "abc12345" }
```

### **Error Handling**
- Network failures gracefully handled
- Rate limit errors logged but not shown to user
- Invalid responses safely ignored

## 🔄 Update Frequency

- **Check Interval**: 5 minutes (configurable)
- **Battery Optimization**: Pause when tab hidden
- **Network Efficiency**: Only checks when tab visible
- **Cache Management**: Clear cache before refresh

---

## ✅ **READY TO USE!**

Sistem sudah sepenuhnya dikonfigurasi dan siap deploy. Tidak ada setting tambahan yang diperlukan di Vercel dashboard.

**Next Steps:**
1. Push perubahan terbaru ke main branch  
2. Deploy otomatis ke Vercel
3. Test banner dengan push commit selanjutnya
4. Monitor console logs untuk debugging

---

**Last Updated**: September 16, 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅