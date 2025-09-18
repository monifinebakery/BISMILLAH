// src/components/operational-costs/hooks/useOperationalCostLogic.ts

import { useState, useEffect, useRef } from 'react';
import { useOperationalCost } from '../context';
import { useOperationalCostTable } from './useOperationalCostTable';
import { useOperationalCostBulkNew } from './useOperationalCostBulkNew';
import { appSettingsApi } from '../services/appSettingsApi';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/costHelpers';

export const useOperationalCostLogic = () => {
  const { state, actions } = useOperationalCost();
  
  const [productionTarget, setProductionTarget] = useState(3000);
  const [appSettings, setAppSettings] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'updated' | 'error'>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // ✅ Use ref to prevent infinite loops
  const appSettingsRef = useRef<any>(null);
  const loadAppSettingsRef = useRef<(() => Promise<void>) | null>(null);

  // Bulk operations
  const tableLogic = useOperationalCostTable(state.costs);

  // New bulk operations hook
  const bulkLogic = useOperationalCostBulkNew();

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
        const overheadDeltaPct = currentOverhead > 0 ? overheadDeltaAbs / currentOverhead : 1;
        const operasionalDeltaAbs = Math.abs(computedOperasional - currentOperasional);
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

  return {
    state,
    actions,
    productionTarget,
    appSettings,
    syncStatus,
    lastSyncedAt,
    shouldShowQuickSetupHint,
    totalMonthlyCosts,
    hppCosts,
    operasionalCosts,
    costPerProduct,
    handleUpdateTargetMonthly,
    tableLogic,
    bulkLogic,
    loadAppSettings
  };
};