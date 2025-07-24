import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { BahanBaku } from '../../types/warehouse';

interface LowStockAlertProps {
  lowStockItems: BahanBaku[];
}

const LowStockAlert: React.FC<LowStockAlertProps> = ({ lowStockItems }) => {
  if (lowStockItems.length === 0) return null;

  return (
    <div className="mb-6">
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="border-b border-red-200 bg-white/50">
          <CardTitle className="flex items-center text-red-700">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Peringatan Stok Rendah ({lowStockItems.length} item)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockItems.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-red-100">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800">{item.nama}</span>
                  <span className="text-xs text-gray-500">{item.kategori}</span>
                </div>
                <Badge className="bg-red-100 text-red-700 border-red-200 font-semibold">
                  {item.stok} {item.satuan}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LowStockAlert;