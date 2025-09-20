// src/components/operational-costs/features/DialogManager.tsx

import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CostFormDialog } from '../components/CostFormDialog';
import { QuickSetupTemplates } from '../components/QuickSetupTemplates';
import { BulkEditDialog, BulkDeleteDialog } from '../dialogs';
import { OperationalCost } from '../types/operationalCost.types';
import { type CostTemplate } from '../utils/smartDefaults';

export interface DialogManagerRef {
  openAddDialog: () => void;
  openEditDialog: (cost: OperationalCost) => void;
  openQuickSetup: () => void;
}

interface DialogManagerProps {
  state: any;
  actions: any;
  selectedIds: string[];
  selectedCosts: OperationalCost[];
  isProcessing: boolean;
  executeBulkEdit: (selectedIds: string[], editData: any) => void;
  executeBulkDelete: (selectedIds: string[]) => void;
  closeBulkEditDialog: () => void;
  closeBulkDeleteDialog: () => void;
  isBulkEditDialogOpen: boolean;
  isBulkDeleteDialogOpen: boolean;
  openBulkEditDialog: () => void;
  openBulkDeleteDialog: () => void;
  // NEW: Add handlers for opening dialogs
  onOpenAddDialog?: () => void;
  onOpenEditDialog?: (cost: OperationalCost) => void;
  onOpenQuickSetup?: () => void;
}

export const DialogManager = forwardRef<DialogManagerRef, DialogManagerProps>((
  {
    state,
    actions,
    selectedIds,
    selectedCosts,
    isProcessing,
    executeBulkEdit,
    executeBulkDelete,
    closeBulkEditDialog,
    closeBulkDeleteDialog,
    isBulkEditDialogOpen,
    isBulkDeleteDialogOpen,
    openBulkEditDialog,
    openBulkDeleteDialog,
    onOpenAddDialog,
    onOpenEditDialog,
    onOpenQuickSetup
  },
  ref
) => {
  const [showDialog, setShowDialog] = useState(false);
  const [editingCost, setEditingCost] = useState<OperationalCost | null>(null);
  const [showQuickSetup, setShowQuickSetup] = useState(false);

  // Handlers - use external handlers if provided, otherwise use internal ones
  const handleOpenAddDialog = () => {
    if (onOpenAddDialog) {
      onOpenAddDialog();
    } else {
      setEditingCost(null);
      setShowDialog(true);
    }
  };

  const handleOpenEditDialog = (cost: OperationalCost) => {
    if (onOpenEditDialog) {
      onOpenEditDialog(cost);
    } else {
      setEditingCost(cost);
      setShowDialog(true);
    }
  };
  
  const handleOpenQuickSetup = () => {
    if (onOpenQuickSetup) {
      onOpenQuickSetup();
    } else {
      setShowQuickSetup(true);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingCost(null);
  };

  const handleSaveDialog = async (costData: any) => {
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
    }
    
    return success;
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
      // Mark onboarding as completed
      localStorage.setItem('operational-costs-onboarding-seen', 'true');
    }
  };

  // Expose handlers through ref
  useImperativeHandle(ref, () => ({
    openAddDialog: handleOpenAddDialog,
    openEditDialog: handleOpenEditDialog,
    openQuickSetup: handleOpenQuickSetup
  }));

  return (
    <>
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
    </>
  );
});

DialogManager.displayName = 'DialogManager';
