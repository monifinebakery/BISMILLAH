// src/pages/ExportPage.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { exportAllDataToExcel } from '@/utils/exportUtils';
import { useBahanBaku } from '@/components/warehouse/context/WarehouseContext';
import type { BahanBakuFrontend } from '@/components/warehouse/types';
import { useRecipe } from '@/contexts/RecipeContext';
import { useOrder } from '@/components/orders/context/OrderContext';
import { usePurchase } from '@/components/purchase/hooks/usePurchase';
import { useFinancial } from '@/components/financial/contexts/FinancialContext';
import { useOperationalCostRefactored } from '@/components/operational-costs/context/OperationalCostContextRefactored';
import { usePromo } from '@/components/promoCalculator/context/PromoContext';
import { useAssetQuery } from '@/components/assets';
import { useSupplier } from '@/contexts/SupplierContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';

const ExportPage: React.FC = () => {
  const navigate = useNavigate();
  // Warehouse data (defensive access similar to AppSidebar)
  let bahanBaku: BahanBakuFrontend[] = [];
  try {
    const warehouseContext = useBahanBaku();
    bahanBaku = warehouseContext?.bahanBaku || [];
  } catch (error) {
    console.warn('Failed to get warehouse data in ExportPage:', error);
    bahanBaku = [];
  }
  const { recipes } = useRecipe();
  const { orders } = useOrder();
  const { purchases } = usePurchase();
  const { activities } = useActivity();
  const { suppliers } = useSupplier();
  const { financialTransactions } = useFinancial();
  const { state: opState } = useOperationalCostRefactored();
  const { promos } = usePromo();
  const { user } = useAuth();
  const { settings } = useUserSettings();
  const { assets, isLoading: assetsLoading } = useAssetQuery({ userId: user?.id, enableRealtime: false });

  const handleExportAll = async () => {
    if (assetsLoading) return;
    const allData = {
      bahanBaku: bahanBaku || [],
      suppliers: suppliers || [],
      purchases: purchases || [],
      orders: orders || [],
      recipes: recipes || [],
      hppResults: [],
      promos: promos || [],
      operationalCosts: opState?.costs || [],
      allocationSettings: opState?.allocationSettings || null,
      activities: activities || [],
      financialTransactions: financialTransactions || [],
      assets: assets || [],
      invoices: [],
      whatsappTemplates: {},
    } as any;

    await exportAllDataToExcel(allData, settings?.businessName || 'Monifine', 'xlsx');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Export Data</h1>
              <p className="text-white/80 text-xs">Unduh data penting Anda (Excel/CSV)</p>
            </div>
          </div>
          <Button variant="outline" className="bg-white text-green-700 hover:bg-white/90" onClick={() => navigate('/menu')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-700" /> Export Keseluruhan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleExportAll} disabled={assetsLoading} className="w-full justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed">
              <Download className="h-4 w-4" /> {assetsLoading ? 'Memuat data aset...' : 'Export Semua Data (Excel)'}
            </Button>
            <p className="text-xs text-gray-500 mt-2">Semua dataset akan diekspor ke file Excel dengan banyak sheet (Gudang, Supplier, Pembelian, Pesanan, Resep, Biaya Operasional, Keuangan, Aset, dll.).</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExportPage;
