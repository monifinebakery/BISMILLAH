// src/components/warehouse/components/dialogs/ExportDialog.tsx
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Download,
  Loader2,
  FileText,
  FileSpreadsheet,
  FileImage,
  Calendar,
  Filter,
  Package,
  Info,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { BahanBaku, ExportOptions } from '../../types/warehouse';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { cn } from '@/lib/utils';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: BahanBaku[];
  selectedData?: BahanBaku[];
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  data,
  selectedData = [],
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeImages: false,
    selectedOnly: false,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [customFilename, setCustomFilename] = useState('');
  const [dateRange, setDateRange] = useState({
    enabled: false,
    start: '',
    end: '',
  });

  // Calculate export statistics
  const exportStats = useMemo(() => {
    const itemsToExport = exportOptions.selectedOnly ? selectedData : data;
    
    const totalValue = itemsToExport.reduce((sum, item) => sum + (item.stok * item.hargaSatuan), 0);
    const categories = Array.from(new Set(itemsToExport.map(item => item.kategori))).length;
    const lowStockItems = itemsToExport.filter(item => item.stok <= item.minimum).length;
    const outOfStockItems = itemsToExport.filter(item => item.stok === 0).length;

    return {
      totalItems: itemsToExport.length,
      totalValue,
      categories,
      lowStockItems,
      outOfStockItems,
    };
  }, [data, selectedData, exportOptions.selectedOnly]);

  const handleExportOptionChange = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };

  const generateFilename = () => {
    if (customFilename.trim()) {
      return customFilename.trim();
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const scope = exportOptions.selectedOnly ? 'selected' : 'all';
    const format = exportOptions.format.toUpperCase();
    
    return `inventory_${scope}_${timestamp}.${exportOptions.format}`;
  };

  const prepareExportData = () => {
    let itemsToExport = exportOptions.selectedOnly ? selectedData : data;

    // Apply date range filter if enabled
    if (dateRange.enabled && (dateRange.start || dateRange.end)) {
      itemsToExport = itemsToExport.filter(item => {
        if (!item.tanggalKadaluwarsa) return !dateRange.start && !dateRange.end;
        
        const itemDate = new Date(item.tanggalKadaluwarsa);
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;
        
        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        
        return true;
      });
    }

    return itemsToExport;
  };

  const exportToCSV = (items: BahanBaku[]) => {
    const headers = [
      'Nama',
      'Kategori', 
      'Stok',
      'Satuan',
      'Minimum',
      'Harga Satuan',
      'Supplier',
      'Tanggal Kadaluwarsa',
      'Total Nilai',
      'Status Stok',
      'Jumlah Beli Kemasan',
      'Satuan Kemasan',
      'Harga Total Beli Kemasan',
      'Dibuat',
      'Diperbarui',
    ];

    const csvContent = [
      headers.join(','),
      ...items.map(item => {
        const totalValue = item.stok * item.hargaSatuan;
        const stockStatus = item.stok === 0 ? 'Habis' : 
                           item.stok <= item.minimum ? 'Rendah' : 'Normal';
        
        return [
          `"${item.nama}"`,
          `"${item.kategori}"`,
          item.stok,
          `"${item.satuan}"`,
          item.minimum,
          item.hargaSatuan,
          `"${item.supplier}"`,
          item.tanggalKadaluwarsa ? formatDate(item.tanggalKadaluwarsa) : '',
          totalValue,
          stockStatus,
          item.jumlahBeliKemasan || 0,
          `"${item.satuanKemasan || ''}"`,
          item.hargaTotalBeliKemasan || 0,
          formatDate(item.createdAt),
          formatDate(item.updatedAt),
        ].join(',');
      })
    ].join('\n');

    return csvContent;
  };

  const exportToJSON = (items: BahanBaku[]) => {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalItems: items.length,
        exportType: exportOptions.selectedOnly ? 'selected' : 'all',
        filters: dateRange.enabled ? { dateRange } : {},
      },
      data: items.map(item => ({
        ...item,
        totalValue: item.stok * item.hargaSatuan,
        stockStatus: item.stok === 0 ? 'out_of_stock' : 
                    item.stok <= item.minimum ? 'low_stock' : 'normal',
      })),
    };

    return JSON.stringify(exportData, null, 2);
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const itemsToExport = prepareExportData();
      
      if (itemsToExport.length === 0) {
        toast.error('Tidak ada data untuk diekspor');
        return;
      }

      const filename = generateFilename();
      let content: string;
      let contentType: string;

      switch (exportOptions.format) {
        case 'csv':
          content = exportToCSV(itemsToExport);
          contentType = 'text/csv;charset=utf-8;';
          break;
          
        case 'json':
          content = exportToJSON(itemsToExport);
          contentType = 'application/json;charset=utf-8;';
          break;
          
        case 'excel':
          // For now, export as CSV with .xlsx extension
          // In a real implementation, you'd use a library like xlsx
          content = exportToCSV(itemsToExport);
          contentType = 'text/csv;charset=utf-8;';
          break;
          
        default:
          throw new Error('Format tidak didukung');
      }

      downloadFile(content, filename, contentType);
      
      toast.success(`${itemsToExport.length} item berhasil diekspor ke ${filename}`);
      onClose();
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal mengekspor data');
    } finally {
      setIsExporting(false);
    }
  };

  const formatOptions = [
    { value: 'csv', label: 'CSV', icon: FileText, description: 'Comma-separated values' },
    { value: 'excel', label: 'Excel', icon: FileSpreadsheet, description: 'Microsoft Excel format' },
    { value: 'json', label: 'JSON', icon: FileText, description: 'JavaScript Object Notation' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-orange-500" />
            Ekspor Data Inventory
          </DialogTitle>
          <DialogDescription>
            Ekspor data bahan baku ke dalam berbagai format file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Statistics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Statistik Export</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Item:</span>
                <p className="font-medium">{exportStats.totalItems}</p>
              </div>
              <div>
                <span className="text-gray-600">Total Nilai:</span>
                <p className="font-medium">{formatCurrency(exportStats.totalValue)}</p>
              </div>
              <div>
                <span className="text-gray-600">Kategori:</span>
                <p className="font-medium">{exportStats.categories}</p>
              </div>
              <div>
                <span className="text-gray-600">Stok Rendah:</span>
                <p className={cn("font-medium", exportStats.lowStockItems > 0 ? "text-orange-600" : "text-gray-900")}>
                  {exportStats.lowStockItems}
                </p>
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Format File</Label>
            <div className="grid gap-3">
              {formatOptions.map((format) => {
                const Icon = format.icon;
                return (
                  <div
                    key={format.value}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      exportOptions.format === format.value 
                        ? "border-orange-500 bg-orange-50" 
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                    onClick={() => handleExportOptionChange('format', format.value)}
                  >
                    <input
                      type="radio"
                      checked={exportOptions.format === format.value}
                      onChange={() => handleExportOptionChange('format', format.value)}
                      className="text-orange-500"
                    />
                    <Icon className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-sm">{format.label}</div>
                      <div className="text-xs text-gray-500">{format.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Opsi Export</Label>
            
            {/* Selected Only */}
            {selectedData.length > 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="selectedOnly"
                  checked={exportOptions.selectedOnly}
                  onCheckedChange={(checked) => handleExportOptionChange('selectedOnly', checked)}
                />
                <Label htmlFor="selectedOnly" className="text-sm cursor-pointer">
                  Hanya item yang dipilih ({selectedData.length} item)
                </Label>
              </div>
            )}

            {/* Date Range Filter */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dateRange"
                  checked={dateRange.enabled}
                  onCheckedChange={(checked) => setDateRange(prev => ({ ...prev, enabled: checked as boolean }))}
                />
                <Label htmlFor="dateRange" className="text-sm cursor-pointer flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Filter berdasarkan tanggal kadaluwarsa
                </Label>
              </div>
              
              {dateRange.enabled && (
                <div className="ml-6 grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="startDate" className="text-xs text-gray-600">Dari</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-xs text-gray-600">Sampai</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Custom Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename" className="text-sm font-medium">
              Nama File (Opsional)
            </Label>
            <Input
              id="filename"
              type="text"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder={generateFilename()}
              className="text-sm"
            />
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Info className="h-3 w-3" />
              <span>Kosongkan untuk menggunakan nama otomatis</span>
            </div>
          </div>

          {/* Preview Filename */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Preview</span>
            </div>
            <p className="text-sm text-blue-800 font-mono">{generateFilename()}</p>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Batal
          </Button>
          
          <Button
            onClick={handleExport}
            disabled={isExporting || exportStats.totalItems === 0}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Mengekspor...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Ekspor {exportStats.totalItems} Item
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;