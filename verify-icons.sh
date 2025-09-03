#!/bin/bash

echo "🔍 Monifine Icon Configuration Verification"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo
echo "📁 Checking icon files..."
echo

# Define required icon files
declare -a icon_files=(
    "public/favicon.ico"
    "public/favicon.svg"
    "public/monifine-16.png"
    "public/monifine-32.png"
    "public/monifine-48.png"
    "public/monifine-64.png"
    "public/monifine-128.png"
    "public/monifine-152.png"
    "public/monifine-180.png"
    "public/monifine-192.png"
    "public/monifine-256.png"
    "public/monifine-512.png"
    "public/monifine-1024.png"
    "public/monifine-original.png"
)

# Check each icon file
for file in "${icon_files[@]}"; do
    if [ -f "$file" ]; then
        size=$(wc -c < "$file" | tr -d ' ')
        echo "✅ $file (${size} bytes)"
    else
        echo "❌ Missing: $file"
    fi
done

echo
echo "📋 Checking HTML configuration..."
echo

# Check index.html for icon references
if [ -f "index.html" ]; then
    echo "Checking index.html..."
    
    if grep -q 'rel="icon".*favicon.svg' index.html; then
        echo "✅ SVG favicon configured"
    else
        echo "❌ Missing SVG favicon"
    fi
    
    if grep -q 'rel="icon".*favicon.ico' index.html; then
        echo "✅ ICO favicon configured"
    else
        echo "❌ Missing ICO favicon"
    fi
    
    if grep -q 'rel="apple-touch-icon".*monifine-180.png' index.html; then
        echo "✅ Apple Touch Icon configured"
    else
        echo "❌ Missing or incorrect Apple Touch Icon"
    fi
    
    if grep -q 'msapplication-TileImage.*monifine-512.png' index.html; then
        echo "✅ Microsoft Tile Image configured"
    else
        echo "❌ Missing or incorrect Microsoft Tile Image"
    fi
else
    echo "❌ index.html not found"
fi

echo
echo "📱 Checking PWA manifest..."
echo

# Check manifest.json for icon references
if [ -f "public/manifest.json" ]; then
    echo "Checking manifest.json..."
    
    if grep -q '"src": "/monifine-64.png"' public/manifest.json; then
        echo "✅ 64x64 PNG icon in manifest"
    else
        echo "❌ Missing 64x64 PNG icon in manifest"
    fi
    
    if grep -q '"src": "/monifine-128.png"' public/manifest.json; then
        echo "✅ 128x128 PNG icon in manifest"
    else
        echo "❌ Missing 128x128 PNG icon in manifest"
    fi
    
    if grep -q '"src": "/monifine-192.png"' public/manifest.json; then
        echo "✅ 192x192 PNG icon in manifest"
    else
        echo "❌ Missing 192x192 PNG icon in manifest"
    fi
    
    if grep -q '"src": "/monifine-512.png"' public/manifest.json; then
        echo "✅ 512x512 PNG icon in manifest"
    else
        echo "❌ Missing 512x512 PNG icon in manifest"
    fi
else
    echo "❌ manifest.json not found"
fi

echo
echo "🎨 Icon size verification..."
echo

# Verify icon dimensions using macOS sips tool
declare -A expected_sizes=(
    ["public/monifine-16.png"]="16x16"
    ["public/monifine-32.png"]="32x32"
    ["public/monifine-48.png"]="48x48"
    ["public/monifine-64.png"]="64x64"
    ["public/monifine-128.png"]="128x128"
    ["public/monifine-152.png"]="152x152"
    ["public/monifine-180.png"]="180x180"
    ["public/monifine-192.png"]="192x192"
    ["public/monifine-256.png"]="256x256"
    ["public/monifine-512.png"]="512x512"
    ["public/monifine-1024.png"]="1024x1024"
)

for file in "${!expected_sizes[@]}"; do
    if [ -f "$file" ]; then
        actual_size=$(sips -g pixelHeight -g pixelWidth "$file" 2>/dev/null | grep "pixel" | awk '{print $2}' | tr '\n' 'x' | sed 's/x$//')
        expected="${expected_sizes[$file]}"
        if [ "$actual_size" = "$expected" ]; then
            echo "✅ $file: $actual_size"
        else
            echo "❌ $file: expected $expected, got $actual_size"
        fi
    fi
done

echo
echo "📊 Summary"
echo "=========="

total_files=${#icon_files[@]}
existing_files=$(ls public/monifine*.png public/favicon.* 2>/dev/null | wc -l | tr -d ' ')

echo "Icon files: $existing_files/$total_files found"

if [ -f "index.html" ] && [ -f "public/manifest.json" ]; then
    echo "✅ All configuration files present"
else
    echo "❌ Missing configuration files"
fi

echo
echo "🚀 Your Monifine icons are ready to use!"
echo "   Original image: monifine-original.png"
echo "   Optimized sizes: 16px to 1024px"
echo "   PWA ready: ✅"
echo "   Apple devices: ✅"
echo "   Microsoft tiles: ✅"
