// src/components/operational-costs/OperationalCostPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, DollarSign, Settings, Info, Package, TrendingUp, AlertTriangle, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { OperationalCostProvider, useOperationalCost } from './context';
import { formatCurrency, formatDate } from './utils/costHelpers';
import { OperationalCost, AppSettings, CostFormData } from './types/operationalCost.types';
import { CostFormDialog } from './components/CostFormDialog';
import { useOperationalCostTable } from './hooks/useOperationalCostTable';
import { useOperationalCostBulkNew } from './hooks/useOperationalCostBulkNew';
import { appSettingsApi } from './services/appSettingsApi';
import { 
  ProgressSetup, 
  OnboardingModal, 
  OperationalCostHeader, 
  CostManagementTab, 
  BulkActionsNew
} from './components';
import { BulkEditDialog, BulkDeleteDialog } from './dialogs';
import { QuickSetupTemplates } from './components/QuickSetupTemplates';
import { type CostTemplate } from './utils/smartDefaults';
import { toast } from 'sonner';

const OperationalCostContent: React.FC = () => {
  const { state, actions } = useOperationalCost();
  
  const [productionTarget, setProductionTarget] = useState(3000);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCost, setEditingCost] = useState<OperationalCost | null>(null);
  const [activeTab, setActiveTab] = useState('costs'); // 'costs' or 'calculator'
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0);
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'updated' | 'error'>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // ✅ Use ref to prevent infinite loops
  const appSettingsRef = useRef<AppSettings | null>(null);
  const loadAppSettingsRef = useRef<(() => Promise<void>) | null>(null);

  // Bulk operations
  const {
    selectedIds,
    selectedCosts,
    isSelectionMode,
    isAllSelected,
    toggleCostSelection,
    selectAllCosts,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelectionMode,
  } = useOperationalCostTable(state.costs);

  // New bulk operations hook
  const {
    isBulkEditDialogOpen,
    isBulkDeleteDialogOpen,
    isProcessing,
    openBulkEditDialog,
    closeBulkEditDialog,
    openBulkDeleteDialog,
    closeBulkDeleteDialog,
    executeBulkDelete,
    executeBulkEdit,
  } = useOperationalCostBulkNew();

  // Auto-refresh data when component mounts
  useEffect(() => {
    if (state.isAuthenticated) {
      actions.loadCosts();
      // Load app settings
      loadAppSettings();
    }
  }, [state.isAuthenticated]);

  // ✅ NEW: Contextual onboarding - show quick setup for empty state
  const shouldShowQuickSetupHint = state.isAuthenticated && 
    !state.loading.costs && 
    state.costs.length === 0 && 
    !localStorage.getItem('operational-costs-onboarding-seen') &&
    !localStorage.getItem('operational-costs-onboarding-skipped');


  // Load app settings
  const loadAppSettings = async () => {
    try {
      const response = await appSettingsApi.getSettings();
      if (response.data) {
        setAppSettings(response.data);
        appSettingsRef.current = response.data;
        setProductionTarget(response.data.target_output_monthly);
      }
    } catch (error) {
      console.error('Error loading app settings:', error);
    }
  };
  
  // ✅ Store loadAppSettings in ref to prevent dependency issues
  loadAppSettingsRef.current = loadAppSettings;

  // Auto-refresh after CRUD operations
  useEffect(() => {
    if (state.isAuthenticated && !state.loading.costs) {
      actions.loadCosts();
    }
  }, [state.costs.length]); // Refresh when costs count changes

  // Calculate totals with dual-mode support
  const totalMonthlyCosts = state.summary?.total_biaya_aktif || 0;
  const hppCosts = state.summary?.total_hpp_group || 0;
  const operasionalCosts = state.summary?.total_operasional_group || 0;
  const costPerProduct = productionTarget > 0 ? totalMonthlyCosts / productionTarget : 0;

  // Auto-calculate overhead and operasional per pcs when costs or target change
  useEffect(() => {
    if (!state.isAuthenticated) return;
    if (state.loading.costs) return;

    // IMPORTANT: Ensure app settings are loaded before computing.
    // Otherwise we might accidentally overwrite target_output_monthly with a default value.
    const currentAppSettings = appSettingsRef.current;
    if (!currentAppSettings) return;

    const target = currentAppSettings.target_output_monthly;
    if (target <= 0) return;

    const computedOverhead = hppCosts / target;
    const computedOperasional = operasionalCosts / target;

    const currentOverhead = currentAppSettings.overhead_per_pcs ?? 0;
    const currentOperasional = currentAppSettings.operasional_per_pcs ?? 0;

    // Avoid unnecessary updates (epsilon compare)
    const EPS = 0.0001;
    const isSameOverhead = Math.abs(computedOverhead - currentOverhead) < EPS;
    const isSameOperasional = Math.abs(computedOperasional - currentOperasional) < EPS;
    if (isSameOverhead && isSameOperasional) return;

    const t = setTimeout(async () => {
      try {
        setSyncStatus('syncing');
        // Only update computed per-unit costs here. Do NOT pass target to avoid overwriting
        // a freshly-updated target_output_monthly with a stale value.
        await appSettingsApi.updateCostPerUnit(
          computedOverhead,
          computedOperasional
        );
        await loadAppSettingsRef.current?.();
        setSyncStatus('updated');
        setLastSyncedAt(new Date().toISOString());
        // Show toast on significant change
        const overheadDeltaAbs = Math.abs(computedOverhead - currentOverhead);
        const operasionalDeltaAbs = Math.abs(computedOperasional - currentOperasional);
        const overheadDeltaPct = currentOverhead > 0 ? overheadDeltaAbs / currentOverhead : 1;
        const operasionalDeltaPct = currentOperasional > 0 ? operasionalDeltaAbs / currentOperasional : 1;
        const significant = (overheadDeltaAbs >= 50 || overheadDeltaPct >= 0.005) || (operasionalDeltaAbs >= 50 || operasionalDeltaPct >= 0.005);
        if (significant) {
          toast.success('Biaya per pcs diperbarui', {
            description: `Overhead: ${formatCurrency(computedOverhead)}/pcs · Operasional: ${formatCurrency(computedOperasional)}/pcs`
          });
        }
      } catch (e) {
        console.error('Auto-update overhead failed:', e);
        setSyncStatus('error');
      }
    }, 400);

    return () => clearTimeout(t);
  }, [state.isAuthenticated, state.loading.costs, hppCosts, operasionalCosts]);

  // Handlers
  const handleOpenAddDialog = () => {
    setEditingCost(null);
    setShowDialog(true);
  };

  const handleOpenEditDialog = (cost: OperationalCost) => {
    setEditingCost(cost);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingCost(null);
  };

  const handleSaveDialog = async (costData: CostFormData) => {
    let success = false;
    
    if (editingCost) {
      // Update existing cost
      success = await actions.updateCost(editingCost.id, costData);
    } else {
      // Create new cost
      success = await actions.createCost({
        ...costData,
        status: 'aktif'
      });
    }
    
    if (success) {
      handleCloseDialog();
      // Data will auto-refresh due to useEffect
    }
    
    return success;
  };

  const handleDeleteCost = async (costId: string) => {
    if (confirm('Yakin ingin menghapus biaya ini?')) {
      const success = await actions.deleteCost(costId);
      if (success) {
        // Data will auto-refresh due to useEffect
      }
    }
  };

  const productionSuggestions = [1000, 2000, 3000, 5000, 8000, 10000];

  // Update target monthly handler
  const handleUpdateTargetMonthly = async (target: number) => {
    try {
      const currentSettings = appSettingsRef.current;
      const overhead = currentSettings?.overhead_per_pcs || 0;
      const operasional = currentSettings?.operasional_per_pcs || 0;
      await appSettingsApi.updateCostPerUnit(overhead, operasional, target);
      await loadAppSettingsRef.current?.();
      setProductionTarget(target);
      toast.success('Target bulanan diperbarui', {
        description: `${target.toLocaleString('id-ID')} pcs/bulan`
      });
    } catch (e) {
      console.error('Gagal memperbarui target bulanan:', e);
      toast.error('Gagal memperbarui target bulanan');
    }
  };

  // Onboarding handlers
  const handleStartOnboarding = () => {
    setShowOnboarding(true);
    setCurrentOnboardingStep(0);
  };

  const handleCompleteOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('operational-costs-onboarding-seen', 'true');
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('operational-costs-onboarding-skipped', 'true');
  };
  
  // ✅ NEW: Handle quick setup from templates
  const handleQuickSetupFromTemplates = async (templates: CostTemplate[]) => {
    let successCount = 0;
    
    for (const template of templates) {
      try {
        const success = await actions.createCost({
          nama_biaya: template.name,
          jumlah_per_bulan: template.estimatedAmount,
          jenis: template.jenis,
          group: template.group,
          status: 'aktif',
          deskripsi: template.description
        });
        if (success) successCount++;
      } catch (error) {
        console.error('Error creating template cost:', error);
      }
    }
    
    if (successCount > 0) {
      // Immediately refresh data so UI updates without manual reload
      await actions.refreshData();
      toast.success(`Setup berhasil!`, {
        description: `${successCount} biaya operasional telah ditambahkan`
      });
      // Mark onboarding as completed
      localStorage.setItem('operational-costs-onboarding-seen', 'true');
    }
  };

  // Quick setup for common cost types
  const handleQuickSetup = async (type: 'bakery' | 'restaurant' | 'cafe') => {
    const costTemplates = {
      bakery: [
        { nama_biaya: 'Gas Oven', jumlah_per_bulan: 500000, jenis: 'tetap' as const, group: 'hpp' as const },
    { nama_biaya: 'Listrik Oven', jumlah_per_bulan: 300000, jenis: 'tetap' as const, group: 'hpp' as const },
    { nama_biaya: 'Sewa Dapur', jumlah_per_bulan: 1000000, jenis: 'tetap' as const, group: 'hpp' as const },
    { nama_biaya: 'Marketing', jumlah_per_bulan: 2000000, jenis: 'variabel' as const, group: 'operasional' as const },
    { nama_biaya: 'Admin/Kasir', jumlah_per_bulan: 1500000, jenis: 'tetap' as const, group: 'operasional' as const }
      ],
      restaurant: [
        { nama_biaya: 'Gas Kompor', jumlah_per_bulan: 400000, jenis: 'tetap' as const, group: 'hpp' as const },
    { nama_biaya: 'Sewa Dapur', jumlah_per_bulan: 1500000, jenis: 'tetap' as const, group: 'hpp' as const },
    { nama_biaya: 'Gaji Koki', jumlah_per_bulan: 3000000, jenis: 'tetap' as const, group: 'hpp' as const },
    { nama_biaya: 'Marketing', jumlah_per_bulan: 3000000, jenis: 'variabel' as const, group: 'operasional' as const },
    { nama_biaya: 'Internet & Listrik Toko', jumlah_per_bulan: 500000, jenis: 'tetap' as const, group: 'operasional' as const }
      ],
      cafe: [
        { nama_biaya: 'Listrik Coffee Machine', jumlah_per_bulan: 200000, jenis: 'tetap' as const, group: 'hpp' as const },
    { nama_biaya: 'Sewa Tempat', jumlah_per_bulan: 2000000, jenis: 'tetap' as const, group: 'operasional' as const },
    { nama_biaya: 'Gaji Barista', jumlah_per_bulan: 2500000, jenis: 'tetap' as const, group: 'hpp' as const },
    { nama_biaya: 'Marketing & Promo', jumlah_per_bulan: 1500000, jenis: 'variabel' as const, group: 'operasional' as const },
    { nama_biaya: 'Internet & Musik', jumlah_per_bulan: 300000, jenis: 'tetap' as const, group: 'operasional' as const }
      ]
    };

    const templates = costTemplates[type];
    let successCount = 0;

    for (const template of templates) {
      try {
        const success = await actions.createCost({ ...template, status: 'aktif' });
        if (success) successCount++;
      } catch (error) {
        console.error('Error creating template cost:', error);
      }
    }

    if (successCount > 0) {
      // Refresh to ensure UI reflects new costs immediately
      await actions.refreshData();
      toast.success(`Setup ${type} berhasil!`, {
        description: `${successCount} biaya contoh telah ditambahkan. Silakan edit sesuai kebutuhan.`
      });
      handleCompleteOnboarding();
    }
  };

  // Loading state
  if (state.loading.auth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-3 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  // Auth check
  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="h-12 w-12 text-red-500 mx-auto mb-4 text-4xl">🔒</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Akses Terbatas</h2>
          <p className="text-gray-600 mb-4">
            Anda perlu login untuk mengakses halaman ini.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Refresh Halaman
          </button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
      {/* ❌ REMOVED: Heavy modal onboarding */}
      <OperationalCostHeader
        onStartOnboarding={() => setShowQuickSetup(true)}
        onOpenAddDialog={shouldShowQuickSetupHint ? () => setShowQuickSetup(true) : handleOpenAddDialog}
        appSettings={appSettings}
        onUpdateTarget={async (target) => {
          await handleUpdateTargetMonthly(target);
        }}
      />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Progress Setup - Moved to Header */}
        {/* ✅ NEW: Contextual empty state with hints */}
        {shouldShowQuickSetupHint ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                🚀
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Selamat datang di Biaya Operasional!
              </h3>
              <p className="text-gray-600 mb-6">
                Mulai dengan menambahkan biaya operasional pertama Anda. Kami punya template siap pakai untuk berbagai jenis usaha.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => setShowQuickSetup(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  🎆 Setup Cepat dengan Template
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenAddDialog}
                >
                  + Tambah Manual
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipOnboarding}
                  className="text-gray-500"
                >
                  Skip untuk sekarang
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <ProgressSetup costs={state.costs} appSettings={appSettings} />
        )}
        
        {/* Tabs for Cost Management */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="costs" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Kelola Biaya
            </TabsTrigger>
          </TabsList>

          {/* Tab Content: Cost Management */}
          <TabsContent value="costs" className="space-y-6">
            <BulkActionsNew
              selectedCosts={selectedCosts}
              selectedIds={selectedIds}
              onClearSelection={clearSelection}
              onSelectAll={selectAllCosts}
              isAllSelected={isAllSelected}
              totalCount={state.costs.length}
              onBulkEdit={openBulkEditDialog}
              onBulkDelete={openBulkDeleteDialog}
              isProcessing={isProcessing}
            />
            <CostManagementTab
              costs={state.costs}
              totalMonthlyCosts={totalMonthlyCosts}
              hppCosts={state.costs.filter(c => c.group === 'hpp' && c.status === 'aktif').reduce((sum, c) => sum + c.jumlah_per_bulan, 0)}
        operationalCosts={state.costs.filter(c => c.group === 'operasional' && c.status === 'aktif').reduce((sum, c) => sum + c.jumlah_per_bulan, 0)}
              onOpenAddDialog={handleOpenAddDialog}
              onEditCost={handleOpenEditDialog}
              onDeleteCost={handleDeleteCost}
              selectedIds={selectedIds}
              onSelectionChange={toggleCostSelection}
              isSelectionMode={isSelectionMode}
              onSelectAll={selectAllCosts}
              isAllSelected={isAllSelected}
              onToggleSelectionMode={toggleSelectionMode}
            />
          </TabsContent>

        </Tabs>

      </div>

      {/* Cost Form Dialog */}
      <CostFormDialog
        isOpen={showDialog}
        onClose={handleCloseDialog}
        onSave={handleSaveDialog}
        cost={editingCost}
        isLoading={state.loading.costs}
      />
      
      {/* ✅ NEW: Quick Setup Templates Dialog */}
      <Dialog open={showQuickSetup} onOpenChange={(open) => !open && setShowQuickSetup(false)}>
        <DialogContent className="sm:max-w-[700px] max-w-[95vw] w-full max-h-[90vh] p-0">
          <div className="p-6">
            <QuickSetupTemplates
              onAddCosts={handleQuickSetupFromTemplates}
              onClose={() => setShowQuickSetup(false)}
              isLoading={state.loading.costs}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        isOpen={isBulkEditDialogOpen}
        onClose={closeBulkEditDialog}
        onConfirm={(editData: any) => executeBulkEdit(selectedIds, editData)}
        selectedCosts={selectedCosts}
        isProcessing={isProcessing}
      />
      
      {/* Bulk Delete Dialog */}
      <BulkDeleteDialog
        isOpen={isBulkDeleteDialogOpen}
        onClose={closeBulkDeleteDialog}
        onConfirm={() => executeBulkDelete(selectedIds)}
        selectedCosts={selectedCosts}
        isProcessing={isProcessing}
      />
    </div>
    </TooltipProvider>
  );
};

const OperationalCostPage: React.FC = () => {
  return (
    <OperationalCostProvider>
      <OperationalCostContent />
    </OperationalCostProvider>
  );
};

export default OperationalCostPage;
