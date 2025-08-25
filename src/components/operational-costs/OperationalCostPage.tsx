// src/components/operational-costs/OperationalCostPage.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Calculator, Edit2, Trash2, DollarSign, Settings, Info, Package, TrendingUp, AlertTriangle, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { appSettingsApi } from './services';
import { 
  ProgressSetup, 
  OnboardingModal, 
  OperationalCostHeader, 
  CostManagementTab, 
  CalculatorTab,
  BulkActionsNew
} from './components';
import { BulkEditDialog, BulkDeleteDialog } from './dialogs';
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

  // Check if user needs onboarding (first time with no costs)
  useEffect(() => {
    if (state.isAuthenticated && !state.loading.costs && state.costs.length === 0) {
      const hasSeenOnboarding = localStorage.getItem('operational-costs-onboarding-seen');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [state.isAuthenticated, state.loading.costs, state.costs.length]);

  // Load app settings
  const loadAppSettings = async () => {
    try {
      const response = await appSettingsApi.getSettings();
      if (response.data) {
        setAppSettings(response.data);
        setProductionTarget(response.data.target_output_monthly);
      }
    } catch (error) {
      console.error('Error loading app settings:', error);
    }
  };

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
    localStorage.setItem('operational-costs-onboarding-seen', 'true');
  };

  // Quick setup for common cost types
  const handleQuickSetup = async (type: 'bakery' | 'restaurant' | 'cafe') => {
    const costTemplates = {
      bakery: [
        { nama_biaya: 'Gas Oven', jumlah_per_bulan: 500000, jenis: 'tetap' as const, group: 'HPP' as const },
        { nama_biaya: 'Listrik Oven', jumlah_per_bulan: 300000, jenis: 'tetap' as const, group: 'HPP' as const },
        { nama_biaya: 'Sewa Dapur', jumlah_per_bulan: 1000000, jenis: 'tetap' as const, group: 'HPP' as const },
        { nama_biaya: 'Marketing', jumlah_per_bulan: 2000000, jenis: 'variabel' as const, group: 'OPERASIONAL' as const },
        { nama_biaya: 'Admin/Kasir', jumlah_per_bulan: 1500000, jenis: 'tetap' as const, group: 'OPERASIONAL' as const }
      ],
      restaurant: [
        { nama_biaya: 'Gas Kompor', jumlah_per_bulan: 400000, jenis: 'tetap' as const, group: 'HPP' as const },
        { nama_biaya: 'Sewa Dapur', jumlah_per_bulan: 1500000, jenis: 'tetap' as const, group: 'HPP' as const },
        { nama_biaya: 'Gaji Koki', jumlah_per_bulan: 3000000, jenis: 'tetap' as const, group: 'HPP' as const },
        { nama_biaya: 'Marketing', jumlah_per_bulan: 3000000, jenis: 'variabel' as const, group: 'OPERASIONAL' as const },
        { nama_biaya: 'Internet & Listrik Toko', jumlah_per_bulan: 500000, jenis: 'tetap' as const, group: 'OPERASIONAL' as const }
      ],
      cafe: [
        { nama_biaya: 'Listrik Coffee Machine', jumlah_per_bulan: 200000, jenis: 'tetap' as const, group: 'HPP' as const },
        { nama_biaya: 'Sewa Tempat', jumlah_per_bulan: 2000000, jenis: 'tetap' as const, group: 'OPERASIONAL' as const },
        { nama_biaya: 'Gaji Barista', jumlah_per_bulan: 2500000, jenis: 'tetap' as const, group: 'HPP' as const },
        { nama_biaya: 'Marketing & Promo', jumlah_per_bulan: 1500000, jenis: 'variabel' as const, group: 'OPERASIONAL' as const },
        { nama_biaya: 'Internet & Musik', jumlah_per_bulan: 300000, jenis: 'tetap' as const, group: 'OPERASIONAL' as const }
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
          <div className="animate-spin h-8 w-8 border-3 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
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
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onSkip={handleSkipOnboarding}
      />
      <OperationalCostHeader
        onStartOnboarding={handleStartOnboarding}
        onOpenAddDialog={handleOpenAddDialog}
      />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Progress Setup - Moved to Header */}
        <ProgressSetup costs={state.costs} appSettings={appSettings} />
        
        {/* Tabs for Cost Management and Calculator */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="costs" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Kelola Biaya
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Kalkulator Dual-Mode
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
              hppCosts={state.costs.filter(c => c.group === 'HPP' && c.status === 'aktif').reduce((sum, c) => sum + c.jumlah_per_bulan, 0)}
              operationalCosts={state.costs.filter(c => c.group === 'OPERASIONAL' && c.status === 'aktif').reduce((sum, c) => sum + c.jumlah_per_bulan, 0)}
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

          {/* Tab Content: Calculator */}
          <TabsContent value="calculator" className="space-y-6">
            <CalculatorTab
              costs={state.costs}
              appSettings={appSettings}
              onCalculationComplete={loadAppSettings}
              onSwitchToManagementTab={() => setActiveTab('costs')}
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
      
      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        isOpen={isBulkEditDialogOpen}
        onClose={closeBulkEditDialog}
        onConfirm={(editData) => executeBulkEdit(selectedIds, editData)}
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
