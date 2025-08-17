// src/components/purchase/components/PurchaseDialog.tsx - Enhanced for Edit Mode

import React, { useEffect, useState, useCallback } from 'react';
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
  X,
  Edit3,
  Save,
  RotateCcw
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { PurchaseDialogProps, PurchaseItem } from '../types/purchase.types';
import { usePurchaseForm } from '../hooks/usePurchaseForm';
import { usePurchaseItemManager } from '../hooks/usePurchaseItemManager';
import { formatCurrency } from '@/utils/formatUtils';
import { toast } from 'sonner';
import SimplePurchaseItemForm, { PurchaseItemPayload } from './SimplePurchaseItemForm'; // ✅ NEW: Import the payload type

// ✅ OPTIMIZED: Move outside component to prevent recreation
const toNumber = (v: string | number | '' | undefined | null): number => {
  if (v === '' || v == null) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  
  let s = v.toString().trim().replace(/\s+/g, '');
  s = s.replace(/[^\d,.\-]/g, '');
  
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(/,/g, '.');
  } else {
    s = s.replace(/,/g, '.');
  }
  
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

// ✅ OPTIMIZED: Move outside component to prevent recreation  
const SafeNumericInput = React.forwardRef<
  HTMLInputElement, 
  React.InputHTMLAttributes<HTMLInputElement> & { value: string | number }
>(({ className = '', value, onChange, ...props }, ref) => {
  const baseClasses = "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-50";
  
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
interface EnhancedPurchaseDialogProps extends PurchaseDialogProps {
  initialAddMode?: 'quick' | 'packaging'; // NEW: Added prop for auto-opening with specific mode
}

const PurchaseDialog: React.FC<EnhancedPurchaseDialogProps> = ({
  isOpen,
  mode,
  purchase,
  suppliers,
  bahanBaku,
  onClose,
  initialAddMode, // ✅ NEW: Added prop for auto-opening with specific mode
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

  // Item management
  const {
    showAddItem,
    setShowAddItem,
    editingItemIndex,
    handleEditItem,
    handleSaveEditedItem,
    handleCancelEditItem,
  } = usePurchaseItemManager({
    bahanBaku,
    items: formData.items,
    addItem,
    updateItem,
  });

  // ✅ Reset form states when dialog opens/closes + handle initialAddMode
  useEffect(() => {
    if (isOpen) {
      // Auto-open add item form if initialAddMode is 'packaging'
      setShowAddItem(initialAddMode === 'packaging');
      handleCancelEditItem();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialAddMode]);

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
      setShowAddItem(false);
      if (handleCancelEditItem) handleCancelEditItem();
      toast.info('Form direset ke kondisi awal');
    }
  }, [handleReset, setShowAddItem, handleCancelEditItem]);

  const onSubmit = useCallback(async () => {
    if (formData.items.length === 0) {
      toast.error('Minimal harus ada 1 item dalam pembelian');
      return;
    }
    await handleSubmit();
  }, [formData.items.length, handleSubmit]);

  // ✅ ENHANCED: Handle payload from SimplePurchaseItemForm
  const handleAddItemFromForm = useCallback((payload: PurchaseItemPayload) => {
    // Convert payload to PurchaseItem format expected by the form
    const purchaseItem: PurchaseItem = {
      bahanBakuId: payload.bahanBakuId,
      nama: payload.nama,
      satuan: payload.satuan,
      kuantitas: payload.kuantitas,
      hargaSatuan: payload.hargaSatuan,
      subtotal: payload.kuantitas * payload.hargaSatuan,
      keterangan: payload.keterangan,
      // ✅ NEW: Include packaging info if available
      ...(payload.jumlahKemasan && { jumlahKemasan: payload.jumlahKemasan }),
      ...(payload.isiPerKemasan && { isiPerKemasan: payload.isiPerKemasan }),
      ...(payload.satuanKemasan && { satuanKemasan: payload.satuanKemasan }),
      ...(payload.hargaTotalBeliKemasan && { hargaTotalBeliKemasan: payload.hargaTotalBeliKemasan }),
    };

    addItem(purchaseItem);
    setShowAddItem(false);
    toast.success(`${payload.nama} berhasil ditambahkan`);
  }, [addItem, setShowAddItem]);

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

              {/* Calculation Method */}
              <div className="space-y-2">
                <Label htmlFor="metodePerhitungan">Metode Perhitungan Stok</Label>
                <Select
                  value={formData.metodePerhitungan}
                  onValueChange={(value: 'FIFO' | 'LIFO' | 'AVERAGE') =>
                    updateFormField('metodePerhitungan', value) // ✅ FIXED: Use updateFormField
                  }
                  disabled={!canEdit}
                >
                  <SelectTrigger className={!canEdit ? 'opacity-50' : ''}>
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
                  {mode === 'edit' && isDirty && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Modified
                    </Badge>
                  )}
                </CardTitle>
                {canEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddItem(!showAddItem)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Item
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ✅ ENHANCED: Smart Add New Item Form with clean payload handling */}
              {canEdit && showAddItem && (
                <SimplePurchaseItemForm
                  bahanBaku={bahanBaku}
                  initialMode={initialAddMode === 'packaging' ? 'packaging' : 'quick'} // ✅ NEW: Pass initial mode
                  onCancel={() => setShowAddItem(false)}
                  onAdd={handleAddItemFromForm} // ✅ CLEAN: Use the new handler
                />
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
                                <div className="text-sm text-gray-600">ID: {item.bahanBakuId}</div>
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