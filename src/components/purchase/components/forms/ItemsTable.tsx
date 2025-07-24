import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit3, Save, X } from 'lucide-react';
import { PurchaseItem } from '@/types/supplier';
import { usePurchaseForm } from '../../hooks/usePurchaseForm';
import { formatCurrency } from '@/utils/formatUtils';
import { cn } from '@/lib/utils';

interface ItemsTableProps {
  items: PurchaseItem[];
  className?: string;
}

const ItemsTable: React.FC<ItemsTableProps> = ({ items, className = '' }) => {
  const { removeItem, updateItem } = usePurchaseForm();
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [editingData, setEditingData] = React.useState<Partial<PurchaseItem>>({});

  const handleEdit = (item: PurchaseItem) => {
    setEditingItemId(item.id);
    setEditingData({
      jumlah: item.jumlah,
      hargaSatuan: item.hargaSatuan,
    });
  };

  const handleSaveEdit = () => {
    if (editingItemId && editingData.jumlah && editingData.hargaSatuan) {
      updateItem(editingItemId, {
        ...editingData,
        totalHarga: editingData.jumlah * editingData.hargaSatuan,
      });
      setEditingItemId(null);
      setEditingData({});
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingData({});
  };

  const handleDelete = (itemId: string) => {
    const confirmDelete = window.confirm('Yakin ingin menghapus item ini?');
    if (confirmDelete) {
      removeItem(itemId);
    }
  };

  const updateEditingData = (field: keyof PurchaseItem, value: any) => {
    setEditingData(prev => ({ ...prev, [field]: value }));
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + item.totalHarga, 0);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className={`border-gray-200 shadow-sm ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-gray-800 flex items-center justify-between">
          <span>Item Pembelian</span>
          <span className="text-sm font-normal text-gray-600">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="font-semibold text-gray-700">Nama Barang</TableHead>
                <TableHead className="font-semibold text-gray-700 text-center">Jumlah</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Harga/Satuan</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Total</TableHead>
                <TableHead className="font-semibold text-gray-700 text-center w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow 
                  key={item.id} 
                  className={cn(
                    "border-b border-gray-100 hover:bg-gray-50",
                    editingItemId === item.id && "bg-blue-50"
                  )}
                >
                  {/* Nama Barang */}
                  <TableCell className="font-medium text-gray-900">
                    <div className="flex flex-col">
                      <span>{item.namaBarang}</span>
                      {item.satuan && (
                        <span className="text-xs text-gray-500">Satuan: {item.satuan}</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Jumlah */}
                  <TableCell className="text-center">
                    {editingItemId === item.id ? (
                      <Input
                        type="number"
                        value={editingData.jumlah || ''}
                        onChange={(e) => updateEditingData('jumlah', parseFloat(e.target.value) || 0)}
                        className="w-20 mx-auto text-center"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <span>{item.jumlah} {item.satuan}</span>
                    )}
                  </TableCell>

                  {/* Harga Satuan */}
                  <TableCell className="text-right">
                    {editingItemId === item.id ? (
                      <Input
                        type="number"
                        value={editingData.hargaSatuan || ''}
                        onChange={(e) => updateEditingData('hargaSatuan', parseFloat(e.target.value) || 0)}
                        className="w-32 ml-auto text-right"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      formatCurrency(item.hargaSatuan)
                    )}
                  </TableCell>

                  {/* Total */}
                  <TableCell className="text-right">
                    <span className="font-semibold text-green-600">
                      {editingItemId === item.id && editingData.jumlah && editingData.hargaSatuan
                        ? formatCurrency(editingData.jumlah * editingData.hargaSatuan)
                        : formatCurrency(item.totalHarga)
                      }
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-center">
                    {editingItemId === item.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleSaveEdit}
                          className="h-8 w-8 text-green-600 hover:bg-green-100"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCancelEdit}
                          className="h-8 w-8 text-gray-600 hover:bg-gray-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                          className="h-8 w-8 text-blue-600 hover:bg-blue-100"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          className="h-8 w-8 text-red-600 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}

              {/* Total Row */}
              <TableRow className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
                <TableCell colSpan={3} className="text-right font-bold text-gray-800">
                  Grand Total:
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-lg font-bold text-green-700">
                    {formatCurrency(calculateGrandTotal())}
                  </span>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Summary Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-sm text-gray-600">
              Total {items.length} item{items.length !== 1 ? 's' : ''} dalam pembelian ini
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total Pembelian</div>
              <div className="text-xl font-bold text-green-700">
                {formatCurrency(calculateGrandTotal())}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemsTable;