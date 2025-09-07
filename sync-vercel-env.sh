#!/bin/bash

# Sync Environment Variables to Vercel
echo "🔄 Syncing Environment Variables to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not installed. Please install with: npm i -g vercel"
    exit 1
fi

# Set environment variables for production
echo "📝 Setting Production Environment Variables..."

vercel env add VITE_CAPTCHA_ENABLED production <<< "true"
vercel env add VITE_TURNSTILE_SITEKEY production <<< "0x4AAAAAABvpDKhb8eM31rVE"
vercel env add TURNSTILE_SECRET_KEY production <<< "0x4AAAAAABvpDNsvhD1hRu8mGx1MxxJsgLk"

echo "📝 Setting Preview Environment Variables..."

vercel env add VITE_CAPTCHA_ENABLED preview <<< "true"
vercel env add VITE_TURNSTILE_SITEKEY preview <<< "0x4AAAAAABvpDKhb8eM31rVE"
vercel env add TURNSTILE_SECRET_KEY preview <<< "0x4AAAAAABvpDNsvhD1hRu8mGx1MxxJsgLk"

echo "✅ Environment variables synced to Vercel!"
echo ""
echo "🔄 Next steps:"
echo "1. Redeploy your application on Vercel"
echo "2. Check that CAPTCHA is working in production"
echo "3. Verify in browser console that VITE_CAPTCHA_ENABLED shows as 'true'"

echo ""
echo "📋 To check current Vercel environment variables:"
echo "vercel env ls"
