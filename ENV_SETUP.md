# Environment Variables Setup

This project requires environment variables to be configured for different modes (development, production).

## 🔧 Quick Setup

1. **Copy the template files:**
   ```bash
   cp .env.development.template .env.development
   cp .env.production.template .env.production
   ```

2. **Fill in your actual values** in each file:
   - Replace `your_supabase_url_here` with your actual Supabase URL
   - Replace `your_supabase_anon_key_here` with your actual Supabase anonymous key
   - Update other placeholder values as needed

## 📁 File Structure

- `.env` - Base configuration (already ignored by git)
- `.env.development` - Development-specific settings (not committed)
- `.env.production` - Production-specific settings (not committed) 
- `.env.*.template` - Template files (committed to git)

## 🔒 Security

- ✅ **DO**: Use template files for reference
- ✅ **DO**: Keep sensitive values in local `.env.*` files
- ❌ **DON'T**: Commit files containing real API keys
- ❌ **DON'T**: Share environment files publicly

## 🛠️ Required Variables

### Supabase Configuration
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### App Configuration  
```env
VITE_APP_NAME=Kalkulator HPP
```

### Debug Settings (Development)
```env
VITE_DEBUG_LEVEL=verbose
VITE_FORCE_LOGS=true
DEBUG=true
```

### Debug Settings (Production)
```env
VITE_DEBUG_LEVEL=error
VITE_FORCE_LOGS=false
DEBUG=false
```

## 🚨 If You See "Missing VITE_SUPABASE_URL" Error

1. Check that you've created the `.env.development` and `.env.production` files
2. Verify the files contain the correct `VITE_SUPABASE_URL` variable
3. Restart your development server after making changes
