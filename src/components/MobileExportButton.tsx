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
import ExportService from "@/services/export/ExportService";

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

  const handleExport = () => {
    if (assetsLoading) return;
    const bn = (settings?.businessName || 'bisnis_anda').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    ExportService.generateXLSXWorkbook({
      warehouse: bahanBaku,
      suppliers,
      purchases,
      orders,
      recipes,
      financial_transactions: financialTransactions,
      assets,
    }, `semua_data_${bn}.xlsx`);
  };

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleExport}
      className="px-3 py-2 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white font-semibold shadow-md hover:shadow-lg ring-2 ring-offset-2 ring-orange-300"
      disabled={assetsLoading}
      title={assetsLoading ? "Memuat data aset..." : "Export semua data"}
    >
      <Download className="h-4 w-4 mr-2" />
      Export
    </Button>
  );
};

export default MobileExportButton;
