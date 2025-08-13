// src/components/profitAnalysis/ProfitAnalysisDialog.tsx
// ✅ DIALOG ANALISIS PROFIT MARGIN - Refactored Structure

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calculator,
  AlertTriangle,
  Download,
  RefreshCw,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';

// Hooks
import { useProfitMargin } from './hooks/useProfitMargin';
import { createDatePeriods } from './services/profitAnalysisApi';

// Types
import { DatePeriod } from './types';

// Components
import { AnalysisSkeleton } from './components/LoadingSkeleton';
import { RingkasanTab } from './tabs/RingkasanTab';
import { RincianTab } from './tabs/RincianTab';
import { InsightsTab } from './tabs/InsightsTab';
import { PerbandinganTab } from './tabs/PerbandinganTab';

// Utils
import { prepareExportData, generateExportFilename } from './utils/exportHelpers';

// ===================================================================

interface ProfitAnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange?: { from: Date; to: Date };
}

export const ProfitAnalysisDialog: React.FC<ProfitAnalysisDialogProps> = ({ 
  isOpen, 
  onClose, 
  dateRange 
}) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState('ringkasan');

  // Buat periode dari dateRange
  const period: DatePeriod = dateRange ? {
    from: dateRange.from,
    to: dateRange.to,
    label: `${dateRange.from.toLocaleDateString('id-ID')} - ${dateRange.to.toLocaleDateString('id-ID')}`
  } : createDatePeriods.thisMonth();

  // Gunakan hook profit margin
  const {
    profitData,
    keyMetrics,
    isLoading,
    calculateProfit,
    exportAnalysis,
    error
  } = useProfitMargin(period);

  // ✅ EFFECTS
  useEffect(() => {
    if (isOpen && !profitData && !isLoading) {
      handleCalculate();
    }
  }, [isOpen]);

  // Reset tab saat dialog dibuka
  useEffect(() => {
    if (isOpen) {
      setActiveTab('ringkasan');
    }
  }, [isOpen]);

  // ✅ HANDLERS
  const handleCalculate = async () => {
    try {
      logger.info('Starting profit calculation', { period });
      setIsCalculating(true);
      await calculateProfit();
      toast.success('Analisis profit margin berhasil dihitung');
      logger.info('Profit calculation completed successfully');
    } catch (error: any) {
      logger.error('Failed to calculate profit margin', error);
      toast.error(error.message || 'Gagal menghitung profit margin');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!profitData) {
      toast.error('Tidak ada data untuk diekspor');
      logger.warn('Export attempted with no data');
      return;
    }

    try {
      logger.info('Starting export', { format, period });
      // Siapkan data untuk export
      const exportData = prepareExportData(profitData, period);
      const filename = generateExportFilename(format, period);
      
      // Panggil fungsi export
      await exportAnalysis(format, profitData);
      
      const formatLabels = {
        pdf: 'PDF',
        excel: 'Excel', 
        csv: 'CSV'
      };
      
      toast.success(`Laporan ${formatLabels[format]} berhasil diekspor`);
      logger.info('Export completed successfully', { format, filename });
    } catch (error: any) {
      logger.error('Export failed', { format, error });
      toast.error(error.message || 'Gagal mengekspor laporan');
    }
  };

  const handleClose = () => {
    logger.debug('Closing profit analysis dialog');
    setActiveTab('ringkasan');
    onClose();
  };

  // ✅ RENDER ERROR STATE
  const renderErrorState = () => (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertTriangle className="h-6 w-6" />
          <div>
            <h3 className="font-medium">Gagal Memuat Analisis</h3>
            <p className="text-sm text-red-500 mt-1">{error}</p>
          </div>
        </div>
        <Button onClick={handleCalculate} variant="outline" className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Coba Lagi
        </Button>
      </CardContent>
    </Card>
  );

  // ✅ RENDER EMPTY STATE
  const renderEmptyState = () => (
    <div className="text-center py-12">
      <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="font-medium text-gray-600 mb-2">Belum Ada Analisis</h3>
      <p className="text-sm text-gray-500 mb-4">
        Klik "Hitung Ulang" untuk memulai analisis profit margin.
      </p>
      <Button onClick={handleCalculate} disabled={isCalculating}>
        <Calculator className="mr-2 h-4 w-4" />
        Mulai Analisis
      </Button>
    </div>
  );

  // ✅ RENDER MAIN CONTENT
  const renderMainContent = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
        <TabsTrigger value="rincian">Rincian</TabsTrigger>
        <TabsTrigger value="insights">Insights</TabsTrigger>
        <TabsTrigger value="perbandingan">Perbandingan</TabsTrigger>
      </TabsList>

      <TabsContent value="ringkasan" className="mt-6">
        <RingkasanTab profitData={profitData} />
      </TabsContent>

      <TabsContent value="rincian" className="mt-6">
        <RincianTab profitData={profitData} />
      </TabsContent>

      <TabsContent value="insights" className="mt-6">
        <InsightsTab profitData={profitData} />
      </TabsContent>

      <TabsContent value="perbandingan" className="mt-6">
        <PerbandinganTab profitData={profitData} />
      </TabsContent>
    </Tabs>
  );

  // ✅ MAIN RENDER
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Analisis Margin Profit Sesungguhnya
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Periode: {period.label}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCalculate}
                disabled={isCalculating || isLoading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", (isCalculating || isLoading) && "animate-spin")} />
                {isCalculating || isLoading ? 'Menghitung...' : 'Hitung Ulang'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 px-6">
          {isLoading ? (
            <AnalysisSkeleton />
          ) : error ? (
            renderErrorState()
          ) : !profitData ? (
            renderEmptyState()
          ) : (
            renderMainContent()
          )}
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-6 pt-4 border-t">
          <div className="flex flex-col sm:flex-row justify-between w-full gap-4">
            {/* Export Options */}
            <div className="flex flex-wrap gap-2">
              {profitData && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('excel')}
                    size="sm"
                    className="text-xs"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Ekspor Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('pdf')}
                    size="sm"
                    className="text-xs"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Ekspor PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('csv')}
                    size="sm"
                    className="text-xs"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Ekspor CSV
                  </Button>
                </>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Tutup
              </Button>
              {profitData && (
                <Button 
                  onClick={() => handleCalculate()}
                  disabled={isCalculating}
                >
                  <RefreshCw className={cn("mr-2 h-4 w-4", isCalculating && "animate-spin")} />
                  {isCalculating ? 'Menghitung...' : 'Perbarui Analisis'}
                </Button>
              )}
            </div>
          </div>

          {/* Export Info */}
          {profitData && (
            <div className="w-full mt-4 pt-4 border-t">
              <div className="bg-blue-50 p-3 rounded">
                <h5 className="font-medium text-blue-800 mb-1 text-sm">📄 Informasi Ekspor</h5>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>• <strong>Excel:</strong> Data lengkap dengan chart dan formula untuk analisis lanjutan</p>
                  <p>• <strong>PDF:</strong> Laporan siap cetak dengan visualisasi dan insights</p>
                  <p>• <strong>CSV:</strong> Data mentah untuk import ke sistem lain</p>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  📅 Periode: {period.label} | 🕒 Dihitung: {new Date().toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Export sebagai named export
export default ProfitAnalysisDialog;