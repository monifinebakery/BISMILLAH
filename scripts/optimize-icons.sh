#!/bin/bash

echo "🎨 Optimizing Monifine Original Image for Icons"
echo "==============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Source image
SOURCE_IMAGE="/Users/mymac/Projects/BISMILLAH/public/monifine-original.png"
PUBLIC_DIR="/Users/mymac/Projects/BISMILLAH/public"

# Check if source image exists
if [[ ! -f "$SOURCE_IMAGE" ]]; then
    echo -e "❌ Source image not found: $SOURCE_IMAGE"
    exit 1
fi

echo -e "${BLUE}📱 Source image found:${NC}"
echo "  File: $(basename "$SOURCE_IMAGE")"
echo "  Size: $(ls -lah "$SOURCE_IMAGE" | awk '{print $5}')"
echo ""

# Get original dimensions
ORIGINAL_SIZE=$(sips -g pixelWidth -g pixelHeight "$SOURCE_IMAGE" 2>/dev/null | tail -2 | awk '{print $2}' | tr '\n' 'x' | sed 's/x$//')
echo -e "${BLUE}📐 Original dimensions:${NC} $ORIGINAL_SIZE"
echo ""

echo -e "${YELLOW}🔄 Creating optimized versions...${NC}"
echo ""

# Array of sizes to create: "size:filename:description"
declare -a sizes=(
    "16:monifine-16.png:Favicon 16px"
    "32:monifine-32.png:Favicon 32px" 
    "48:monifine-48.png:Windows Icon 48px"
    "64:monifine-64.png:Windows Icon 64px"
    "128:monifine-128.png:Mac Icon 128px"
    "152:monifine-152.png:iPad Touch Icon"
    "180:monifine-180.png:iPhone Touch Icon"
    "192:monifine-192.png:PWA Android Icon"
    "256:monifine-256.png:Windows Store Icon"
    "512:monifine-512.png:PWA Large Icon"
    "1024:monifine-1024.png:Mac App Store Icon"
)

# Process each size
for size_info in "${sizes[@]}"
do
    size=$(echo $size_info | cut -d':' -f1)
    filename=$(echo $size_info | cut -d':' -f2)
    description=$(echo $size_info | cut -d':' -f3)
    
    output_path="$PUBLIC_DIR/$filename"
    
    echo -e "  📏 Creating ${GREEN}${description}${NC} (${size}x${size}px)..."
    
    # Use sips to resize
    sips -z $size $size "$SOURCE_IMAGE" --out "$output_path" > /dev/null 2>&1
    
    if [[ -f "$output_path" ]]; then
        file_size=$(ls -lah "$output_path" | awk '{print $5}')
        echo -e "     ✅ ${GREEN}$filename${NC} created ($file_size)"
    else
        echo -e "     ❌ Failed to create $filename"
    fi
done

echo ""
echo -e "${BLUE}🔧 Creating ICO favicon...${NC}"

# Create multi-size ICO file (if we have ImageMagick)
if command -v magick >/dev/null 2>&1; then
    magick "$PUBLIC_DIR/monifine-16.png" "$PUBLIC_DIR/monifine-32.png" "$PUBLIC_DIR/monifine-48.png" "$PUBLIC_DIR/favicon-new.ico" 2>/dev/null
    if [[ -f "$PUBLIC_DIR/favicon-new.ico" ]]; then
        echo -e "     ✅ ${GREEN}favicon-new.ico${NC} created with multiple sizes"
    fi
else
    echo -e "     ${YELLOW}⚠️  ImageMagick not found, skipping ICO creation${NC}"
fi

echo ""
echo -e "${BLUE}📊 Generated icon files:${NC}"
echo ""
ls -la "$PUBLIC_DIR"/monifine-*.png 2>/dev/null | while read line; do
    echo "  $line"
done

echo ""
echo -e "${GREEN}✨ Icon optimization complete!${NC}"
echo ""
echo -e "${BLUE}📱 Usage recommendations:${NC}"
echo "  • favicon.ico: Use existing or favicon-new.ico for browser compatibility"
echo "  • monifine-180.png: Perfect for Apple Touch Icon"
echo "  • monifine-192.png: Ideal for PWA Android"
echo "  • monifine-512.png: Great for PWA large icon and splash screens"
echo "  • Original monifine-original.png: Keep for high-res displays"
echo ""
