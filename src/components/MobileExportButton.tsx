import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

// --- Import Hook Contexts ---
import { useBahanBaku } from '@/components/warehouse/context/WarehouseContext';
import { useSupplier } from "@/contexts/SupplierContext";
import { usePurchase } from "@/components/purchase/hooks/usePurchase";
import { useRecipe } from "@/contexts/RecipeContext";
import { useActivity } from "@/contexts/ActivityContext";
import { useOrder } from "@/components/orders/context/OrderContext";
import { useFinancial } from "@/components/financial/contexts/FinancialContext";
import type { BahanBakuFrontend } from "@/components/warehouse/types";
import type { FinancialTransaction } from "@/components/financial/types/financial";
import { useUserSettings } from '@/contexts/UserSettingsContext';

// ✅ RESTORED: Import modular asset hooks (nested QueryClient fixed)
import { useAssetQuery } from "@/components/assets";
import { useAuth } from '@/contexts/AuthContext';

// --- Import Export Functions ---
import { exportAllDataToExcel } from "@/utils/exportUtils";

const MobileExportButton = () => {
  // Get user for asset query
  const { user } = useAuth();
  
  // Call all hooks to get data for export
  const { settings } = useUserSettings();
  
  // Add defensive check for useBahanBaku
  let bahanBaku: BahanBakuFrontend[] = [];
  try {
    const warehouseContext = useBahanBaku();
    bahanBaku = warehouseContext?.bahanBaku || [];
  } catch (error) {
    console.warn('Failed to get warehouse data in MobileExportButton:', error);
    bahanBaku = [];
  }
  const { suppliers } = useSupplier();
  const { purchases } = usePurchase();
  const { recipes } = useRecipe();
  // Note: hppResults may not be available in current context
  const { activities } = useActivity();
  const { orders } = useOrder();
  
  // ✅ FIXED: Defensive error handling for useFinancial hook (similar to useBahanBaku)
  let financialTransactions: FinancialTransaction[] = [];
  try {
    const financialContext = useFinancial();
    financialTransactions = financialContext?.financialTransactions || [];
  } catch (error) {
    console.warn('Failed to get financial data in MobileExportButton:', error);
    financialTransactions = [];
  }
  
  // ✅ RESTORED: Use modular asset hook (nested QueryClient fixed)
  const { assets, isLoading: assetsLoading } = useAssetQuery({ 
    userId: user?.id,
    enableRealtime: false // No need for realtime in export
  });

  const handleExport = (format: 'xlsx' | 'csv' = 'xlsx') => {
    // Check if assets are still loading
    if (assetsLoading) {
      return; // Could show loading toast here
    }

    const allAppData = {
      bahanBaku,
      suppliers,
      purchases,
      recipes,
      activities,
      orders,
      assets, // Will be empty array during debug
      financialTransactions,
    };

    // Call export function with business name from settings
    exportAllDataToExcel(allAppData, settings.businessName, format);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleExport('xlsx')}
      className="px-2 py-1"
      disabled={assetsLoading}
      title={assetsLoading ? "Memuat data aset..." : "Export semua data"}
    >
      <Download className="h-4 w-4" />
    </Button>
  );
};

export default MobileExportButton;
