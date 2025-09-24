#!/usr/bin/env python3
import os
import re
import sys

def update_currency_imports(file_path):
    """Update a single file to use useCurrency hook instead of formatCurrency from shared"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Skip if already has useCurrency
        if 'useCurrency' in content:
            print(f"  Already has useCurrency - skipping {file_path}")
            return False
            
        # Skip if doesn't use formatCurrency from shared
        if "formatCurrency.*from '@/lib/shared'" not in content:
            print(f"  No formatCurrency from shared - skipping {file_path}")
            return False
            
        original_content = content
        
        # 1. Remove formatCurrency from shared import
        content = re.sub(r'formatCurrency,\s*', '', content)
        content = re.sub(r',\s*formatCurrency', '', content)
        content = re.sub(r"import\s*{\s*formatCurrency\s*}\s*from\s*'@/lib/shared';\s*\n", '', content)
        
        # 2. Add useCurrency import after existing imports
        import_pattern = r"(import.*from.*['\"]\@/.*['\"];?\s*\n)"
        if re.search(import_pattern, content):
            content = re.sub(
                import_pattern,
                r"\1import { useCurrency } from '@/contexts/CurrencyContext';\n",
                content,
                count=1
            )
        
        # 3. Find component function and add useCurrency hook
        # Look for React component patterns
        component_patterns = [
            r'(const\s+\w+:\s*React\.FC.*?=\s*\([^)]*\)\s*=>\s*{)',
            r'(function\s+\w+\s*\([^)]*\)\s*{)',
            r'(export\s+const\s+\w+.*?=\s*\([^)]*\)\s*=>\s*{)'
        ]
        
        for pattern in component_patterns:
            if re.search(pattern, content):
                content = re.sub(
                    pattern,
                    r'\1\n  const { formatCurrency } = useCurrency();',
                    content,
                    count=1
                )
                break
        
        # Only write if content changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✅ Updated {file_path}")
            return True
        else:
            print(f"  No changes needed for {file_path}")
            return False
            
    except Exception as e:
        print(f"  ❌ Error updating {file_path}: {e}")
        return False

def main():
    # Files that need updating
    files_to_update = [
        "/Users/mymac/Projects/BISMILLAH/src/components/financial/components/FinancialCharts.tsx",
        "/Users/mymac/Projects/BISMILLAH/src/components/financial/components/DailySummaryWidget.tsx", 
        "/Users/mymac/Projects/BISMILLAH/src/components/dashboard/BestSellingProducts.tsx",
        "/Users/mymac/Projects/BISMILLAH/src/components/promoCalculator/analytics/PromoAnalytics.tsx",
        "/Users/mymac/Projects/BISMILLAH/src/components/orders/components/dialogs/OrderDetailDialog.tsx",
        "/Users/mymac/Projects/BISMILLAH/src/components/orders/components/dialogs/BulkOperationsDialog.tsx"
    ]
    
    print("🚀 Starting bulk currency update...")
    updated_count = 0
    
    for file_path in files_to_update:
        if os.path.exists(file_path):
            print(f"\n📝 Processing {os.path.basename(file_path)}...")
            if update_currency_imports(file_path):
                updated_count += 1
        else:
            print(f"  ⚠️  File not found: {file_path}")
    
    print(f"\n✅ Bulk update completed! Updated {updated_count} files.")

if __name__ == "__main__":
    main()
