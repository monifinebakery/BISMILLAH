// src/components/purchase/components/PurchaseDialog.tsx - Enhanced for Edit Mode

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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

import { PurchaseDialogProps, PurchaseItem } from '../types/purchase.types';
import { usePurchaseForm } from '../hooks/usePurchaseForm';
import { formatCurrency } from '@/utils/formatUtils';
import { toast } from 'sonner';
import { generateUUID } from '@/utils/uuid';

// Import warehouse context
import { useBahanBaku } from '@/components/warehouse/context/WarehouseContext';

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

// ✅ OPTIMIZED: Move outside component to prevent recreation
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

// ---- Guards: cegah input aneh sebelum ke state ----
const makeBeforeInputGuard = (getValue: () => string, allowDecimal = true) =>
  (e: React.FormEvent<HTMLInputElement> & { nativeEvent: InputEvent }) => {
    const ch = (e.nativeEvent as { data?: string }).data ?? '';
    if (!ch) return;
    const el = e.currentTarget as HTMLInputElement;
    const cur = getValue() ?? '';
    const next =
      cur.slice(0, el.selectionStart ?? cur.length) + ch + cur.slice(el.selectionEnd ?? cur.length);
    if (!allowDecimal) {
      if (!/^\d*$/.test(next)) e.preventDefault();
      return;
    }
    if (!/^\d*(?:[.,]\d{0,6})?$/.test(next)) e.preventDefault();
  };

const handlePasteGuard = (allowDecimal = true) => (e: React.ClipboardEvent<HTMLInputElement>) => {
  const text = e.clipboardData.getData('text').trim();
  const ok = allowDecimal ? /^\d*(?:[.,]\d{0,6})?$/.test(text) : /^\d*$/.test(text);
  if (!ok) e.preventDefault();
};

const SafeNumericInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { value: string | number }
>(({ className = '', value, onChange, ...props }, ref) => {
  const baseClasses =
    'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-50';
  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      value={String(value ?? '')}
      onChange={onChange}
      className={`${baseClasses} ${className}`}
      autoComplete="off"
      autoCorrect="off"
      spellCheck="false"
      {...props}
    />
  );
});

