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
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState('ringkasa');

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
      const exportData = prepareExportData(profitData, period);
      const filename = generateExportFilename(format, period);
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
 сожалению

  const handleClose = () => {
    logger.debug('Closing profit analysis dialog');
    setActiveTab('ringkasan');
    onClose();
  };

  // ✅ RENDER ERROR STATE
  const renderErrorState = () => (
    <Card className="border-red-200 bg-red-50">
      <CardContent className={cn("p-4 md:p-6", isMobile && "p-3")}>
        <div className="flex items-center gap-3 text-red-600">
          <AlertTriangle className={cn("h-6 w-6", isMobile && "h-5 w-5")} />
          <div>
            <h3 className={cn("font-medium", isMobile && "text-sm")}>Gagal Memuat Analisis</h3>
            <p className={cn("text-sm text-red-500 mt-1", isMobile && "text-xs")}>{error}</p>
          </div>
        </div>
        <Button onClick={handleCalculate} variant="outline" className={cn("mt-4", isMobile && "mt-3 text-xs")}>
          <RefreshCw className={cn("mr-2 h-4 w-4", isMobile && "h-3 w-3")} />
          Coba Lagi
        </Button>
      </CardContent>
    </Card>
  );

  // ✅ RENDER EMPTY STATE
  const renderEmptyState = () => (
    <div className={cn("text-center py-12", isMobile && "py-8")}>
      <Calculator className={cn("h-12 w-12 text-gray-400 mx-auto mb-4", isMobile && "h-8 w-8 mb-3")} />
      <h3 className={cn("font-medium text-gray-600 mb-2", isMobile && "text-sm")}>Belum Ada Analisis</h3>
      <p className={cn("text-sm text-gray-500 mb-4", isMobile && "text-xs mb-3")}>
        Klik "Hitung Ulang" untuk memulai analisis profit margin.
      </p>
      <Button onClick={handleCalculate} disabled={isCalculating} className={isMobile ? "text-xs" : ""}>
        <Calculator className={cn("mr-2 h-4 w-4", isMobile && "h-3 w-3")} />
        Mulai Analisis
      </Button>
    </div>
  );

  // ✅ RENDER MAIN CONTENT
  const renderMainContent = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className={cn(
        "grid w-full grid-cols-4",
        isMobile && "flex overflow-x-auto whitespace-nowrap"
      )}>
        <TabsTrigger value="ringkasan" className={isMobile ? "text-xs px-2" : ""}>Ringkasan</TabsTrigger>
        <TabsTrigger value="rincian" className={isMobile ? "text-xs px-2" : ""}>Rincian</TabsTrigger>
        <TabsTrigger value="insights" className={isMobile ? "text-xs px-2" : ""}>Insights</TabsTrigger>
        <TabsTrigger value="perbandingan" className={isMobile ? "text-xs px-2" : ""}>Perbandingan</TabsTrigger>
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
      <DialogContent className={cn(
        "max-w-6xl max-h-[90vh] p-0",
        isMobile && "max-w-[95vw] p-2"
      )}>
        {/* Header */}
        <DialogHeader className={cn("p-6 pb-4", isMobile && "p-4 pb-3")}>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className={cn(
                "flex items-center gap-2",
                isMobile && "text-base"
              )}>
                <Calculator className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
                Analisis Margin Profit Sesungguhnya
              </DialogTitle>
              <p className={cn("text-sm text-gray-500 mt-1", isMobile && "text-xs")}>
                Periode: {period.label}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size={isMobile ? "sm" : "sm"} 
                onClick={handleCalculate}
                disabled={isCalculating || isLoading}
                className={isMobile ? "text-xs" : ""}
              >
                <RefreshCw className={cn(
                  "h-4 w-4 mr-2",
                  (isCalculating || isLoading) && "animate-spin",
                  isMobile && "h-3 w-3"
                )} />
                {isCalculating || isLoading ? 'Menghitung...' : 'Hitung Ulang'}
              </Button>
              <Button variant="ghost" size={isMobile ? "sm" : "sm"} onClick={handleClose}>
                <X className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className={cn("flex-1 px-6", isMobile && "px-3")}>
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
        <DialogFooter className={cn("p-6 pt-4 border-t", isMobile && "p-4 pt-3")}>
          <div className={cn(
            "flex flex-col sm:flex-row justify-between w-full gap-4",
            isMobile && "flex-col gap-3"
          )}>
            {/* Export Options */}
            <div className={cn(
              "flex flex-wrap gap-2",
              isMobile && "flex-col gap-2"
            )}>
              {profitData && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('excel')}
                    size={isMobile ? "sm" : "sm"}
                    className={isMobile ? "text-xs w-full" : "text-xs"}
                  >
                    <Download className={cn("mr-2 h-4 w-4", isMobile && "h-3 w-3")} />
                    Ekspor Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('pdf')}
                    size={isMobile ? "sm" : "sm"}
                    className={isMobile ? "text-xs w-full" : "text-xs"}
                  >
                    <Download className={cn("mr-2 h-4 w-4", isMobile && "h-3 w-3")} />
                    Ekspor PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('csv')}
                    size={isMobile ? "sm" : "sm"}
                    className={isMobile ? "text-xs w-full" : "text-xs"}
                  >
                    <Download className={cn("mr-2 h-4 w-4", isMobile && "h-3 w-3")} />
                    Ekspor CSV
                  </Button>
                </>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className={cn(
              "flex gap-2",
              isMobile && "flex-col gap-2 w-full"
            )}>
              <Button 
                variant="outline" 
                onClick={handleClose}
                className={isMobile ? "w-full text-xs" : ""}
              >
                Tutup
              </Button>
              {profitData && (
                <Button 
                  onClick={() => handleCalculate()}
                  disabled={isCalculating}
                  className={isMobile ? "w-full text-xs" : ""}
                >
                  <RefreshCw className={cn(
                    "mr-2 h-4 w-4",
                    isCalculating && "animate-spin",
                    isMobile && "h-3 w-3"
                  )} />
                  {isCalculating ? 'Menghitung...' : 'Perbarui Analisis'}
                </Button>
              )}
            </div>
          </div>

          {/* Export Info */}
          {profitData && (
            <div className={cn("w-full mt-4 pt-4 border-t", isMobile && "mt-3 pt-3")}>
              <div className={cn("bg-blue-50 p-3 rounded", isMobile && "p-2")}>
                <h5 className={cn("font-medium text-blue-800 mb-1 text-sm", isMobile && "text-xs")}>
                  📄 Informasi Ekspor
                </h5>
                <div className={cn("text-xs text-blue-700 space-y-1", isMobile && "text-[0.65rem]")}>
                  <p>• <strong>Excel:</strong> Data lengkap dengan chart dan formula untuk analisis lanjutan</p>
                  <p>• <strong>PDF:</strong> Laporan siap cetak dengan visualisasi dan insights</p>
                  <p>• <strong>CSV:</strong> Data mentah untuk import ke sistem lain</p>
                </div>
                <p className={cn("text-xs text-blue-600 mt-2", isMobile && "text-[0.65rem]")}>
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