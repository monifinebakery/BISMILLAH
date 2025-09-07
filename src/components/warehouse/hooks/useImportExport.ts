import { useState } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import type { BahanBakuImport } from '../types';
import { headerMap, requiredFields, validate, loadXLSX } from '../dialogs/import-utils';
// Sinkronkan kategori dengan analisis profit
import { FNB_COGS_CATEGORIES } from '@/components/profitAnalysis/constants/profitConstants';
import { safeDom } from '@/utils/browserApiSafeWrappers';


interface UseImportExportProps {
  onImport: (data: BahanBakuImport[]) => Promise<boolean>;
}

export const useImportExport = ({ onImport }: UseImportExportProps) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ valid: BahanBakuImport[]; errors: string[] } | null>(null);

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Format file tidak didukung. Gunakan .csv, .xlsx, atau .xls');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 10MB');
      return;
    }

    setLoading(true);

    try {
      let jsonData: any[] = [];

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) throw new Error('File kosong atau hanya berisi header');

        const firstLine = lines[0];
        const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';

        logger.info(`CSV delimiter detected: '${delimiter}'`);
        toast.info(`Menggunakan delimiter: '${delimiter}'`, { duration: 1000 });

        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          let i = 0;

          while (i < line.length) {
            const char = line[i];

            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 2;
                continue;
              } else {
                inQuotes = !inQuotes;
                i++;
                continue;
              }
            }

            if (char === delimiter && !inQuotes) {
              result.push(current.trim());
              current = '';
              i++;
              continue;
            }

            current += char;
            i++;
          }

          result.push(current.trim());
          return result;
        };

        const headers = parseCSVLine(firstLine);
        jsonData = lines.slice(1).map((line, index) => {
          const values = parseCSVLine(line);
          const row: any = { _rowIndex: index + 2 };
          headers.forEach((h, i) => {
            const value = values[i] || '';
            row[h] = value;
          });
          return row;
        });
      } else {
        toast.info('Memuat library Excel...', { duration: 1000 });

        const XLSX = await loadXLSX();
        const buffer = await file.arrayBuffer();
        const data = new Uint8Array(buffer);
        const wb = XLSX.read(data, { type: 'array' });

        if (!wb.SheetNames.length) {
          throw new Error('File Excel tidak memiliki sheet');
        }

        const ws = wb.Sheets[wb.SheetNames[0]];
        jsonData = XLSX.utils.sheet_to_json(ws, { defval: '' });
        jsonData = jsonData.map((row, index) => ({ ...row, _rowIndex: index + 2 }));
      }

      if (jsonData.length === 0) {
        throw new Error('Tidak ada data yang dapat diproses');
      }

      const mapped = jsonData.map((row) => {
        const newRow: any = { _rowIndex: row._rowIndex };
        Object.keys(row).forEach(key => {
          if (key === '_rowIndex') return;

          const mappedKey = headerMap[key.toLowerCase().trim()];
          if (mappedKey) {
            let value = row[key];

            if (['stok', 'minimum'].includes(mappedKey)) {
              const cleanValue = String(value).replace(/[,\s]/g, '').replace(/[^\d.-]/g, '');
              value = parseFloat(cleanValue) || 0;
            }

            if (mappedKey === 'expiry' && value) {
              const dateValue = new Date(value);
              if (!isNaN(dateValue.getTime())) {
                value = dateValue.toISOString().split('T')[0];
              }
            }

            if (typeof value === 'string') {
              value = value.trim();
            }

            newRow[mappedKey] = value;
          }
        });
        return newRow;
      });

      const valid: BahanBakuImport[] = [];
      const errors: string[] = [];

      const sampleRow = mapped[0] || {};
      const missingCols = requiredFields.filter(field =>
        !(field in sampleRow) || sampleRow[field] === undefined
      );

      if (missingCols.length > 0) {
        errors.push(`Kolom wajib tidak ditemukan: ${missingCols.join(', ')}`);
        errors.push('Tip: Pastikan nama kolom sesuai dengan template atau gunakan variasi nama yang didukung');
      }

      mapped.forEach(row => {
        const fieldErrors = validate(row);
        if (fieldErrors.length === 0) {
          const { _rowIndex, ...cleanRow } = row;
          valid.push(cleanRow);
        } else {
          errors.push(`Baris ${row._rowIndex}: ${fieldErrors.join(', ')}`);
        }
      });

      setPreview({ valid, errors });

      if (valid.length > 0) {
        toast.success(`File berhasil diproses: ${valid.length} data valid, ${errors.length} error`);
      } else {
        toast.error('Tidak ada data valid yang dapat diimport');
      }

    } catch (error: any) {
      logger.error('Processing error:', error);
      toast.error(`Error memproses file: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      setLoading(true);
      toast.info('Memuat library Excel...', { duration: 1000 });

      const XLSX = await loadXLSX();

      const template = [
        {
          nama: 'Tepung Terigu Premium',
          kategori: FNB_COGS_CATEGORIES[0],
          supplier: 'PT Supplier Terpercaya',
          satuan: 'gram',
          expiry: '2025-12-31',
          stok: 5000,
          minimum: 1000
        },
        {
          nama: 'Gula Pasir Halus',
          kategori: FNB_COGS_CATEGORIES[1],
          supplier: 'CV Gula Manis',
          satuan: 'gram',
          expiry: '2025-11-30',
          stok: 3000,
          minimum: 500
        },
        {
          nama: 'Minyak Goreng',
          kategori: FNB_COGS_CATEGORIES[2],
          supplier: 'PT Minyak Sehat',
          satuan: 'ml',
          expiry: '2025-06-15',
          stok: 2000,
          minimum: 300
        }
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(template);

      ws['!cols'] = [
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 10 },
        { wch: 12 },
        { wch: 8 },
        { wch: 8 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 18 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Template Bahan Baku');

      const fileName = `template_bahan_baku_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success('Template berhasil di-download');
    } catch (error) {
      logger.error('Template download error:', error);
      toast.error('Gagal membuat template');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSVTemplate = () => {
    try {
      const template = [
        {
          nama: 'Tepung Terigu Premium',
          kategori: FNB_COGS_CATEGORIES[0],
          supplier: 'PT Supplier Terpercaya',
          satuan: 'gram',
          expiry: '2025-12-31',
          stok: 5000,
          minimum: 1000
        },
        {
          nama: 'Gula Pasir Halus',
          kategori: FNB_COGS_CATEGORIES[1],
          supplier: 'CV Gula Manis',
          satuan: 'gram',
          expiry: '2025-11-30',
          stok: 3000,
          minimum: 500
        },
        {
          nama: 'Minyak Goreng',
          kategori: FNB_COGS_CATEGORIES[2],
          supplier: 'PT Minyak Sehat',
          satuan: 'ml',
          expiry: '2025-06-15',
          stok: 2000,
          minimum: 300
        }
      ];

      const headers = Object.keys(template[0]);
      const csvContent = [
        headers.join(';'),
        ...template.map(row =>
          headers.map(key => {
            const value = row[key as keyof typeof row];
            if (typeof value === 'string' && (value.includes(';') || value.includes(' '))) {
              return `"${value}"`;
            }
            return value;
          }).join(';')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = safeDom.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `template_bahan_baku_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast.success('Template CSV berhasil di-download');
      logger.info('CSV template downloaded with semicolon delimiter');
    } catch (error) {
      logger.error('CSV template download error:', error);
      toast.error('Gagal membuat template CSV');
    }
  };

  const executeImport = async (): Promise<boolean> => {
    if (!preview?.valid.length) return false;

    setLoading(true);
    try {
      const success = await onImport(preview.valid);
      if (success) {
        toast.success(`${preview.valid.length} bahan baku berhasil diimpor`);
      }
      return success;
    } catch (error: any) {
      logger.error('Import error:', error);
      toast.error(`Gagal mengimpor data: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    preview,
    setPreview,
    processFile,
    downloadTemplate,
    downloadCSVTemplate,
    executeImport
  };
};

export type UseImportExportReturn = ReturnType<typeof useImportExport>;
