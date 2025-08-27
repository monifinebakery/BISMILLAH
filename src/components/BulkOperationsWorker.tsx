// src/components/BulkOperationsWorker.tsx
import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useBulkOperations } from '@/hooks/useWebWorker';
import { formatFileSize, formatDuration } from '@/utils/formatters';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Database,
  AlertCircle
} from 'lucide-react';

interface ImportResult {
  success: boolean;
  processed: number;
  errors: string[];
  data?: any[];
  duration?: number;
}

interface ExportResult {
  success: boolean;
  filename: string;
  size: number;
  records: number;
  duration?: number;
}

const BulkOperationsWorker: React.FC = () => {
  const [csvData, setCsvData] = useState<string>('');
  const [jsonData, setJsonData] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'excel'>('csv');
  const [batchSize, setBatchSize] = useState(100);
  const [sampleData, setSampleData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    importCSV,
    exportData,
    validateBulkData,
    generateReports,
    importResult,
    exportResult,
    validationResult,
    reportResult,
    isProcessing,
    progress,
    error,
    reset
  } = useBulkOperations();

  // Generate sample data untuk demo
  const generateSampleData = useCallback(() => {
    const data = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      nama_produk: `Produk ${i + 1}`,
      kategori: ['Makanan', 'Minuman', 'Snack'][i % 3],
      harga: Math.floor(Math.random() * 50000) + 5000,
      stok: Math.floor(Math.random() * 100) + 1,
      supplier: `Supplier ${Math.floor(i / 10) + 1}`,
      tanggal_dibuat: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: ['aktif', 'nonaktif'][Math.floor(Math.random() * 2)]
    }));
    setSampleData(data);
    setJsonData(JSON.stringify(data.slice(0, 10), null, 2)); // Show first 10 for preview
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (file.name.endsWith('.csv')) {
        setCsvData(content);
      } else if (file.name.endsWith('.json')) {
        setJsonData(content);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleImportCSV = useCallback(() => {
    if (!csvData.trim()) {
      alert('Silakan masukkan data CSV atau upload file CSV');
      return;
    }

    importCSV({
      data: csvData,
      batchSize,
      validateBeforeImport: true
    });
  }, [importCSV, csvData, batchSize]);

  const handleImportJSON = useCallback(() => {
    if (!jsonData.trim()) {
      alert('Silakan masukkan data JSON atau upload file JSON');
      return;
    }

    try {
      JSON.parse(jsonData); // Validate JSON
      importCSV({
        data: jsonData,
        batchSize,
        validateBeforeImport: true
      });
    } catch (err) {
      alert('Format JSON tidak valid');
    }
  }, [importCSV, jsonData, batchSize]);

  const handleExport = useCallback(() => {
    if (sampleData.length === 0) {
      generateSampleData();
      return;
    }

    exportData({
      data: sampleData,
      format: exportFormat,
      filename: `export_${Date.now()}`,
      includeHeaders: true
    });
  }, [exportData, sampleData, exportFormat, generateSampleData]);

  const handleValidation = useCallback(() => {
    const dataToValidate = jsonData || JSON.stringify(sampleData);
    if (!dataToValidate) {
      alert('Tidak ada data untuk divalidasi');
      return;
    }

    validateBulkData({
      data: dataToValidate,
      rules: {
        required: ['nama_produk', 'harga', 'stok'],
        types: {
          harga: 'number',
          stok: 'number',
          id: 'number'
        },
        ranges: {
          harga: { min: 0, max: 1000000 },
          stok: { min: 0, max: 10000 }
        }
      }
    });
  }, [validateBulkData, jsonData, sampleData]);

  const handleGenerateReport = useCallback(() => {
    const dataForReport = sampleData.length > 0 ? sampleData : [];
    if (dataForReport.length === 0) {
      alert('Tidak ada data untuk laporan');
      return;
    }

    generateReports({
      data: dataForReport,
      reportType: 'summary',
      groupBy: 'kategori',
      metrics: ['count', 'sum', 'avg'],
      fields: ['harga', 'stok']
    });
  }, [generateReports, sampleData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Database className="h-6 w-6 text-green-600" />
        <h2 className="text-2xl font-bold">Bulk Operations dengan Web Workers</h2>
        <Badge variant="secondary">High Performance</Badge>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress */}
      {isProcessing && progress && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memproses...</span>
                <span>{progress.processed}/{progress.total} ({progress.percentage}%)</span>
              </div>
              <Progress value={progress.percentage} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data
            </CardTitle>
            <CardDescription>
              Import data dari file CSV atau JSON
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            <div>
              <Label htmlFor="file-upload">Upload File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                ref={fileInputRef}
              />
            </div>

            <Separator />

            {/* CSV Input */}
            <div>
              <Label htmlFor="csv-data">Data CSV</Label>
              <Textarea
                id="csv-data"
                placeholder="Paste CSV data here...\ncontoh:\nnama_produk,kategori,harga,stok\nNasi Goreng,Makanan,15000,50\nEs Teh,Minuman,5000,100"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                rows={6}
              />
              <Button
                onClick={handleImportCSV}
                disabled={isProcessing || !csvData.trim()}
                className="mt-2 w-full"
              >
                Import CSV
              </Button>
            </div>

            <Separator />

            {/* JSON Input */}
            <div>
              <Label htmlFor="json-data">Data JSON</Label>
              <Textarea
                id="json-data"
                placeholder="Paste JSON data here..."
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                rows={6}
              />
              <Button
                onClick={handleImportJSON}
                disabled={isProcessing || !jsonData.trim()}
                className="mt-2 w-full"
              >
                Import JSON
              </Button>
            </div>

            {/* Batch Size */}
            <div>
              <Label htmlFor="batch-size">Batch Size</Label>
              <Input
                id="batch-size"
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value) || 100)}
                min={10}
                max={1000}
              />
            </div>
          </CardContent>
        </Card>

        {/* Export & Operations Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export & Operations
            </CardTitle>
            <CardDescription>
              Export data dan operasi lainnya
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sample Data Generation */}
            <div>
              <Button
                onClick={generateSampleData}
                disabled={isProcessing}
                className="w-full"
                variant="outline"
              >
                Generate Sample Data (1000 records)
              </Button>
              {sampleData.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {sampleData.length} records siap untuk diekspor
                </p>
              )}
            </div>

            <Separator />

            {/* Export Format */}
            <div>
              <Label>Format Export</Label>
              <div className="flex gap-2 mt-1">
                {(['csv', 'json', 'excel'] as const).map((format) => (
                  <Button
                    key={format}
                    variant={exportFormat === format ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExportFormat(format)}
                  >
                    {format.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              disabled={isProcessing}
              className="w-full"
            >
              Export Data ({exportFormat.toUpperCase()})
            </Button>

            <Separator />

            {/* Other Operations */}
            <div className="space-y-2">
              <Button
                onClick={handleValidation}
                disabled={isProcessing}
                variant="outline"
                className="w-full"
              >
                Validasi Data
              </Button>
              
              <Button
                onClick={handleGenerateReport}
                disabled={isProcessing}
                variant="outline"
                className="w-full"
              >
                Generate Report
              </Button>
            </div>

            <Button
              onClick={reset}
              variant="ghost"
              className="w-full"
            >
              Reset Semua Hasil
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Import Result */}
        {importResult && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {importResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                Import Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={importResult.success ? 'default' : 'destructive'}>
                    {importResult.success ? 'Berhasil' : 'Gagal'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Processed:</span>
                  <span className="font-semibold">{importResult.processed}</span>
                </div>
                {importResult.duration && (
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-semibold">{formatDuration(importResult.duration)}</span>
                  </div>
                )}
                {importResult.errors.length > 0 && (
                  <div>
                    <span className="text-red-600">Errors:</span>
                    <ul className="text-xs text-red-600 mt-1">
                      {importResult.errors.slice(0, 3).map((error: string, i: number) => (
                        <li key={i}>• {error}</li>
                      ))}
                      {importResult.errors.length > 3 && (
                        <li>• ... dan {importResult.errors.length - 3} error lainnya</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Result */}
        {exportResult && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Export Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={exportResult.success ? 'default' : 'destructive'}>
                    {exportResult.success ? 'Berhasil' : 'Gagal'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Records:</span>
                  <span className="font-semibold">{exportResult.records}</span>
                </div>
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span className="font-semibold">{formatFileSize(exportResult.size)}</span>
                </div>
                {exportResult.duration && (
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-semibold">{formatDuration(exportResult.duration)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Validation Result */}
        {validationResult && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {validationResult.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                Validation Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={validationResult.isValid ? 'default' : 'destructive'}>
                    {validationResult.isValid ? 'Valid' : 'Invalid'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Total Records:</span>
                  <span className="font-semibold">{validationResult.totalRecords}</span>
                </div>
                <div className="flex justify-between">
                  <span>Valid:</span>
                  <span className="font-semibold text-green-600">{validationResult.validRecords}</span>
                </div>
                <div className="flex justify-between">
                  <span>Invalid:</span>
                  <span className="font-semibold text-red-600">{validationResult.invalidRecords}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Result */}
        {reportResult && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600" />
                Report Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={reportResult.success ? 'default' : 'destructive'}>
                    {reportResult.success ? 'Berhasil' : 'Gagal'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Records:</span>
                  <span className="font-semibold">{reportResult.totalRecords}</span>
                </div>
                <div className="flex justify-between">
                  <span>Groups:</span>
                  <span className="font-semibold">{reportResult.groupCount}</span>
                </div>
                {reportResult.duration && (
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-semibold">{formatDuration(reportResult.duration)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BulkOperationsWorker;