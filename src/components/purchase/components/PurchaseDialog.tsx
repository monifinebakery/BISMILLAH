// src/components/purchase/components/PurchaseDialog.tsx - Simplified version using extracted components

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  X,
  Edit3,
  Save,
  RotateCcw,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { safeParseDate } from '@/utils/unifiedDateUtils';

import { PurchaseDialogProps, PurchaseItem } from '../types/purchase.types';
import { usePurchaseForm } from '../hooks/usePurchaseForm';
import { formatCurrency } from '@/utils/formatUtils';
import { toast } from 'sonner';
import { generateUUID } from '@/utils/uuid';

// Import warehouse context
// Avoid importing WarehouseContext to reduce bundle graph and prevent circular init
import { supabase } from '@/integrations/supabase/client';

// Import extracted components
import { NewItemForm } from './dialogs/NewItemForm';
import { SafeNumericInput } from './dialogs/SafeNumericInput';

// ---- Internal state (semua string biar aman untuk input) ----
interface FormData {
  nama: string;
  satuan: string;

  // input utama
  kuantitas: string;            // Total yang dibeli (unit dasar bahan baku)
  totalBayar: string;           // Total bayar (untuk hitung harga satuan otomatis)

  keterangan: string;
}

// ---- Payload keluar (angka bersih) ----
interface PurchaseItemPayload {
  nama: string;
  satuan: string;
  kuantitas: number;
  hargaSatuan: number;
  keterangan: string;
}

// Helper function to convert string to number
const toNumber = (v: string | number | '' | undefined | null): number => {
  if (v === '' || v == null) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  
  let s = v.toString().trim().replace(/\s+/g, '');
  s = s.replace(/[^\d,.-]/g, '');
  
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(/,/g, '.');
  } else {
    s = s.replace(/,/g, '.');
  }
  
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

