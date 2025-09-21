// src/components/operational-costs/features/MainContent.tsx

import React from 'react';
import { Plus, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ProgressSetup, 
  CostManagementTab, 
  BulkActionsNew
} from '../components';
import EmptyState from '../components/EmptyState';

interface MainContentProps {
  state: any;
  appSettings: any;
  shouldShowQuickSetupHint: boolean;
  totalMonthlyCosts: number;
  hppCosts: number;
  operasionalCosts: number;
  selectedIds: string[];
  selectedCosts: any[];
  isAllSelected: boolean;
  isProcessing: boolean;
  isSelectionMode: boolean;
  setShowQuickSetup: (show: boolean) => void;
  handleOpenAddDialog: () => void;
  handleOpenEditDialog: (cost: any) => void;
  handleDeleteCost: (costId: string) => void;
  toggleCostSelection: (id: string) => void;
  selectAllCosts: () => void;
  clearSelection: () => void;
  toggleSelectionMode: () => void;
  openBulkEditDialog: () => void;
  openBulkDeleteDialog: () => void;
}

export const MainContent: React.FC<MainContentProps> = ({
  state,
  appSettings,
  shouldShowQuickSetupHint,
  totalMonthlyCosts,
  hppCosts,
  operasionalCosts,
  selectedIds,
  selectedCosts,
  isAllSelected,
  isProcessing,
  isSelectionMode,
  setShowQuickSetup,
  handleOpenAddDialog,
  handleOpenEditDialog,
  handleDeleteCost,
  toggleCostSelection,
  selectAllCosts,
  clearSelection,
  toggleSelectionMode,
  openBulkEditDialog,
  openBulkDeleteDialog
}) => {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Progress Setup - Moved to Header */}
      {/* ✅ NEW: Contextual empty state with hints */}
      {shouldShowQuickSetupHint ? (
        <EmptyState 
          onStartQuickSetup={() => setShowQuickSetup(true)}
          onOpenAddDialog={handleOpenAddDialog}
          onSkipOnboarding={() => {
            localStorage.setItem('operational-costs-onboarding-skipped', 'true');
          }}
        />
      ) : (
        <ProgressSetup costs={state.costs} appSettings={appSettings} />
      )}
      
      {/* Tabs for Cost Management */}
      <Tabs value="costs" className="space-y-6">
        
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
            hppCosts={state.summary?.total_hpp_group || 0}
            operationalCosts={state.summary?.total_operasional_group || 0}
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
  );
};