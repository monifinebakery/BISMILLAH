import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, AlertCircle } from 'lucide-react';
import { usePurchaseForm } from '../../hooks/usePurchaseForm';
import { formatCurrency } from '@/utils/formatUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ItemFormProps {
  bahanBaku: any[];
  className?: string;
}

const ItemForm: React.FC<ItemFormProps> = ({ bahanBaku, className = '' }) => {
  const {
    itemForm,
    updateItemField,
    selectBahanBaku,
    addItem,
    isItemFormValid,
    itemFormErrors,
  } = usePurchaseForm();

  const handleBahanBakuSelect = (namaBarang: string) => {
    const selectedBahan = bahanBaku.find(b => b.nama === namaBarang);
    if (selectedBahan) {
      selectBahanBaku(selectedBahan);
    }
  };

  const handleAddItem = () => {
    if (addItem()) {
      // Item successfully added, form will be reset automatically
    }
  };

  const calculateTotal = () => {
    return itemForm.jumlah * itemForm.hargaSatuan;
  };

  const total = calculateTotal();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Validation Errors */}
      {!isItemFormValid && itemFormErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {itemFormErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Nama Barang */}
        <div className="lg:col-span-2">
          <Label htmlFor="namaBarang" className="text-sm font-medium text-gray-700">
            Nama Barang *
          </Label>
          <Select 
            value={itemForm.namaBarang} 
            onValueChange={handleBahanBakuSelect}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Pilih Bahan Baku" />
            </SelectTrigger>
            <SelectContent>
              {bahanBaku.map(bahan => (
                <SelectItem key={bahan.id} value={bahan.nama}>
                  <div className="flex flex-col">
                    <span className="font-medium">{bahan.nama}</span>
                    <span className="text-xs text-gray-500">
                      Stok: {bahan.stok} {bahan.satuan} | {formatCurrency(bahan.hargaSatuan || 0)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Jumlah */}
        <div>
          <Label htmlFor="jumlah" className="text-sm font-medium text-gray-700">
            Jumlah *
          </Label>
          <Input
            id="jumlah"
            type="number"
            value={itemForm.jumlah || ''}
            onChange={(e) => updateItemField('jumlah', parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            className="mt-1"
            placeholder="0"
          />
          {itemForm.satuan && (
            <span className="text-xs text-gray-500 mt-1 block">
              Satuan: {itemForm.satuan}
            </span>
          )}
        </div>

        {/* Harga Satuan */}
        <div>
          <Label htmlFor="hargaSatuan" className="text-sm font-medium text-gray-700">
            Harga Satuan *
          </Label>
          <Input
            id="hargaSatuan"
            type="number"
            value={itemForm.hargaSatuan || ''}
            onChange={(e) => updateItemField('hargaSatuan', parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            className="mt-1"
            placeholder="0"
          />
        </div>
      </div>

      {/* Total Preview */}
      {total > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-700">Total Harga:</span>
            <span className="text-lg font-bold text-blue-800">
              {formatCurrency(total)}
            </span>
          </div>
          {itemForm.jumlah > 0 && itemForm.hargaSatuan > 0 && (
            <div className="text-xs text-blue-600 mt-1">
              {itemForm.jumlah} {itemForm.satuan} × {formatCurrency(itemForm.hargaSatuan)}
            </div>
          )}
        </div>
      )}

      {/* Add Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleAddItem}
          disabled={!isItemFormValid}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Item
        </Button>
      </div>
    </div>
  );
};

export default ItemForm;