// ---- Enhanced PurchaseDialog with extracted components ----
const PurchaseDialog: React.FC<PurchaseDialogProps> = ({
  isOpen,
  mode,
  purchase,
  suppliers,
  onClose,
}) => {
  // ✅ ULTRA LIGHTWEIGHT: Zero validation during typing
  const {
    formData,
    setFormData,
    updateFormField, // ✅ NEW: Use this for single field updates
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
      toast.success(
        mode === 'create' 
          ? 'Pembelian berhasil dibuat!' 
          : 'Pembelian berhasil diperbarui!'
      );
      onClose();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Lightweight warehouse items fetch (avoid WarehouseContext import)
  const [warehouseItems, setWarehouseItems] = useState<Array<{ id: string; nama: string; satuan: string; stok: number; harga?: number; hargaRataRata?: number }>>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;
        const { data, error } = await supabase
          .from('bahan_baku')
          .select('id, nama, satuan, stok, harga_satuan, harga_rata_rata')
          .eq('user_id', user.id)
          .order('nama', { ascending: true });
        if (error) throw error;
        if (!mounted) return;
        const items = (data || []).map((row: any) => ({
          id: row.id,
          nama: row.nama,
          satuan: row.satuan,
          stok: Number(row.stok) || 0,
          harga: Number(row.harga_satuan) || 0,
          hargaRataRata: row.harga_rata_rata != null ? Number(row.harga_rata_rata) : undefined,
        }));
        setWarehouseItems(items);
      } catch (_) {
        // swallow; dialog can still work for manual items
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Item management
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  
  // New item form state
  const [isSelectingExistingItem, setIsSelectingExistingItem] = useState(false);
  const [selectedWarehouseItem, setSelectedWarehouseItem] = useState<string>('');

  const handleEditItem = useCallback((index: number) => {
    setEditingItemIndex(index);
    toast.info('Mode edit item aktif');
  }, []);

  const handleSaveEditedItem = useCallback((index: number, updatedItem: Partial<PurchaseItem>) => {
    const qty = toNumber(updatedItem.kuantitas);
    const price = toNumber(updatedItem.hargaSatuan);

    if (qty <= 0 || price <= 0) {
      toast.error('Kuantitas dan harga satuan harus > 0');
      return;
    }

    updateItem(index, { ...updatedItem, subtotal: qty * price });
    setEditingItemIndex(null);
    toast.success('Item berhasil diperbarui');
  }, [updateItem]);

  const handleCancelEditItem = useCallback(() => setEditingItemIndex(null), []);

  // ✅ Reset form states when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      handleCancelEditItem();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ✅ MEMOIZED HANDLERS: Prevent recreation on every render
  const handleCancel = useCallback(() => {
    if (isDirty) {
      if (confirm('Ada perubahan yang belum disimpan. Yakin ingin keluar?')) {
        handleReset();
        onClose();
      }
    } else {
      onClose();
    }
  }, [isDirty, handleReset, onClose]);

  const handleResetForm = useCallback(() => {
    if (confirm('Reset semua perubahan ke kondisi awal?')) {
      handleReset();
      if (handleCancelEditItem) handleCancelEditItem();
      toast.info('Form direset ke kondisi awal');
    }
  }, [handleReset, handleCancelEditItem]);

  const onSubmit = useCallback(async () => {
    if (formData.items.length === 0) {
      toast.error('Minimal harus ada 1 item dalam pembelian');
      return;
    }
    await handleSubmit();
  }, [formData.items.length, handleSubmit]);

  // Handle adding new item from form
  const handleAddNewItem = useCallback((item: PurchaseItem) => {
    addItem(item);
    toast.success(`${item.nama} berhasil ditambahkan`);
  }, [addItem]);

  const handleUpdateExistingItem = useCallback((index: number, item: PurchaseItem) => {
    updateItem(index, item);
    toast.success(`${item.nama} berhasil diperbarui`);
  }, [updateItem]);

  // Toggle between new item and existing item selection
  const toggleSelectionMode = useCallback(() => {
    setIsSelectingExistingItem(prev => !prev);
    setSelectedWarehouseItem('');
  }, []);

  // Izinkan edit selama status tidak "Dibatalkan"
  const canEdit = !purchase || purchase.status !== 'cancelled';
  const isViewOnly = mode === 'view' || !canEdit;

  const statusClassMap = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <span className="text-xl">
                {mode === 'create' ? 'Tambah Pembelian' : 
                 mode === 'edit' ? 'Edit Pembelian' : 'Detail Pembelian'}
              </span>
              {purchase && (
                <Badge className={`${statusClassMap[purchase.status]} ml-2 text-xs`}>
                  {purchase.status === 'pending' ? 'Menunggu' : 
                   purchase.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                </Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Tambah pembelian baru dan kelola item bahan baku' 
              : mode === 'edit' 
                ? 'Edit detail pembelian dan item bahan baku'
                : 'Lihat detail pembelian'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Form - Supplier dan Tanggal */}
          <Card className="border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-600" />
                Informasi Pembelian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Supplier dan Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Supplier *</Label>
                  <Select
                    value={formData.supplier}
                    onValueChange={(value) => updateFormField('supplier', value)}
                    disabled={isSubmitting || isViewOnly}
                  >
                    <SelectTrigger className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20">
                      <SelectValue placeholder="Pilih supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem 
                          key={supplier.id} 
                          value={supplier.id} 
                          className="focus:bg-orange-50"
                        >
                          {supplier.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validation.supplier && (
                    <p className="text-xs text-red-500">{validation.supplier}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Tanggal *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`h-11 w-full justify-start border-gray-200 text-left font-normal focus:border-orange-500 focus:ring-orange-500/20 ${!formData.tanggal && 'text-muted-foreground'}`}
                        disabled={isSubmitting || isViewOnly}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.tanggal ? format(new Date(formData.tanggal), 'PPP', { locale: id }) : 'Pilih tanggal'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.tanggal ? new Date(formData.tanggal) : undefined}
                        onSelect={(date) => updateFormField('tanggal', date?.toISOString() || '')}
                        disabled={(date) => date > (safeParseDate(new Date()) || new Date()) || date < (safeParseDate('1900-01-01') || new Date('1900-01-01'))}
                        initialFocus
                        locale={id}
                      />
                    </PopoverContent>
                  </Popover>
                  {validation.tanggal && (
                    <p className="text-xs text-red-500">{validation.tanggal}</p>
                  )}
                </div>
              </div>

              {/* Keterangan */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Keterangan</Label>
                <Textarea
                  value={formData.keterangan}
                  onChange={(e) => updateFormField('keterangan', e.target.value)}
                  placeholder="Catatan tambahan tentang pembelian ini (opsional)"
                  rows={3}
                  className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 resize-none"
                  disabled={isSubmitting || isViewOnly}
                />
              </div>
            </CardContent>
          </Card>

          {/* Items Section */}
          <Card className="border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-600" />
                Daftar Item Pembelian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Item Form */}
              <NewItemForm
                warehouseItems={warehouseItems}
                isSelectingExistingItem={isSelectingExistingItem}
                selectedWarehouseItem={selectedWarehouseItem}
                onAddItem={handleAddNewItem}
                onUpdateItem={handleUpdateExistingItem}
                onToggleSelectionMode={toggleSelectionMode}
                onSelectWarehouseItem={setSelectedWarehouseItem}
                existingItems={formData.items}
              />

              {/* Items Table */}
              {formData.items.length > 0 ? (
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kuantitas</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Satuan</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {formData.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{item.nama}</div>
                            <div className="text-sm text-gray-500">{item.satuan}</div>
                            {item.keterangan && (
                              <div className="text-xs text-gray-400 mt-1">{item.keterangan}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-900">
                            {item.kuantitas} {item.satuan}
                          </td>
                          <td className="px-4 py-3 text-gray-900">
                            {formatCurrency(item.hargaSatuan)}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {formatCurrency(item.subtotal)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditItem(index)}
                                disabled={isSubmitting || isViewOnly}
                                className="h-8 w-8 p-0 border-gray-300 hover:bg-orange-50"
                              >
                                <Edit3 className="h-3 w-3 text-gray-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeItem(index)}
                                disabled={isSubmitting || isViewOnly}
                                className="h-8 w-8 p-0 border-red-300 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right text-gray-900">
                          Total
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {formatCurrency(totalValue)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada item</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Tambah item pembelian menggunakan form di atas.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Pembelian</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalValue)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{formData.items.length} Item</p>
                  <p className="text-sm text-gray-500">
                    {formData.supplier 
                      ? `Supplier: ${suppliers.find(s => s.id === formData.supplier)?.nama || 'Tidak diketahui'}` 
                      : 'Supplier belum dipilih'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        {mode !== 'view' && canEdit && (
          <DialogFooter className="gap-3 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetForm}
              disabled={isSubmitting || !isDirty}
              className="h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>

            <div className="flex-grow"></div>

            <Button
              type="button"
              onClick={() => onSubmit()}
              disabled={isSubmitting || !isDirty}
              variant="outline"
              className="h-11"
            >
              <Save className="h-4 w-4 mr-2" />
              {mode === 'create' ? 'Simpan Draft' : 'Simpan Perubahan'}
            </Button>

            {purchase?.status !== 'completed' && (
              <Button
                type="button"
                onClick={() => onSubmit('completed')}
                disabled={isSubmitting || !isDirty}
                className="h-11 bg-green-600 hover:bg-green-700 text-white border-0 disabled:bg-gray-300 disabled:text-gray-500"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Selesaikan & Update Gudang
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;
