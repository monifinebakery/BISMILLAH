#!/usr/bin/env python3
import os
import re

# Files that are UI components (not utils) and need currency context
ui_components = [
    "/Users/mymac/Projects/BISMILLAH/src/components/financial/components/ProfitLossSimple.tsx",
    "/Users/mymac/Projects/BISMILLAH/src/components/financial/components/UMKMExpenseCategories.tsx", 
    "/Users/mymac/Projects/BISMILLAH/src/components/financial/components/SavingsGoalTracker.tsx",
    "/Users/mymac/Projects/BISMILLAH/src/components/financial/components/TransactionBulkActions.tsx",
    "/Users/mymac/Projects/BISMILLAH/src/components/financial/components/SummaryCards.tsx",
    "/Users/mymac/Projects/BISMILLAH/src/components/financial/components/BulkActions.tsx",
    "/Users/mymac/Projects/BISMILLAH/src/components/financial/components/CategoryCharts.tsx",
    "/Users/mymac/Projects/BISMILLAH/src/components/financial/components/FinancialCharts.tsx"
]

def update_component(file_path):
    """Update a component to use useCurrency hook"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Skip if already has useCurrency
        if 'useCurrency' in content:
            return False
            
        # Skip if doesn't use formatCurrency
        if 'formatCurrency' not in content:
            return False
            
        original_content = content
        
        # 1. Update imports - remove formatCurrency from shared, add useCurrency
        if "from '@/lib/shared'" in content:
            # Remove formatCurrency from shared import
            content = re.sub(r'formatCurrency,\s*', '', content)
            content = re.sub(r',\s*formatCurrency', '', content)
            content = re.sub(r'{\s*formatCurrency\s*}', '{}', content)
            content = re.sub(r"import\s*{\s*}\s*from\s*'@/lib/shared';\s*\n", '', content)
            
            # Add useCurrency import
            import_section = re.search(r"(import.*from.*['\"]\@/.*['\"];?\s*\n)", content)
            if import_section:
                content = content[:import_section.end()] + "import { useCurrency } from '@/contexts/CurrencyContext';\n" + content[import_section.end():]
        
        # 2. Add useCurrency hook to component
        # Look for React component function
        component_match = re.search(r'(const\s+\w+.*?=.*?\([^)]*\)\s*=>\s*{)', content)
        if component_match:
            hook_line = "\n  const { formatCurrency } = useCurrency();"
            content = content[:component_match.end()] + hook_line + content[component_match.end():]
        
        # Write if changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
        
    except Exception as e:
        print(f"Error updating {file_path}: {e}")
        return False

def main():
    print("🚀 Updating remaining UI components to use currency context...")
    updated = 0
    
    for file_path in ui_components:
        if os.path.exists(file_path):
            filename = os.path.basename(file_path)
            print(f"📝 Processing {filename}...")
            if update_component(file_path):
                print(f"  ✅ Updated {filename}")
                updated += 1
            else:
                print(f"  ⏭️  Skipped {filename}")
        else:
            print(f"  ❌ Not found: {file_path}")
    
    print(f"\n✅ Updated {updated} components!")

if __name__ == "__main__":
    main()
