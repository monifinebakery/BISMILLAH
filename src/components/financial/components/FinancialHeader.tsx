// src/components/financial/components/FinancialHeader.tsx - Financial Report Header
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Settings, TrendingUp } from 'lucide-react';
import DateRangePicker from '@/components/ui/DateRangePicker';

interface FinancialHeaderProps {
  onAddTransaction: () => void;
  onManageCategories: () => void;
  onDateRangeChange: (range: { from: Date; to: Date } | undefined) => void;
  dateRange: { from: Date; to: Date } | undefined;
  isLoading: boolean;
  isMobile: boolean;
  actionsDisabled?: boolean;
}

export const FinancialHeader: React.FC<FinancialHeaderProps> = ({
  onAddTransaction,
  onManageCategories,
  onDateRangeChange,
  dateRange,
  isLoading,
  isMobile,
  actionsDisabled = false
}) => {
  console.log(
    '📊 FinancialHeader - isLoading:',
    isLoading,
    'isMobile:',
    isMobile,
    'actionsDisabled:',
    actionsDisabled
  );
  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white border">
      <div className="flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Laporan Keuangan Arus Kas</h1>
            <p className="text-white opacity-90 text-sm sm:text-base">
              Analisis pemasukan, pengeluaran, dan saldo bisnis Anda
            </p>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex flex-wrap items-center gap-3">
          <Button
            onClick={() => {
              console.log('Desktop Tambah Transaksi button clicked');
              onAddTransaction();
            }}
            disabled={actionsDisabled}
            className="flex items-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 backdrop-blur-sm"
          >
            <Plus className="h-4 w-4" />
            Tambah Transaksi
          </Button>

          <Button
            onClick={onManageCategories}
            className="flex items-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 backdrop-blur-sm"
          >
            <Settings className="h-4 w-4" />
            {isMobile ? "Kategori" : "Kelola Kategori"}
          </Button>

          <div className="w-full md:w-auto md:min-w-[260px]">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={onDateRangeChange}
              placeholder="Pilih periode laporan"
              isMobile={isMobile}
              className="bg-white text-gray-900 border-none hover:bg-gray-100 w-full"
            />
          </div>
        </div>
      </div>

      {/* Mobile Actions */}
      <div className="flex md:hidden flex-col gap-3 mt-6">
        <Button
          onClick={() => {
            console.log('Mobile Tambah Transaksi button clicked');
            onAddTransaction();
          }}
          disabled={actionsDisabled}
          className="w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 backdrop-blur-sm"
        >
          <Plus className="h-4 w-4" />
          Tambah Transaksi
        </Button>

        <Button
          onClick={onManageCategories}
          className="w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 backdrop-blur-sm"
        >
          <Settings className="h-4 w-4" />
          {isMobile ? "Kategori" : "Kelola Kategori"}
        </Button>

        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
          placeholder="Pilih periode laporan"
          isMobile={isMobile}
          className="bg-white text-gray-900 border-none hover:bg-gray-100 w-full"
        />
      </div>
    </div>
  );
};
