import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

// --- Impor Hook Konteks ---
import { useBahanBaku } from '@/components/warehouse/context/BahanBakuContext';
import { useSupplier } from "@/contexts/SupplierContext";
import { usePurchase } from "@/components/purchase/context/PurchaseContext";
import { useRecipe } from "@/contexts/RecipeContext";
import { useActivity } from "@/contexts/ActivityContext";
import { useOrder } from "@/components/orders/contexts/OrderContext";
import { useAssets } from "@/contexts/AssetContext";
import { useFinancial } from "@/components/financial/context/FinancialContext";
import { useUserSettings } from '@/contexts/UserSettingsContext';

// --- Impor Fungsi Export ---
import { exportAllDataToExcel } from "@/lib/exportUtils";

const MobileExportButton = () => {
  // Panggil semua hook untuk mendapatkan data yang akan diekspor
  const { settings } = useUserSettings();
  const { bahanBaku } = useBahanBaku();
  const { suppliers } = useSupplier();
  const { purchases } = usePurchase();
  const { recipes, hppResults } = useRecipe();
  const { activities } = useActivity();
  const { orders } = useOrder();
  const { assets } = useAssets();
  const { financialTransactions } = useFinancial();

  const handleExport = () => {
    const allAppData = {
      bahanBaku,
      suppliers,
      purchases,
      recipes,
      hppResults,
      activities,
      orders,
      assets,
      financialTransactions,
    };
    
    // Panggil fungsi ekspor dengan nama bisnis dari pengaturan
    exportAllDataToExcel(allAppData, settings.businessName);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleExport}
      className="px-2 py-1"
    >
      <Download className="h-4 w-4" />
    </Button>
  );
};

export default MobileExportButton;
