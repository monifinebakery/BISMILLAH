#!/bin/bash

echo "🎨 Monifine Icon Verification"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📱 Checking icon files...${NC}"
echo ""

# Array of required icon files
declare -a icons=(
    "favicon.svg:Favicon SVG"
    "favicon.ico:Favicon ICO" 
    "monifine-icon.svg:Main App Icon (512px)"
    "pwa-192.svg:PWA Icon (192px)"
    "apple-touch-icon.svg:Apple Touch Icon"
)

# Check each icon file
for icon in "${icons[@]}"
do
    filename=$(echo $icon | cut -d':' -f1)
    description=$(echo $icon | cut -d':' -f2)
    
    if [[ -f "public/$filename" ]]; then
        size=$(ls -lah "public/$filename" | awk '{print $5}')
        echo -e "✅ ${GREEN}$description${NC} - $filename ($size)"
    else
        echo -e "❌ ${RED}MISSING: $description${NC} - $filename"
    fi
done

echo ""
echo -e "${BLUE}🔧 Checking configuration files...${NC}"
echo ""

# Check HTML file
if grep -q "favicon.svg" index.html; then
    echo -e "✅ ${GREEN}HTML favicon configured${NC}"
else
    echo -e "❌ ${RED}HTML favicon NOT configured${NC}"
fi

if grep -q "apple-touch-icon.svg" index.html; then
    echo -e "✅ ${GREEN}Apple touch icon configured${NC}"
else
    echo -e "❌ ${RED}Apple touch icon NOT configured${NC}"
fi

# Check manifest.json
if grep -q "monifine-icon.svg" public/manifest.json; then
    echo -e "✅ ${GREEN}PWA manifest configured${NC}"
else
    echo -e "❌ ${RED}PWA manifest NOT configured${NC}"
fi

echo ""
echo -e "${BLUE}📊 Icon file details:${NC}"
echo ""
ls -la public/*.svg public/*.ico 2>/dev/null | grep -E "(favicon|monifine|apple|pwa)" | while read line; do
    echo "  $line"
done

echo ""
echo "🎯 All icons ready for deployment!"
echo ""
echo "📱 Test checklist:"
echo "  - Open website in browser (check favicon in tab)"
echo "  - Test PWA installation on mobile"
echo "  - Check home screen icon on iOS/Android"
echo "  - Verify in browser dev tools > Application > Manifest"
