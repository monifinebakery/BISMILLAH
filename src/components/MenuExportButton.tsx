import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface MenuExportButtonProps {
  data: any[];
  filename: string;
  menuType: string;
}

const MenuExportButton: React.FC<MenuExportButtonProps> = ({ data, filename, menuType }) => {
  const exportToPDF = () => {
    try {
      if (!data || data.length === 0) {
        toast.error('Tidak ada data untuk diekspor');
        return;
      }

      let content = `LAPORAN ${menuType.toUpperCase()}\n`;
      content += `Generated on: ${new Date().toLocaleDateString('id-ID')}\n`;
      content += `Total Records: ${data.length}\n\n`;
      
      data.forEach((item, index) => {
        content += `${index + 1}. `;
        Object.entries(item).forEach(([key, value]) => {
          if (!['id', 'user_id'].includes(key)) { 
            let displayValue = value;
            if (value instanceof Date) {
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
      a.download = `${filename}-${new Date().toISOString().split('T')[0]}.txt`;
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

      const CSV_DELIMITER = ';'; // MODIFIED: Gunakan titik koma sebagai pemisah CSV

      // Collect all unique keys from all objects in the data array
      const allKeys = new Set<string>();
      data.forEach(item => {
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
        headers.map(header => {
          // Escape header if it contains delimiter or quotes
          let headerValue = header;
          if (headerValue.includes(CSV_DELIMITER) || headerValue.includes('"') || headerValue.includes('\n') || headerValue.includes('\r')) {
            headerValue = `"${headerValue.replace(/"/g, '""')}"`;
          }
          return headerValue;
        }).join(CSV_DELIMITER), // MODIFIED: Gunakan CSV_DELIMITER
        ...data.map(item => 
          headers.map(header => {
            let value = item[header];
            
            // Handle null or undefined values
            if (value === null || value === undefined) {
              value = '';
            } 
            // Handle Date objects specifically: convert to ISO string
            else if (value instanceof Date) {
              value = value.toISOString();
            } 
            // Handle other complex objects (like arrays, nested objects) by stringifying
            else if (typeof value === 'object') {
              value = JSON.stringify(value);
            }
            
            // Apply CSV escaping: enclose in double quotes if it contains delimiter, double quotes, or newlines
            // And double internal double quotes
            if (typeof value === 'string' && (value.includes(CSV_DELIMITER) || value.includes('"') || value.includes('\n') || value.includes('\r'))) { // MODIFIED: Gunakan CSV_DELIMITER
              value = `"${value.replace(/"/g, '""')}"`;
            }
            
            return value;
          }).join(CSV_DELIMITER) // MODIFIED: Gunakan CSV_DELIMITER
        )
      ].join('\n');
      
      // Add BOM for proper UTF-8 encoding in Excel
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Data ${menuType} berhasil diekspor sebagai Excel/CSV`);
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
          className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200 hover:from-blue-100 hover:to-green-100 text-blue-700 rounded-md shadow-sm transition-colors duration-200" 
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white border-gray-200 shadow-lg rounded-md"> 
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

export default MenuExportButton;