// ✅ ENHANCED: Updated props interface
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

  // Warehouse context
  const { bahanBaku: warehouseItems } = useBahanBaku();

  // Item management
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  
  // New item form state
  const [newItemFormData, setNewItemFormData] = useState<FormData>({
    nama: '',
    satuan: '',
    kuantitas: '',
    totalBayar: '',
    keterangan: '',
  });
  
  // State for item selection mode
  const [isSelectingExistingItem, setIsSelectingExistingItem] = useState(false);
  const [selectedWarehouseItem, setSelectedWarehouseItem] = useState<string>('');
  
  // refs for new item form
  const qtyRef = useRef<HTMLInputElement>(null);
  const payRef = useRef<HTMLInputElement>(null);

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

  // New item form handlers
  const handleNewItemNumericChange = useCallback((field: keyof FormData, value: string) => {
    setNewItemFormData((prev) => (prev[field] === value ? prev : { ...prev, [field]: value }));
  }, []);

  const resetNewItemForm = useCallback(() => {
    setNewItemFormData({
      nama: '',
      satuan: '',
      kuantitas: '',
      totalBayar: '',
      keterangan: '',
    });
  }, []);

  // Computed values for new item form
  const computedUnitPrice = useMemo(() => {
    const qty = toNumber(newItemFormData.kuantitas);
    const pay = toNumber(newItemFormData.totalBayar);
    if (qty > 0 && pay > 0) {
      return Math.round((pay / qty) * 100) / 100;
    }
    return 0;
  }, [newItemFormData.kuantitas, newItemFormData.totalBayar]);

  const effectiveQty = useMemo(() => {
    return toNumber(newItemFormData.kuantitas);
  }, [newItemFormData.kuantitas]);

  const effectivePay = useMemo(() => {
    return toNumber(newItemFormData.totalBayar);
  }, [newItemFormData.totalBayar]);

  const subtotal = useMemo(() => effectiveQty * computedUnitPrice, [effectiveQty, computedUnitPrice]);

  const canSubmitNewItem =
    newItemFormData.nama.trim() !== '' &&
    newItemFormData.satuan.trim() !== '' &&
    effectiveQty > 0 &&
    computedUnitPrice > 0;

  // ✅ Reset form states when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      handleCancelEditItem();
      resetNewItemForm();
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
      resetNewItemForm();
      toast.info('Form direset ke kondisi awal');
    }
  }, [handleReset, handleCancelEditItem, resetNewItemForm]);

  const onSubmit = useCallback(async () => {
    if (formData.items.length === 0) {
      toast.error('Minimal harus ada 1 item dalam pembelian');
      return;
    }
    await handleSubmit();
  }, [formData.items.length, handleSubmit]);

  // Handle adding new item from form
  const handleAddNewItem = useCallback(() => {
    if (isSelectingExistingItem) {
      // Handle selecting existing warehouse item
      if (!selectedWarehouseItem) return toast.error('Pilih bahan baku dari daftar');
      
      const warehouseItem = warehouseItems.find(item => item.id === selectedWarehouseItem);
      if (!warehouseItem) return toast.error('Bahan baku tidak ditemukan');
      
      const purchaseItem: PurchaseItem = {
        bahanBakuId: warehouseItem.id,
        nama: warehouseItem.nama,
        satuan: warehouseItem.satuan,
        kuantitas: effectiveQty,
        hargaSatuan: computedUnitPrice,
        subtotal: effectiveQty * computedUnitPrice,
        keterangan: newItemFormData.keterangan,
      };

      addItem(purchaseItem);
      resetNewItemForm();
      setSelectedWarehouseItem('');
      toast.success(`${warehouseItem.nama} berhasil ditambahkan`);
    } else {
      // Handle adding new item
      if (!newItemFormData.nama.trim()) return toast.error('Nama bahan baku harus diisi');
      if (!newItemFormData.satuan) return toast.error('Satuan harus dipilih');
      if (effectiveQty <= 0) return toast.error('Total yang dibeli harus > 0');
      if (computedUnitPrice <= 0) return toast.error('Tidak bisa menghitung harga per unit');

      // For new items, we'll use a special identifier that the trigger can recognize
      // We'll prefix with "new_" to indicate this is a new item
      const newItemId = `new_${generateUUID()}`;

      const purchaseItem: PurchaseItem = {
        bahanBakuId: newItemId,
        nama: newItemFormData.nama,
        satuan: newItemFormData.satuan,
        kuantitas: effectiveQty,
        hargaSatuan: computedUnitPrice,
        subtotal: effectiveQty * computedUnitPrice,
        keterangan: newItemFormData.keterangan,
      };

      addItem(purchaseItem);
      resetNewItemForm();
      toast.success(`${newItemFormData.nama} berhasil ditambahkan`);
    }
  }, [addItem, resetNewItemForm, newItemFormData, effectiveQty, computedUnitPrice, 
      isSelectingExistingItem, selectedWarehouseItem, warehouseItems]);

  // ✅ Check if purchase can be edited (not completed)
  const canEdit = !purchase || purchase.status !== 'completed';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <ShoppingCart className="h-5 w-5" />
                Tambah Pembelian Baru
              </>
            ) : (
              <>
                <Edit3 className="h-5 w-5" />
                Edit Pembelian
                {purchase && (
                  <Badge 
                    variant="outline" 
                    className={`ml-2 ${
                      purchase.status === 'completed' ? 'bg-green-100 text-green-800' :
                      purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {purchase.status}
                  </Badge>
                )}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Buat pembelian bahan baku baru dari supplier' 
              : canEdit 
                ? 'Perbarui informasi pembelian yang sudah ada'
                : 'Pembelian yang sudah selesai tidak dapat diedit'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* ✅ Edit Warning for Completed Purchase */}
          {mode === 'edit' && !canEdit && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="font-medium text-red-800">Pembelian Sudah Selesai</div>
                <p className="text-red-700 text-sm mt-1">
                  Pembelian dengan status "Selesai" tidak dapat diedit untuk menjaga integritas data.
                </p>
              </AlertDescription>
            </Alert>
          )}

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
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Informasi Dasar</CardTitle>
                {mode === 'edit' && isDirty && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetForm}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset Form
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supplier Selection */}
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Select
                    value={formData.supplier}
                    onValueChange={(value) => updateFormField('supplier', value)} // ✅ FIXED: Use updateFormField
                    disabled={!canEdit}
                  >
                    <SelectTrigger className={!canEdit ? 'opacity-50' : ''}>
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
                        className={`w-full justify-start text-left font-normal ${!canEdit ? 'opacity-50' : ''}`}
                        disabled={!canEdit}
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
                          date && updateFormField('tanggal', date) // ✅ FIXED: Use updateFormField
                        }
                        initialFocus
                        disabled={!canEdit}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
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
                  {mode === 'edit' && isDirty && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Modified
                    </Badge>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Item Form - Always visible */}
              {canEdit && (
                <Card className="border-dashed border-orange-200 bg-orange-50/30 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Plus className="h-4 w-4 text-orange-600" />
                      </div>
                      <span className="text-lg">Tambah Item Baru</span>
                      <Badge
                        variant="outline"
                        className={
                          effectiveQty > 0 && computedUnitPrice > 0
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-blue-100 text-blue-700 border-blue-200'
                        }
                      >
                        {effectiveQty > 0 && computedUnitPrice > 0 ? 'Akurat 100%' : 'Otomatis dihitung'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Toggle between new item and existing item */}
                    <div className="flex gap-2">
                      <Button
                        variant={isSelectingExistingItem ? "outline" : "default"}
                        onClick={() => setIsSelectingExistingItem(false)}
                        className="flex-1"
                      >
                        Tambah Item Baru
                      </Button>
                      <Button
                        variant={isSelectingExistingItem ? "default" : "outline"}
                        onClick={() => setIsSelectingExistingItem(true)}
                        className="flex-1"
                      >
                        Pilih Item Gudang
                      </Button>
                    </div>

                    {isSelectingExistingItem ? (
                      // Select existing warehouse item
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Pilih Bahan Baku *</Label>
                          <Select
                            value={selectedWarehouseItem}
                            onValueChange={setSelectedWarehouseItem}
                          >
                            <SelectTrigger className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20">
                              <SelectValue placeholder="Pilih bahan baku dari gudang" />
                            </SelectTrigger>
                            <SelectContent>
                              {warehouseItems.map((item) => (
                                <SelectItem key={item.id} value={item.id} className="focus:bg-orange-50">
                                  {item.nama} ({item.stok} {item.satuan})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      // Add new item form
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Nama Bahan Baku *</Label>
                          <input
                            type="text"
                            value={newItemFormData.nama}
                            onChange={(e) => setNewItemFormData((prev) => ({ ...prev, nama: e.target.value }))}
                            placeholder="Contoh: Tepung Terigu"
                            className="h-11 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500/20"
                          />
                        </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Satuan *</Label>
                        <Select
                          value={newItemFormData.satuan}
                          onValueChange={(value) => setNewItemFormData((prev) => ({ ...prev, satuan: value }))}
                        >
                          <SelectTrigger className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20">
                            <SelectValue placeholder="Pilih satuan" />
                          </SelectTrigger>
                          <SelectContent>
                            {['gram', 'kilogram', 'miligram', 'liter', 'milliliter', 'pcs', 'buah', 'biji', 'butir', 'lembar'].map((u) => (
                              <SelectItem key={u} value={u} className="focus:bg-orange-50">
                                {u}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Add new item form
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Nama Bahan Baku *</Label>
                      <input
                        type="text"
                        value={newItemFormData.nama}
                        onChange={(e) => setNewItemFormData((prev) => ({ ...prev, nama: e.target.value }))}
                        placeholder="Contoh: Tepung Terigu"
                        className="h-11 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Satuan *</Label>
                      <Select
                        value={newItemFormData.satuan}
                        onValueChange={(value) => setNewItemFormData((prev) => ({ ...prev, satuan: value }))}
                      >
                        <SelectTrigger className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20">
                          <SelectValue placeholder="Pilih satuan" />
                        </SelectTrigger>
                        <SelectContent>
                          {['gram', 'kilogram', 'miligram', 'liter', 'milliliter', 'pcs', 'buah', 'biji', 'butir', 'lembar'].map((u) => (
                            <SelectItem key={u} value={u} className="focus:bg-orange-50">
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Input utama: Total yang dibeli + Total bayar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Total yang Dibeli *</Label>
                        <div className="flex gap-2">
                          <SafeNumericInput
                            ref={qtyRef}
                            value={newItemFormData.kuantitas}
                            onBeforeInput={makeBeforeInputGuard(() => newItemFormData.kuantitas, true)}
                            onPaste={handlePasteGuard(true)}
                            onChange={(e) => {
                              handleNewItemNumericChange('kuantitas', e.target.value);
                              requestAnimationFrame(() => {
                                if (qtyRef.current) {
                                  qtyRef.current.focus();
                                }
                              });
                            }}
                            placeholder="0"
                            className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                          />
                          <div className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 min-w-[70px] justify-center">
                            {newItemFormData.satuan || 'unit'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Total Bayar *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                          <SafeNumericInput
                            ref={payRef}
                            value={newItemFormData.totalBayar}
                            onBeforeInput={makeBeforeInputGuard(() => newItemFormData.totalBayar, true)}
                            onPaste={handlePasteGuard(true)}
                            onChange={(e) => {
                              handleNewItemNumericChange('totalBayar', e.target.value);
                              requestAnimationFrame(() => {
                                if (payRef.current) {
                                  payRef.current.focus();
                                }
                              });
                            }}
                            className="h-11 pl-8 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Ringkasan hijau */}
                    {(effectiveQty > 0 || computedUnitPrice > 0) && (
                      <Alert className="border-emerald-200 bg-emerald-50/60">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <AlertDescription>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-emerald-700 font-medium">Harga per {newItemFormData.satuan || 'unit'}</div>
                              <div className="text-lg font-bold text-orange-600">
                                {formatCurrency(computedUnitPrice || 0)}
                              </div>
                            </div>
                            <div>
                              <div className="text-emerald-700 font-medium">Total Qty</div>
                              <div className="text-gray-800">{effectiveQty} {newItemFormData.satuan || 'unit'}</div>
                            </div>
                            <div className="text-right sm:text-left">
                              <div className="text-emerald-700 font-medium">Subtotal</div>
                              <div className="font-semibold text-gray-900">{formatCurrency(subtotal || 0)}</div>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Keterangan */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Keterangan</Label>
                      <Textarea
                        value={newItemFormData.keterangan}
                        onChange={(e) => setNewItemFormData((prev) => ({ ...prev, keterangan: e.target.value }))}
                        placeholder="Keterangan tambahan (opsional)"
                        rows={2}
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                      />
                    </div>

                    {/* Submit */}
                    <Button
                      type="button"
                      onClick={handleAddNewItem}
                      disabled={!canSubmitNewItem}
                      className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white border-0 disabled:bg-gray-300 disabled:text-gray-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah ke Daftar
                    </Button>
                    <p className="mt-2 text-xs text-gray-500">HPP dihitung otomatis saat disimpan.</p>
                  </CardContent>
                </Card>
              )}

              {/* Items List */}
              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada item ditambahkan</p>
                  <p className="text-sm">
                    {canEdit 
                      ? 'Klik "Tambah Item" untuk mulai menambahkan bahan baku'
                      : 'Tidak ada item dalam pembelian ini'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <Card key={index} className="relative">
                      <CardContent className="pt-4">
                        {editingItemIndex === index && canEdit ? (
                          // ✅ EDIT MODE for existing item
                          <EditItemForm
                            item={item}
                            onSave={(updatedItem) => handleSaveEditedItem(index, updatedItem)}
                            onCancel={handleCancelEditItem}
                          />
                        ) : (
                          // ✅ DISPLAY MODE for existing item
                          <div className="flex items-start justify-between">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <div className="font-medium">{item.nama}</div>
                                {/* ID hidden since item creates new material */}
                                {/* ✅ IMPROVED: Display packaging info with proper typing */}
                                {item.jumlahKemasan && item.jumlahKemasan > 0 && item.isiPerKemasan && item.isiPerKemasan > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Kemasan: {item.jumlahKemasan} × {item.isiPerKemasan} {item.satuan || 'unit'}
                                    {item.satuanKemasan ? ` (${item.satuanKemasan})` : ''}
                                  </div>
                                )}
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
                            
                            {canEdit && (
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditItem(index)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {item.keterangan && editingItemIndex !== index && (
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
                    {mode === 'edit' && isDirty && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                        Updated
                      </Badge>
                    )}
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
          
          {canEdit && (
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
                  {mode === 'create' ? (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Buat Pembelian
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Simpan Perubahan
                    </>
                  )}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ✅ ULTRA LIGHTWEIGHT: Edit Item Form dengan zero validation overhead
const EditItemForm: React.FC<{
  item: PurchaseItem;
  onSave: (item: Partial<PurchaseItem>) => void;
  onCancel: () => void;
}> = ({ item, onSave, onCancel }) => {
  // ✅ PURE STATE: No validation during typing
  const [editedItem, setEditedItem] = useState({
    kuantitas: String(item.kuantitas ?? ''),
    hargaSatuan: String(item.hargaSatuan ?? ''),
    keterangan: item.keterangan || '',
  });

  // ✅ ZERO OVERHEAD: Direct state update
  const handleFieldChange = useCallback((field: string, value: string) => {
    setEditedItem(prev => {
      if (prev[field] === value) return prev; // Skip if same
      return { ...prev, [field]: value };
    });
  }, []);

  // ✅ SIMPLE GETTER: No complex logic
  const getValue = useCallback((field: string) => {
    return String(editedItem[field] ?? '');
  }, [editedItem]);

  const handleSave = () => {
    // Convert strings to numbers when saving
    const updates = {
      kuantitas: toNumber(editedItem.kuantitas),
      hargaSatuan: toNumber(editedItem.hargaSatuan),
      keterangan: editedItem.keterangan,
    };
    
    // Calculate new subtotal
    const subtotal = updates.kuantitas * updates.hargaSatuan;
    
    onSave({
      ...updates,
      subtotal,
    });
  };

  const subtotal = toNumber(editedItem.kuantitas) * toNumber(editedItem.hargaSatuan);

  return (
    <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-blue-900">Edit Item: {item.nama}</h4>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={toNumber(editedItem.kuantitas) <= 0 || toNumber(editedItem.hargaSatuan) <= 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Simpan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quantity - ZERO OVERHEAD */}
        <div className="space-y-2">
          <Label>Kuantitas *</Label>
          <div className="flex gap-2">
            <SafeNumericInput
              value={getValue('kuantitas')}
              onChange={(e) => handleFieldChange('kuantitas', e.target.value)}
              placeholder="0"
            />
            <div className="flex items-center px-3 bg-gray-100 rounded text-sm text-gray-600 min-w-[60px]">
              {item.satuan}
            </div>
          </div>
        </div>

        {/* Unit Price - ZERO OVERHEAD */}
        <div className="space-y-2">
          <Label>Harga Satuan *</Label>
          <SafeNumericInput
            value={getValue('hargaSatuan')}
            onChange={(e) => handleFieldChange('hargaSatuan', e.target.value)}
            placeholder="0"
          />
        </div>

        {/* Subtotal Preview */}
        <div className="space-y-2">
          <Label>Subtotal</Label>
          <div className="flex items-center h-10 px-3 bg-green-100 border border-green-300 rounded text-green-800 font-medium">
            {formatCurrency(subtotal)}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Keterangan</Label>
        <Textarea
          value={editedItem.keterangan}
          onChange={(e) => handleFieldChange('keterangan', e.target.value)}
          placeholder="Keterangan tambahan (opsional)"
          rows={2}
        />
      </div>

      {/* Changes Summary */}
      <div className="bg-blue-100 p-3 rounded-lg">
        <div className="text-sm text-blue-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Sebelum:</strong>
              <div>Qty: {item.kuantitas} {item.satuan}</div>
              <div>Harga: {formatCurrency(item.hargaSatuan)}</div>
              <div>Subtotal: {formatCurrency(item.subtotal)}</div>
            </div>
            <div>
              <strong>Sesudah:</strong>
              <div>Qty: {toNumber(editedItem.kuantitas)} {item.satuan}</div>
              <div>Harga: {formatCurrency(toNumber(editedItem.hargaSatuan))}</div>
              <div>Subtotal: {formatCurrency(subtotal)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseDialog;