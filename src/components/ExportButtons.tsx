import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { safeParseDate, toSafeISOString } from '@/utils/unifiedDateUtils';

interface ExportButtonsProps {
  data: any[];
  filename: string;
  type: 'recipes' | 'orders' | 'financial' | 'assets' | 'warehouse' | 'suppliers';
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ data, filename, type }) => {
  const exportToPDF = () => {
    try {
      if (!data || data.length === 0) {
        toast.error('Tidak ada data untuk diekspor');
        return;
      }

      let content = `${filename.toUpperCase()}\n`;
      content += `Generated on: ${(safeParseDate(new Date()) || new Date()).toLocaleDateString('id-ID')}\n\n`;
      
      data.forEach((item, index) => {
        content += `${index + 1}. `;
        Object.entries(item).forEach(([key, value]) => {
          // MODIFIED: Sertakan created_at dan updated_at di PDF/Text
          if (key !== 'id' && key !== 'user_id') { 
            let displayValue = value;
            if (value instanceof Date) { // Handle Date objects
              displayValue = value.toISOString();
            } else if (typeof value === 'object' && value !== null) {
              displayValue = JSON.stringify(value);
            }
            content += `${key}: ${displayValue} | `;
          }
        });
        content += '\n';
      });

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${(toSafeISOString(new Date()) || new Date().toISOString()).split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data berhasil diekspor sebagai PDF/Text');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal mengekspor data');
    }
  };

  const exportToExcel = () => {
    try {
      if (!data || data.length === 0) {
        toast.error('Tidak ada data untuk diekspor');
        return;
      }

      // Collect all unique keys from all objects in the data array
      const allKeys = new Set<string>();
      data.forEach(item => {
        // MODIFIED: Sertakan semua kunci kecuali 'id' dan 'user_id'
        Object.keys(item).forEach(key => {    
          if (!['id', 'user_id'].includes(key)) { 
            allKeys.add(key);
          }
        });
      });
      
      // Convert Set to Array for headers
      const headers = Array.from(allKeys);
      
      // Create CSV content with all headers
      const csvContent = [
        headers.join(','),
        ...data.map(item => 
          headers.map(header => {
            let value = item[header];
            
            // Handle null or undefined values
            if (value === null || value === undefined) {
              value = '';
            } 
            // MODIFIED: Tangani objek Date secara spesifik: konversi ke string ISO
            else if (value instanceof Date) {
              value = value.toISOString();
            } 
            // Tangani objek kompleks lainnya (seperti array, objek bersarang) dengan stringify
            else if (typeof value === 'object') {
              value = JSON.stringify(value);
            }
            
            // Terapkan escaping CSV: sertakan dalam tanda kutip ganda jika berisi koma, tanda kutip ganda, atau baris baru
            // Dan gandakan tanda kutip ganda internal
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r'))) {
              value = `"${value.replace(/"/g, '""')}"`;
            }
            
            return value;
          }).join(',')
        )
      ].join('\n');
      
      // Add BOM for proper UTF-8 encoding in Excel
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${(toSafeISOString(new Date()) || new Date().toISOString()).split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data berhasil diekspor sebagai Excel/CSV');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal mengekspor data');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200 hover:from-blue-100 hover:to-green-100 text-blue-700 rounded-md border transition-colors duration-200" 
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white border-gray-200 rounded-md"> 
        <DropdownMenuItem onClick={exportToPDF} className="hover:bg-blue-50 rounded-md"> 
          <FileText className="h-4 w-4 mr-2 text-blue-600" />
          Export sebagai PDF/Text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel} className="hover:bg-green-50 rounded-md"> 
          <FileText className="h-4 w-4 mr-2 text-green-600" />
          Export sebagai Excel/CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButtons;
