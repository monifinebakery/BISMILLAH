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
// Removed Select components - using SupplierComboBox instead
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
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { UnifiedDateHandler } from '@/utils/unifiedDateHandler';
import { safeParseDate } from '@/utils/unifiedDateUtils'; // Keep for transition
import { UserFriendlyDate } from '@/utils/userFriendlyDate';

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
import { EditItemDialog } from './dialogs/EditItemDialog';
import SupplierComboBox from './SupplierComboBox';
import WACImpactWarning from './WACImpactWarning';
import PurchaseImpactPreview from '../PurchaseImpactPreview';

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
    suppliers, // Pass suppliers to enable ID->name conversion
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


  // Item management - using separate dialog
  const [editItemDialog, setEditItemDialog] = useState<{
    isOpen: boolean;
    item: PurchaseItem | null;
    index: number | null;
  }>({ isOpen: false, item: null, index: null });
  
  // Calendar modal state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleEditItem = useCallback((index: number) => {
    console.log('🔧 Edit item clicked for index:', index);
    const itemToEdit = formData.items[index];
    if (itemToEdit) {
      setEditItemDialog({
        isOpen: true,
        item: itemToEdit,
        index: index,
      });
    }
  }, [formData.items]);

  const handleSaveEditedItem = useCallback((index: number, updatedItem: Partial<PurchaseItem>) => {
    console.log('💾 Saving edited item:', { index, updatedItem });
    updateItem(index, updatedItem);
    setEditItemDialog({ isOpen: false, item: null, index: null });
  }, [updateItem]);

  const handleCancelEditItem = useCallback(() => {
    setEditItemDialog({ isOpen: false, item: null, index: null });
  }, []);

  // ✅ Reset form states when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      handleCancelEditItem();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, handleCancelEditItem]);

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
      <DialogContent centerMode="overlay" size="md+">
        <div className="dialog-panel dialog-panel-md-plus dialog-no-overflow">
          <DialogHeader className="dialog-header">
            <DialogTitle className="flex items-center gap-3 pr-12"> {/* Add right padding to avoid close button */}
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-4 h-4 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-lg sm:text-xl text-overflow-safe">
                  {mode === 'create' ? 'Tambah Pembelian' :
                   mode === 'edit' ? 'Edit Pembelian' : 'Detail Pembelian'}
                </span>
                {purchase && (
                  <Badge className={`${statusClassMap[purchase.status]} ml-2 text-xs flex-shrink-0`}>
                    {purchase.status === 'pending' ? 'Menunggu' :
                     purchase.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                  </Badge>
                )}
              </div>
            </DialogTitle>
            <DialogDescription className="text-overflow-safe">
              {mode === 'create'
                ? 'Tambah pembelian baru dan kelola item bahan baku'
                : mode === 'edit'
                  ? 'Edit detail pembelian dan item bahan baku'
                  : 'Lihat detail pembelian'}
            </DialogDescription>
          </DialogHeader>
          <div className="dialog-body">
            <div className="space-y-4 sm:space-y-6 dialog-no-overflow">
          {/* Header Form - Supplier dan Tanggal */}
          <Card className="border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-overflow-safe">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
                Informasi Pembelian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Supplier dan Tanggal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Supplier *</Label>
                  <SupplierComboBox
                    value={formData.supplier}
                    onValueChange={(supplierName, supplierId) => {
                      // Always use supplier name for consistency
                      updateFormField('supplier', supplierName);
                    }}
                    suppliers={suppliers}
                    disabled={isSubmitting || isViewOnly}
                    placeholder="Pilih atau tulis nama supplier"
                    hasError={!!validation.supplier}
                  />
                  {validation.supplier && (
                    <p className="text-xs text-red-500">{validation.supplier}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Tanggal *</Label>
                  <Button
                    variant="outline"
                    className={`h-11 w-full justify-start border-gray-200 text-left font-normal focus:border-orange-500 focus:ring-orange-500/20 ${!formData.tanggal && 'text-muted-foreground'}`}
                    disabled={isSubmitting || isViewOnly}
                    onClick={() => setIsCalendarOpen(true)}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {formData.tanggal ? UserFriendlyDate.format(formData.tanggal) : 'Pilih tanggal'}
                    </span>
                  </Button>
                  {validation.tanggal && (
                    <p className="text-xs text-red-500">{validation.tanggal}</p>
                  )}
                </div>
              </div>

              {/* Keterangan */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 text-overflow-safe">Keterangan</Label>
                <Textarea
                  value={formData.keterangan}
                  onChange={(e) => updateFormField('keterangan', e.target.value)}
                  placeholder="Catatan tambahan tentang pembelian ini (opsional)"
                  rows={3}
                  className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 resize-none input-mobile-safe"
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
              {/* WAC Impact Warning */}
               {formData.items.length > 0 && (
                 <WACImpactWarning items={formData.items} />
               )}
               
              {/* Purchase Impact Preview */}
              {formData.items.length > 0 && (
                <PurchaseImpactPreview 
                  items={formData.items}
                  onImpactCalculated={(impact) => {
                    // Handle impact calculation result
                    console.log('Purchase impact:', impact);
                  }}
                />
              )}
              
              {/* Add New Item Form */}
              <NewItemForm
                onAddItem={handleAddNewItem}
              />

              {/* Items Table */}
              {formData.items.length > 0 ? (
                <div className="border rounded-lg overflow-x-auto">
                  {/* Mobile Card Layout */}
                  <div className="block md:hidden">
                    {formData.items.map((item, index) => (
                      <div key={index} className="border-b border-gray-200 last:border-b-0 p-4 bg-white hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{item.nama}</h4>
                            <p className="text-sm text-gray-500">{item.satuan}</p>
                            {item.keterangan && (
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.keterangan}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditItem(index)}
                              disabled={isSubmitting || isViewOnly}
                              className="h-8 w-8 p-0 border-gray-300 hover:bg-orange-50"
                              title="Edit item"
                            >
                              <Edit3 className="h-3 w-3 text-gray-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeItem(index)}
                              disabled={isSubmitting || isViewOnly}
                              className="h-8 w-8 p-0 border-red-300 hover:bg-red-50"
                              title="Hapus item"
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Kuantitas:</span>
                            <div className="font-medium text-gray-900">{item.kuantitas} {item.satuan}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Harga Satuan:</span>
                            <div className="font-medium text-gray-900">{formatCurrency(item.unitPrice)}</div>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                            <span className="font-bold text-green-600">{formatCurrency(item.subtotal)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="p-4 bg-gray-50 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">Total Keseluruhan:</span>
                        <span className="font-bold text-lg text-green-600">{formatCurrency(totalValue)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Table Layout */}
                  <div className="hidden md:block">
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Total Pembelian</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalValue)}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-gray-600">{formData.items.length} Item</p>
                  <p className="text-sm text-gray-500 truncate max-w-[200px] sm:max-w-none">
                    {formData.supplier
                      ? `Supplier: ${formData.supplier}`
                      : 'Supplier belum dipilih'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
            </div>
          </div>

          {/* Footer Actions */}
          {mode !== 'view' && canEdit && (
            <DialogFooter className="flex-col sm:flex-row gap-3 pt-6">
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetForm}
                  disabled={isSubmitting || !isDirty}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 h-11"
                >
                  <RotateCcw className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Reset</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => onSubmit()}
                  disabled={isSubmitting || !isDirty}
                  variant="outline"
                  className="h-11"
                >
                  <Save className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{mode === 'create' ? 'Simpan Draft' : 'Simpan Perubahan'}</span>
                </Button>

                {purchase?.status !== 'completed' && (
                  <Button
                    type="button"
                    onClick={() => onSubmit('completed')}
                    disabled={isSubmitting || !isDirty}
                    className="bg-green-600 hover:bg-green-700 text-white border-0 disabled:bg-gray-300 disabled:text-gray-500 h-11 flex-1 sm:flex-none"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent flex-shrink-0"></div>
                        <span className="truncate">Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="hidden sm:inline">Selesaikan & Update Gudang</span>
                        <span className="sm:hidden">Selesaikan</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
      
      {/* Edit Item Dialog */}
      <EditItemDialog
        isOpen={editItemDialog.isOpen}
        item={editItemDialog.item}
        itemIndex={editItemDialog.index ?? undefined}
        onClose={handleCancelEditItem}
        onSave={handleSaveEditedItem}
      />
      
      {/* Calendar Modal - Separate Dialog */}
      <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <DialogContent centerMode="overlay" size="sm" hideCloseButton={false}>
          <div className="dialog-panel dialog-panel-sm">
            <DialogHeader className="dialog-header">
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-orange-600" />
                Pilih Tanggal
              </DialogTitle>
              <DialogDescription>
                Pilih tanggal untuk pembelian ini.
              </DialogDescription>
            </DialogHeader>
            <div className="dialog-body">
              <Calendar
                mode="single"
                selected={UserFriendlyDate.forCalendar(formData.tanggal)}
                onSelect={(date) => {
                  if (date) {
                    // Use UserFriendlyDate to ensure consistent date handling
                    const safeDate = UserFriendlyDate.safeParseToDate(date);
                    updateFormField('tanggal', safeDate);
                  } else {
                    updateFormField('tanggal', new Date());
                  }
                  setIsCalendarOpen(false);
                }}
                disabled={(date) => {
                  const today = new Date();
                  const fiveYearsAgo = new Date();
                  fiveYearsAgo.setFullYear(today.getFullYear() - 5);
                  // Allow past dates up to 5 years ago, no future dates beyond today
                  return date > today || date < fiveYearsAgo;
                }}
                initialFocus
                locale={id}
                className="mx-auto"
              />
            </div>
            <DialogFooter className="dialog-footer">
              <div className="dialog-responsive-buttons">
                <Button
                  variant="outline"
                  onClick={() => setIsCalendarOpen(false)}
                  className="input-mobile-safe"
                >
                  Batal
                </Button>
                <Button
                  onClick={() => {
                    if (!formData.tanggal) {
                      updateFormField('tanggal', new Date().toISOString());
                    }
                    setIsCalendarOpen(false);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white input-mobile-safe"
                >
                  {formData.tanggal ? 'Selesai' : 'Pilih Hari Ini'}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default PurchaseDialog;
