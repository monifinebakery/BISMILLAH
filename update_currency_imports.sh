#!/bin/bash

# Script to update all components using formatCurrency from shared to useCurrency hook

echo "Updating currency imports and usage..."

# Find all files using formatCurrency from shared
FILES=$(find /Users/mymac/Projects/BISMILLAH/src -name "*.tsx" -o -name "*.ts" | grep -v node_modules | xargs grep -l "formatCurrency.*from '@/lib/shared'" 2>/dev/null || true)

for file in $FILES; do
    echo "Processing $file..."
    
    # Skip already processed files
    if grep -q "useCurrency" "$file"; then
        echo "  Already has useCurrency - skipping"
        continue
    fi
    
    # Add useCurrency import
    if grep -q "import.*from '@/lib/shared'" "$file"; then
        # Update existing shared import
        sed -i '' "s|formatCurrency, formatPercentage|formatPercentage|g" "$file"
        sed -i '' "s|import { formatCurrency } from '@/lib/shared';||g" "$file"
        sed -i '' "s|import { formatPercentage } from '@/lib/shared';|import { formatPercentage } from '@/lib/shared';\
import { useCurrency } from '@/contexts/CurrencyContext';|g" "$file"
    else
        # Add new import after existing imports
        sed -i '' "/^import.*from/a\\
import { useCurrency } from '@/contexts/CurrencyContext';" "$file"
    fi
    
    # Add useCurrency hook to component
    if grep -q "const.*=.*{" "$file" && grep -q "formatCurrency" "$file"; then
        # Find the component function and add useCurrency hook
        sed -i '' "/const.*=.*{/a\\
  const { formatCurrency } = useCurrency();" "$file"
    fi
    
    echo "  Updated $file"
done

echo "Currency import updates completed!"
