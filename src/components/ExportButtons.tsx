import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonsProps {
  data: any[];
  filename: string;
  type: 'recipes' | 'orders' | 'financial' | 'assets' | 'warehouse' | 'suppliers';
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ data, filename, type }) => {
  const exportToPDF = () => {
    try {
      // Create formatted content for PDF
      let content = `${filename.toUpperCase()}\n`;
      content += `Generated on: ${new Date().toLocaleDateString('id-ID')}\n\n`;
      
      data.forEach((item, index) => {
        content += `${index + 1}. `;
        Object.entries(item).forEach(([key, value]) => {
          if (key !== 'id' && key !== 'user_id') {
            content += `${key}: ${value} | `;
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
        Object.keys(item).forEach(key => {
          if (!['id', 'user_id', 'created_at', 'updated_at'].includes(key)) {
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
            
            // Handle complex data types
            if (value === null || value === undefined) {
              value = '';
            } else if (typeof value === 'object') {
              value = JSON.stringify(value);
            }
            
            // Escape commas and quotes for CSV format
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
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
      a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
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
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToPDF} className="hover:bg-blue-50">
          <FileText className="h-4 w-4 mr-2 text-blue-600" />
          Export sebagai PDF/Text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel} className="hover:bg-green-50">
          <FileText className="h-4 w-4 mr-2 text-green-600" />
          Export sebagai Excel/CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButtons;