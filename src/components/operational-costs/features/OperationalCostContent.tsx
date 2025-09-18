// src/components/operational-costs/features/OperationalCostContent.tsx

import React, { useState } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { OperationalCostHeader } from '../components';
import LoadingState from '../components/LoadingState';
import { useOperationalCostLogic } from '../hooks/useOperationalCostLogic';
import { DialogManager } from './DialogManager';
import { MainContent } from './MainContent';

export const OperationalCostContent: React.FC = () => {
  const [showQuickSetup, setShowQuickSetup] = useState(false);

  const {
    state,
    actions,
    appSettings,
    shouldShowQuickSetupHint,
    totalMonthlyCosts,
    hppCosts,
    operasionalCosts,
    handleUpdateTargetMonthly,
    tableLogic,
    bulkLogic,
    loadAppSettings
  } = useOperationalCostLogic();

  const {
    selectedIds,
    selectedCosts,
    isSelectionMode,
    isAllSelected,
    toggleCostSelection,
    selectAllCosts,
    clearSelection,
    toggleSelectionMode,
  } = tableLogic;

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
  } = bulkLogic;

  // Handlers
  const handleOpenAddDialog = () => {
    // This will be handled by the DialogManager
  };

  const handleOpenEditDialog = (cost: any) => {
    // This will be handled by the DialogManager
  };

  const handleDeleteCost = async (costId: string) => {
    if (confirm('Yakin ingin menghapus biaya ini?')) {
      const success = await actions.deleteCost(costId);
      if (success) {
        // Data will auto-refresh due to useEffect in the hook
      }
    }
  };

  // Loading state
  if (state.loading.auth) {
    return <LoadingState />;
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
        onOpenAddDialog={shouldShowQuickSetupHint ? () => setShowQuickSetup(true) : () => {}}
        appSettings={appSettings}
        onUpdateTarget={async (target) => {
          await handleUpdateTargetMonthly(target);
        }}
      />

      <MainContent
        state={state}
        appSettings={appSettings}
        shouldShowQuickSetupHint={shouldShowQuickSetupHint}
        totalMonthlyCosts={totalMonthlyCosts}
        hppCosts={hppCosts}
        operasionalCosts={operasionalCosts}
        selectedIds={selectedIds}
        selectedCosts={selectedCosts}
        isAllSelected={isAllSelected}
        isProcessing={isProcessing}
        isSelectionMode={isSelectionMode}
        setShowQuickSetup={setShowQuickSetup}
        handleOpenAddDialog={handleOpenAddDialog}
        handleOpenEditDialog={handleOpenEditDialog}
        handleDeleteCost={handleDeleteCost}
        toggleCostSelection={toggleCostSelection}
        selectAllCosts={selectAllCosts}
        clearSelection={clearSelection}
        toggleSelectionMode={toggleSelectionMode}
        openBulkEditDialog={openBulkEditDialog}
        openBulkDeleteDialog={openBulkDeleteDialog}
      />

      {/* Dialog Manager */}
      <DialogManager
        state={state}
        actions={actions}
        selectedIds={selectedIds}
        selectedCosts={selectedCosts}
        isProcessing={isProcessing}
        executeBulkEdit={executeBulkEdit}
        executeBulkDelete={executeBulkDelete}
        closeBulkEditDialog={closeBulkEditDialog}
        closeBulkDeleteDialog={closeBulkDeleteDialog}
        isBulkEditDialogOpen={isBulkEditDialogOpen}
        isBulkDeleteDialogOpen={isBulkDeleteDialogOpen}
        openBulkEditDialog={openBulkEditDialog}
        openBulkDeleteDialog={openBulkDeleteDialog}
      />
    </div>
    </TooltipProvider>
  );
};