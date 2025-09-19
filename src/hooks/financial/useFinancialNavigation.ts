// src/hooks/financial/useFinancialNavigation.ts - Financial Navigation Handlers
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';

export const useFinancialNavigation = () => {
  const navigate = useNavigate();

  const handleAddTransaction = useCallback(() => {
    logger.debug('Navigating to add transaction page');
    navigate('/laporan-keuangan/tambah');
  }, [navigate]);

  const handleManageCategories = useCallback(() => {
    logger.debug('Navigating to manage categories page');
    navigate('/laporan-keuangan/kategori');
  }, [navigate]);

  const handleEditTransaction = useCallback((transaction: any) => {
    logger.debug('Navigating to edit transaction page', { transactionId: transaction?.id });
    if (transaction?.id) {
      navigate(`/laporan-keuangan/edit/${transaction.id}`);
    } else {
      navigate('/laporan-keuangan/tambah');
    }
  }, [navigate]);

  const handleDateRangeChange = useCallback((
    setDateRange: (range: { from: Date; to: Date }) => void
  ) => (range: { from: Date; to: Date } | undefined) => {
    logger.debug('Date range changed', { range });
    if (range) {
      setDateRange({
        from: range.from,
        to: range.to
      });
    } else {
      // Reset to current month if no range selected
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setDateRange({ from, to });
    }
  }, []);

  return {
    handleAddTransaction,
    handleManageCategories,
    handleEditTransaction,
    handleDateRangeChange,
  };
};