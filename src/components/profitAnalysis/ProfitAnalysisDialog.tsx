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
import { useIsMobile } from '@/hooks/use-mobile';
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

// Komponen utama ProfitAnalysisDialog
const ProfitAnalysisDialog: React.FC<ProfitAnalysisDialogProps> = ({ 
  isOpen, 
  onClose, 
  dateRange 
}) => {
  const isMobile = useIsMobile();
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
    if (isOpen && !profitData && !isLoading && !error) {
      logger.debug('Triggering initial profit calculation on dialog open', { period });
      handleCalculate();
    }
  }, [isOpen, profitData, isLoading, error]);

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
    <div className="flex flex-col items-center justify-center h-64 px-4">
      <div className="text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Gagal Memuat Analisis</h3>
        <p className="text-sm text-gray-500 mb-4">
          {error?.message || 'Terjadi kesalahan saat memuat data. Pastikan data biaya operasional tersedia.'}
        </p>
        <Button onClick={handleCalculate} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Coba Lagi
        </Button>
      </div>
    </div>
  );

  // ✅ RENDER EMPTY STATE
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-64 px-4">
      <div className="text-center">
        <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Analisis</h3>
        <p className="text-sm text-gray-500 mb-4">
          Klik tombol di bawah untuk memulai analisis profit margin.
        </p>
        <Button onClick={handleCalculate} disabled={isCalculating} size="sm">
          <Calculator className="mr-2 h-4 w-4" />
          {isCalculating ? 'Menghitung...' : 'Mulai Analisis'}
        </Button>
      </div>
    </div>
  );

  // ✅ RENDER MAIN CONTENT
  const renderMainContent = () => {
    // Guard clause untuk memastikan profitData ada
    if (!profitData) {
      return renderEmptyState();
    }

    return (
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={cn(
              "grid w-full bg-gray-50/50 rounded-lg p-1 h-auto",
              isMobile ? "grid-cols-2" : "grid-cols-4"
            )}>
              <TabsTrigger 
                value="ringkasan" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md py-2.5 px-4 text-sm font-medium"
              >
                Ringkasan
              </TabsTrigger>
              <TabsTrigger 
                value="rincian"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md py-2.5 px-4 text-sm font-medium"
              >
                Rincian
              </TabsTrigger>
              {!isMobile && (
                <>
                  <TabsTrigger 
                    value="insights"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md py-2.5 px-4 text-sm font-medium"
                  >
                    Insights
                  </TabsTrigger>
                  <TabsTrigger 
                    value="perbandingan"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md py-2.5 px-4 text-sm font-medium"
                  >
                    Perbandingan
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {/* Tab Contents */}
            <div className="mt-6">
              <TabsContent value="ringkasan" className="space-y-6 mt-0">
                <RingkasanTab profitData={profitData} />
              </TabsContent>

              <TabsContent value="rincian" className="space-y-6 mt-0">
                <RincianTab profitData={profitData} />
              </TabsContent>

              {!isMobile && (
                <>
                  <TabsContent value="insights" className="space-y-6 mt-0">
                    <InsightsTab profitData={profitData} />
                  </TabsContent>

                  <TabsContent value="perbandingan" className="space-y-6 mt-0">
                    <PerbandinganTab profitData={profitData} />
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    );
  };

  // ✅ MAIN RENDER
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "max-w-7xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col",
        isMobile && "w-[98vw] h-[95vh] max-w-none"
      )}>
        {/* ✅ MODERN HEADER - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calculator className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Analisis Margin Profit Sesungguhnya
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-0.5">
                Periode: {period.label}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCalculate}
              disabled={isCalculating || isLoading}
              className="hidden sm:flex"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", (isCalculating || isLoading) && "animate-spin")} />
              {isCalculating || isLoading ? 'Menghitung...' : 'Perbarui'}
            </Button>
            
            {/* ✅ SINGLE X BUTTON */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ✅ SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              {isLoading ? (
                <AnalysisSkeleton />
              ) : error ? (
                renderErrorState()
              ) : (
                renderMainContent()
              )}
            </div>
          </ScrollArea>
        </div>

        {/* ✅ MODERN FOOTER - Fixed */}
        {profitData && (
          <div className="border-t border-gray-200 bg-gray-50/50 p-4 rounded-b-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Export Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('excel')}
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Excel
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('pdf')}
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('csv')}
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  CSV
                </Button>
              </div>
              
              {/* Info Text */}
              <div className="text-xs text-gray-500">
                📅 {period.label} • 🕒 {new Date().toLocaleDateString('id-ID')}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Hanya satu export di akhir file
export { ProfitAnalysisDialog };