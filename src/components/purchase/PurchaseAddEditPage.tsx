// src/components/purchase/PurchaseAddEditPage.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { ActionButtons } from '@/components/ui/action-buttons';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingStates } from '@/components/ui/loading-spinner';
import { 
  Plus, 
  Trash2, 
  Package,
  Calculator,
  ShoppingCart,
  Edit3,
  Save,
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
  Home
} from 'lucide-react';
import { UserFriendlyDate } from '@/utils/userFriendlyDate';

import { PurchaseItem } from './types/purchase.types';
import { usePurchaseForm } from './hooks/usePurchaseForm';
import { formatCurrency } from '@/lib/shared';
import { toast } from 'sonner';
import { useSupplier } from '@/contexts/SupplierContext';
import { usePurchase } from './hooks/usePurchase';
import { Skeleton, LoadingSkeleton } from '@/components/ui/skeleton';

// Import extracted components
import { NewItemForm } from './components/dialogs/NewItemForm';
import SupplierComboBox from './components/SupplierComboBox';

// Import Breadcrumb components
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const PurchaseAddEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: purchaseId } = useParams<{ id: string }>();
  const { suppliers } = useSupplier();
  
  // Safely access the purchase context
  let purchaseContext;
  let getPurchaseById;
  
  try {
    purchaseContext = usePurchase();
    getPurchaseById = purchaseContext?.getPurchaseById;
  } catch (error) {
    console.error('Error accessing purchase context:', error);
    purchaseContext = null;
    getPurchaseById = undefined;
  }

  const isEditing = !!purchaseId;
  const [purchase, setPurchase] = useState(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [dataLoaded, setDataLoaded] = useState(!isEditing); // For create mode, data is immediately "loaded"

  // Load purchase data for editing
  useEffect(() => {
    if (isEditing && purchaseId && getPurchaseById) {
      console.log('Loading purchase data for ID:', purchaseId);
      setIsLoading(true);
      setDataLoaded(false);
      
      try {
        const purchaseData = getPurchaseById(purchaseId);
        console.log('Retrieved purchase data:', purchaseData);
        
        if (purchaseData) {
          setPurchase(purchaseData);
          setDataLoaded(true);
          toast.success('Data pembelian berhasil dimuat');
        } else {
          console.warn('Purchase not found for ID:', purchaseId);
          toast.error('Data pembelian tidak ditemukan');
          navigate('/purchase');
          return;
        }
      } catch (error) {
        console.error('Error loading purchase data:', error);
        toast.error('Gagal memuat data pembelian');
        navigate('/purchase');
        return;
      } finally {
        setIsLoading(false);
      }
    } else if (!isEditing) {
      // For create mode, ensure data is marked as loaded
      setDataLoaded(true);
      setIsLoading(false);
    }
  }, [isEditing, purchaseId, getPurchaseById, navigate]);

  // Only initialize the form when data is loaded
  const {
    formData,
    updateFormField,
    isSubmitting,
    isDirty,
    validation,
    addItem,
    updateItem,
    removeItem,
    handleSubmit,
    handleReset,
    total_nilai,
  } = usePurchaseForm({
    mode: isEditing ? 'edit' : 'create',
    initialData: dataLoaded ? purchase : null, // Only pass data when it's loaded
    suppliers,
    onSuccess: () => {
      toast.success(
        isEditing 
          ? 'Pembelian berhasil diperbarui!' 
          : 'Pembelian berhasil dibuat!'
      );
      navigate('/purchase');
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Item management
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const handleEditItem = useCallback((index: number) => {
    setEditingItemIndex(index);
    toast.info('Mode edit item aktif');
  }, []);

  const handleSaveEditedItem = useCallback((index: number, updatedItem: Partial<PurchaseItem>) => {
    const qty = Number(updatedItem.quantity) || 0;
    const price = Number(updatedItem.unitPrice) || 0;

    if (qty <= 0 || price <= 0) {
      toast.error('Kuantitas dan harga satuan harus > 0');
      return;
    }

    updateItem(index, { ...updatedItem, subtotal: qty * price });
    setEditingItemIndex(null);
    toast.success('Item berhasil diperbarui');
  }, [updateItem]);

  const handleCancelEditItem = useCallback(() => setEditingItemIndex(null), []);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      if (confirm('Ada perubahan yang belum disimpan. Yakin ingin keluar?')) {
        navigate('/purchase');
      }
    } else {
      navigate('/purchase');
    }
  }, [isDirty, navigate]);

  const handleResetForm = useCallback(() => {
    if (confirm('Reset semua perubahan ke kondisi awal?')) {
      handleReset();
      handleCancelEditItem();
      toast.info('Form direset ke kondisi awal');
    }
  }, [handleReset, handleCancelEditItem]);

  const onSubmit = useCallback(async (status?: string) => {
    if (formData.items.length === 0) {
      toast.error('Minimal harus ada 1 item dalam pembelian');
      return;
    }
    if (status === 'completed' && (total_nilai ?? 0) <= 0) {
      toast.error('Total nilai harus lebih dari 0 untuk menyelesaikan pembelian');
      return;
    }
    await handleSubmit(status);
  }, [formData.items.length, handleSubmit, total_nilai]);

  // Handle adding new item from form
  const handleAddNewItem = useCallback((item: PurchaseItem) => {
    addItem(item);
    toast.success(`${item.nama} berhasil ditambahkan`);
  }, [addItem]);

  const canEdit = !purchase || purchase.status !== 'cancelled';
  const isViewOnly = !canEdit;


  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Purchase', href: '/purchase' },
    { 
      label: isEditing ? 'Edit Pembelian' : 'Tambah Pembelian'
    }
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <LoadingStates type="form" text="Memuat data pembelian..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-20 sm:pb-8">
      {/* Header with Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                  <Home className="h-4 w-4" />
                  Dashboard
                </Button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Button variant="ghost" size="sm" onClick={() => navigate('/purchase')}>
                  Purchase
                </Button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {isEditing ? 'Edit Pembelian' : 'Tambah Pembelian'}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Title */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline" 
              size="sm"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-orange-600" />
                </div>
                {isEditing ? 'Edit Pembelian' : 'Tambah Pembelian'}
                {purchase && purchase.status && (
                  <StatusBadge
                    status={typeof purchase.status === 'string' ? purchase.status : String(purchase.status)}
                    className="ml-2"
                  />
                )}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEditing
                  ? 'Edit detail pembelian dan item bahan baku'
                  : 'Tambah pembelian baru dan kelola item bahan baku'}
              </p>
            </div>
          </div>
        </div>
      </div>

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Supplier *</Label>
                <SupplierComboBox
                  value={formData.supplier}
                  onValueChange={(supplierName, supplierId) => {
                    updateFormField('supplier', supplierName);
                  }}
                  suppliers={suppliers}
                  disabled={isSubmitting || isViewOnly}
                  placeholder="Pilih atau tulis nama supplier"
                  hasError={!!(validation?.supplier)}
                />
                {validation?.supplier && (
                  <p className="text-xs text-red-500">{validation.supplier}</p>
                )}
              </div>

              <FormField
                label="Tanggal"
                type="date"
                value={formData.tanggal ? UserFriendlyDate.toYMD(formData.tanggal) : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const safeDate = UserFriendlyDate.safeParseToDate(e.target.value);
                    updateFormField('tanggal', safeDate);
                  }
                }}
                disabled={isSubmitting || isViewOnly}
                error={validation?.tanggal}
                required
                icon={Calculator}
                max={new Date().toISOString().split('T')[0]}
                min={new Date(new Date().getFullYear() - 5, 0, 1).toISOString().split('T')[0]}
              />
            </div>

            {/* Keterangan */}
            <FormField
              label="Keterangan"
              type="textarea"
              value={formData.keterangan}
              onChange={(e) => updateFormField('keterangan', e.target.value)}
              placeholder="Catatan tambahan tentang pembelian ini (opsional)"
              disabled={isSubmitting || isViewOnly}
              rows={3}
            />
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
            {!isViewOnly && (
              <NewItemForm onAddItem={handleAddNewItem} />
            )}

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
                        {!isViewOnly && (
                          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditItem(index)}
                              disabled={isSubmitting}
                              className="h-8 w-8 p-0 border-gray-300 hover:bg-orange-50"
                            >
                              <Edit3 className="h-3 w-3 text-gray-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeItem(index)}
                              disabled={isSubmitting}
                              className="h-8 w-8 p-0 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Kuantitas:</span>
                          <div className="font-medium text-gray-900">{item.quantity} {item.satuan}</div>
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
                      <span className="font-bold text-lg text-green-600">{formatCurrency(total_nilai)}</span>
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
                        {!isViewOnly && (
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        )}
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
                            {item.quantity} {item.satuan}
                          </td>
                          <td className="px-4 py-3 text-gray-900">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {formatCurrency(item.subtotal)}
                          </td>
                          {!isViewOnly && (
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditItem(index)}
                                  disabled={isSubmitting}
                                  className="h-8 w-8 p-0 border-gray-300 hover:bg-orange-50"
                                >
                                  <Edit3 className="h-3 w-3 text-gray-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeItem(index)}
                                  disabled={isSubmitting}
                                  className="h-8 w-8 p-0 border-red-300 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3 text-red-600" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold">
                      <tr>
                        <td colSpan={isViewOnly ? 3 : 4} className="px-4 py-3 text-right text-gray-900">
                          Total
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {formatCurrency(total_nilai)}
                        </td>
                        {!isViewOnly && <td></td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Package}
                title="Belum ada item"
                description="Tambah item pembelian menggunakan form di atas."
              />
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Total Pembelian</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(total_nilai)}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-gray-600">{formData.items.length} Item</p>
                <p className="text-sm text-gray-500 truncate">
                  {formData.supplier
                    ? `Supplier: ${formData.supplier}`
                    : 'Supplier belum dipilih'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Bar (Sticky) */}
        {!isViewOnly && (
          <div className="sticky bottom-0 sm:bottom-0 md:bottom-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t px-4 py-3 mt-6 mb-16 sm:mb-0">
            <ActionButtons
              actions={[
                {
                  type: 'secondary',
                  label: 'Reset',
                  icon: RotateCcw,
                  onClick: handleResetForm,
                  disabled: isSubmitting || !isDirty,
                },
                {
                  type: 'secondary',
                  label: isEditing ? 'Simpan Perubahan' : 'Simpan Draft',
                  icon: Save,
                  onClick: () => onSubmit(),
                  disabled: isSubmitting,
                },
                ...((!purchase || purchase.status !== 'completed') ? [{
                  type: 'primary' as const,
                  label: 'Selesaikan & Update Gudang',
                  shortLabel: 'Selesaikan',
                  icon: CheckCircle2,
                  onClick: () => onSubmit('completed'),
                  disabled: isSubmitting || formData.items.length === 0 || !formData.supplier.trim(),
                  className: 'flex-1 sm:flex-none',
                }] : []),
              ]}
              isLoading={isSubmitting}
              loadingText="Menyimpan..."
            />

          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseAddEditPage;
