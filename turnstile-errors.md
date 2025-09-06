# Cloudflare Turnstile Error Codes

## Error Code 600010

**Error**: `600010`
**Type**: Domain Configuration Error  
**Cause**: The sitekey is not configured for the current domain

### Common Causes:
1. **Domain Mismatch**: The Cloudflare Turnstile widget is configured for a different domain
2. **Localhost Not Allowed**: Development domain (localhost) is not included in allowed domains
3. **Missing Domain**: No domains configured for the sitekey

### Solutions:

#### Option 1: Add localhost to allowed domains (Recommended)
1. Go to [Cloudflare Turnstile Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Turnstile** section
3. Find your widget with sitekey: `0x4AAAAAABvpDKhb8eM31rVE`
4. Click **Edit** or **Settings**
5. In **Domains** section, add:
   - `localhost`
   - `127.0.0.1`
   - `localhost:5174` (if port-specific)
   - `*.localhost` (wildcard)

#### Option 2: Use Cloudflare's Test Sitekeys
For development/testing purposes:

- **Always Pass**: `0x4AAAAAAAjlTNjQR6_j6mGA`
- **Always Fail**: `0x4AAAAAAAjlTNjTmaJdaH-Q`
- **Force Interactive**: `0x4AAAAAAAAgCKY8qCgtKd_g`

#### Option 3: Disable CAPTCHA for Development
Set `VITE_CAPTCHA_ENABLED=false` in `.env.development`

### Current Configuration:
- **Environment**: Development (`localhost:5174`)
- **Sitekey**: `0x4AAAAAABvpDKhb8eM31rVE`
- **CAPTCHA Enabled**: `false` (recommended for dev)

### Debug Steps:
1. Check browser console for detailed error
2. Verify domain configuration in Cloudflare
3. Test with demo sitekey first
4. Use conditional CAPTCHA rendering
