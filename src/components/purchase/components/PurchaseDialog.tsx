// src/components/purchase/components/PurchaseDialog.tsx

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CalendarIcon, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Package,
  Calculator,
  ShoppingCart,
  X 
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { PurchaseDialogProps, PurchaseItem } from '../types/purchase.types';
import { usePurchaseForm } from '../hooks/usePurchaseForm';
import { formatCurrency } from '@/utils/formatUtils';
import { toast } from 'sonner';

const PurchaseDialog: React.FC<PurchaseDialogProps> = ({
  isOpen,
  mode,
  purchase,
  suppliers,
  bahanBaku,
  onClose,
}) => {
  // Form management
  const {
    formData,
    setFormData,
    isSubmitting,
    isDirty,
    validation,
    addItem,
    updateItem,
    removeItem,
    handleSubmit,
    handleReset,
    totalValue,
  } = usePurchaseForm({
    mode,
    initialData: purchase,
    onSuccess: () => {
      toast.success(mode === 'create' ? 'Pembelian berhasil dibuat!' : 'Pembelian berhasil diperbarui!');
      onClose();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Local state for new item form
  const [newItem, setNewItem] = useState<Partial<PurchaseItem>>({
    bahanBakuId: '',
    nama: '',
    kuantitas: 0,
    satuan: '',
    hargaSatuan: 0,
    keterangan: '',
  });

  const [showAddItem, setShowAddItem] = useState(false);

  // Reset new item form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setNewItem({
        bahanBakuId: '',
        nama: '',
        kuantitas: 0,
        satuan: '',
        hargaSatuan: 0,
        keterangan: '',
      });
      setShowAddItem(false);
    }
  }, [isOpen]);

  // Handle bahan baku selection
  const handleBahanBakuSelect = (bahanBakuId: string) => {
    const selectedBahan = bahanBaku.find(b => b.id === bahanBakuId);
    if (selectedBahan) {
      setNewItem(prev => ({
        ...prev,
        bahanBakuId,
        nama: selectedBahan.nama,
        satuan: selectedBahan.satuan,
      }));
    }
  };

  // Add new item to purchase
  const handleAddItem = () => {
    if (!newItem.bahanBakuId || !newItem.nama || !newItem.kuantitas || !newItem.hargaSatuan) {
      toast.error('Lengkapi data item terlebih dahulu');
      return;
    }

    addItem({
      bahanBakuId: newItem.bahanBakuId!,
      nama: newItem.nama!,
      kuantitas: newItem.kuantitas!,
      satuan: newItem.satuan!,
      hargaSatuan: newItem.hargaSatuan!,
      keterangan: newItem.keterangan,
    });

    // Reset form
    setNewItem({
      bahanBakuId: '',
      nama: '',
      kuantitas: 0,
      satuan: '',
      hargaSatuan: 0,
      keterangan: '',
    });
    setShowAddItem(false);
    toast.success('Item berhasil ditambahkan');
  };

  // Handle form submission
  const onSubmit = async () => {
    await handleSubmit();
  };

  // Handle cancel
  const handleCancel = () => {
    if (isDirty) {
      if (confirm('Ada perubahan yang belum disimpan. Yakin ingin keluar?')) {
        handleReset();
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {mode === 'create' ? 'Tambah Pembelian Baru' : 'Edit Pembelian'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Buat pembelian bahan baku baru dari supplier' 
              : 'Perbarui informasi pembelian yang sudah ada'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Validation Errors */}
          {validation.errors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="font-medium text-red-800 mb-2">Perbaiki kesalahan berikut:</div>
                <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                  {validation.errors.slice(0, 5).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {validation.errors.length > 5 && (
                    <li>... dan {validation.errors.length - 5} kesalahan lainnya</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Warnings */}
          {validation.warnings.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <div className="font-medium text-yellow-800 mb-2">Perhatian:</div>
                <ul className="list-disc list-inside space-y-1 text-yellow-700 text-sm">
                  {validation.warnings.slice(0, 3).map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Dasar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supplier Selection */}
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Select
                    value={formData.supplier}
                    onValueChange={(value) => 
                      setFormData({ ...formData, supplier: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Selection */}
                <div className="space-y-2">
                  <Label>Tanggal Pembelian *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.tanggal ? (
                          format(formData.tanggal, 'PPP', { locale: id })
                        ) : (
                          <span>Pilih tanggal</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.tanggal}
                        onSelect={(date) => 
                          date && setFormData({ ...formData, tanggal: date })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Calculation Method */}
              <div className="space-y-2">
                <Label htmlFor="metodePerhitungan">Metode Perhitungan Stok</Label>
                <Select
                  value={formData.metodePerhitungan}
                  onValueChange={(value: 'FIFO' | 'LIFO' | 'AVERAGE') =>
                    setFormData({ ...formData, metodePerhitungan: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIFO">FIFO (First In, First Out)</SelectItem>
                    <SelectItem value="LIFO">LIFO (Last In, First Out)</SelectItem>
                    <SelectItem value="AVERAGE">Average (Rata-rata)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Items Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Item Pembelian ({formData.items.length})
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddItem(!showAddItem)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Item Form */}
              {showAddItem && (
                <Card className="border-dashed">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {/* Bahan Baku Selection */}
                      <div className="space-y-2">
                        <Label>Bahan Baku *</Label>
                        <Select
                          value={newItem.bahanBakuId}
                          onValueChange={handleBahanBakuSelect}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih bahan baku" />
                          </SelectTrigger>
                          <SelectContent>
                            {bahanBaku.map((bahan) => (
                              <SelectItem key={bahan.id} value={bahan.id}>
                                {bahan.nama} ({bahan.satuan})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Quantity */}
                      <div className="space-y-2">
                        <Label>Kuantitas *</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={newItem.kuantitas || ''}
                            onChange={(e) =>
                              setNewItem(prev => ({
                                ...prev,
                                kuantitas: parseFloat(e.target.value) || 0
                              }))
                            }
                            placeholder="0"
                          />
                          <div className="flex items-center px-3 bg-gray-100 rounded text-sm text-gray-600 min-w-[60px]">
                            {newItem.satuan || 'unit'}
                          </div>
                        </div>
                      </div>

                      {/* Unit Price */}
                      <div className="space-y-2">
                        <Label>Harga Satuan *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newItem.hargaSatuan || ''}
                          onChange={(e) =>
                            setNewItem(prev => ({
                              ...prev,
                              hargaSatuan: parseFloat(e.target.value) || 0
                            }))
                          }
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2 mb-4">
                      <Label>Keterangan</Label>
                      <Textarea
                        value={newItem.keterangan || ''}
                        onChange={(e) =>
                          setNewItem(prev => ({ ...prev, keterangan: e.target.value }))
                        }
                        placeholder="Keterangan tambahan (opsional)"
                        rows={2}
                      />
                    </div>

                    {/* Subtotal Preview */}
                    {newItem.kuantitas && newItem.hargaSatuan && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm text-blue-800">
                          <strong>Subtotal: </strong>
                          {formatCurrency((newItem.kuantitas || 0) * (newItem.hargaSatuan || 0))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleAddItem}
                        disabled={!newItem.bahanBakuId || !newItem.kuantitas || !newItem.hargaSatuan}
                        className="flex-1"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah ke Daftar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddItem(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Items List */}
              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada item ditambahkan</p>
                  <p className="text-sm">Klik "Tambah Item" untuk mulai menambahkan bahan baku</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <Card key={index} className="relative">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <div className="font-medium">{item.nama}</div>
                              <div className="text-sm text-gray-600">ID: {item.bahanBakuId}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{item.kuantitas} {item.satuan}</div>
                              <div className="text-sm text-gray-600">Kuantitas</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(item.hargaSatuan)}</div>
                              <div className="text-sm text-gray-600">Harga Satuan</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">{formatCurrency(item.subtotal)}</div>
                              <div className="text-sm text-gray-600">Subtotal</div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-4"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {item.keterangan && (
                          <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <strong>Keterangan:</strong> {item.keterangan}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total Summary */}
          {formData.items.length > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Total Pembelian</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalValue)}
                  </div>
                </div>
                <div className="mt-2 text-sm text-green-700">
                  {formData.items.length} item • Total kuantitas: {' '}
                  {formData.items.reduce((sum, item) => sum + item.kuantitas, 0)} unit
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !validation.isValid || formData.items.length === 0}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {mode === 'create' ? 'Membuat...' : 'Menyimpan...'}
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                {mode === 'create' ? 'Buat Pembelian' : 'Simpan Perubahan'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;