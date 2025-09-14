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
vercel env add VITE_RECAPTCHA_SITEKEY production <<< "6Lcv_MgrAAAAAEqyzwMCpPeLos-UZikvWYS98Zm2"
vercel env add RECAPTCHA_SECRET_KEY production <<< "6Lcv_MgrAAAAALThVfcTFwED8YnPVvu9lxMtaepF"

echo "📝 Setting Preview Environment Variables..."

vercel env add VITE_CAPTCHA_ENABLED preview <<< "true"
vercel env add VITE_RECAPTCHA_SITEKEY preview <<< "6Lcv_MgrAAAAAEqyzwMCpPeLos-UZikvWYS98Zm2"
vercel env add RECAPTCHA_SECRET_KEY preview <<< "6Lcv_MgrAAAAALThVfcTFwED8YnPVvu9lxMtaepF"

echo "✅ Environment variables synced to Vercel!"
echo ""
echo "🔄 Next steps:"
echo "1. Redeploy your application on Vercel"
echo "2. Check that CAPTCHA is working in production"
echo "3. Verify in browser console that VITE_CAPTCHA_ENABLED shows as 'true'"

echo ""
echo "📋 To check current Vercel environment variables:"
echo "vercel env ls"
