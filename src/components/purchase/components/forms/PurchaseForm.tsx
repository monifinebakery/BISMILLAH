import React, { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Purchase } from '@/types/supplier';
import { usePurchaseForm } from '../../hooks/usePurchaseForm';
import { usePurchaseOperations } from '../../hooks/usePurchaseOperations';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Lazy load sub-components
const ItemForm = React.lazy(() => import('./ItemForm'));
const ItemsTable = React.lazy(() => import('./ItemsTable'));

interface PurchaseFormProps {
  mode: 'create' | 'edit';
  initialData?: Purchase | null;
  suppliers: any[];
  bahanBaku: any[];
  onSubmit: (data: any) => Promise<boolean>;
  onCancel: () => void;
  className?: string;
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({
  mode,
  initialData,
  suppliers,
  bahanBaku,
  onSubmit,
  onCancel,
  className = '',
}) => {
  const {
    formData,
    updateField,
    totalValue,
    hasChanges,
    isFormValid,
    validationErrors,
    isSubmitting,
    setIsSubmitting,
  } = usePurchaseForm(initialData);

  const { createPurchase, updatePurchase } = usePurchaseOperations({
    suppliers,
    onSuccess: () => onCancel(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      let success = false;
      
      if (mode === 'create') {
        success = await createPurchase(formData);
      } else if (initialData) {
        success = await updatePurchase(initialData.id, formData, initialData);
      }

      if (success) {
        await onSubmit(formData);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmLeave = window.confirm(
        'Anda memiliki perubahan yang belum disimpan. Yakin ingin keluar?'
      );
      if (!confirmLeave) return;
    }
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supplier */}
        <div>
          <Label htmlFor="supplier" className="font-medium text-gray-700">
            Supplier *
          </Label>
          <Select 
            value={formData.supplier} 
            onValueChange={(value) => updateField('supplier', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Pilih supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map(supplier => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{supplier.nama}</span>
                    {supplier.kontak && (
                      <span className="text-sm text-gray-500">({supplier.kontak})</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div>
          <Label htmlFor="tanggal" className="font-medium text-gray-700">
            Tanggal *
          </Label>
          <Input
            id="tanggal"
            type="date"
            value={formData.tanggal.toISOString().split('T')[0]}
            onChange={(e) => updateField('tanggal', new Date(e.target.value))}
            className="mt-2"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Status */}
        <div>
          <Label htmlFor="status" className="font-medium text-gray-700">
            Status
          </Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => updateField('status', value as any)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  Menunggu
                </div>
              </SelectItem>
              <SelectItem value="completed">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Selesai
                </div>
              </SelectItem>
              <SelectItem value="cancelled">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Dibatalkan
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Total Value Display */}
        <div>
          <Label className="font-medium text-gray-700">Total Nilai</Label>
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-lg font-bold text-green-700">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR'
              }).format(totalValue)}
            </span>
            <span className="text-sm text-green-600 ml-2">
              ({formData.items.length} item{formData.items.length !== 1 ? 's' : ''})
            </span>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <Card className="border-orange-200 bg-orange-50/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-800">Tambah Item</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={
            <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          }>
            <ItemForm bahanBaku={bahanBaku} />
          </Suspense>
        </CardContent>
      </Card>

      {/* Items Table */}
      {formData.items.length > 0 && (
        <Suspense fallback={
          <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />
        }>
          <ItemsTable items={formData.items} />
        </Suspense>
      )}

      {/* Form Actions */}
      <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleCancel}
          className="order-2 sm:order-1"
        >
          Batal
        </Button>
        <Button 
          type="submit" 
          disabled={!isFormValid || isSubmitting}
          className="bg-orange-500 hover:bg-orange-600 order-1 sm:order-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {mode === 'edit' ? 'Memperbarui...' : 'Menyimpan...'}
            </>
          ) : (
            mode === 'edit' ? 'Perbarui Pembelian' : 'Simpan Pembelian'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default PurchaseForm;