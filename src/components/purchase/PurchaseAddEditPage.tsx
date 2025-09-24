// src/components/purchase/PurchaseAddEditPage.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Calculator, Home, Package, RotateCcw, Save, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useCurrency } from '@/contexts/CurrencyContext';
import { UserFriendlyDate } from '@/utils/userFriendlyDate';

import { PurchaseItem } from './types/purchase.types';
import { usePurchaseForm } from './hooks/usePurchaseForm';

import { useSupplier } from '@/contexts/SupplierContext';
import { usePurchase } from './hooks/usePurchase';
// Import extracted components
const NewItemForm = React.lazy(() => import('./components/dialogs/NewItemForm').then(module => ({ default: module.NewItemForm })));
  const { formatCurrency } = useCurrency();import SupplierComboBox from './components/SupplierComboBox';
import { ItemRow } from './components/ItemRow';
import { ItemTotal } from './components/ItemTotal';

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
  const { formatCurrency } = useCurrency();
  const { suppliers } = useSupplier();
  
  // Safely access the purchase context
  const purchaseContext = usePurchase();
  const getPurchaseById = purchaseContext?.getPurchaseById;

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
          // Toast notifications sudah ditangani oleh PurchaseContext
        } else {
          console.warn('Purchase not found for ID:', purchaseId);
          // Toast notifications sudah ditangani oleh PurchaseContext
          navigate('/purchase');
          return;
        }
      } catch (error) {
        console.error('Error loading purchase data:', error);
        // Toast notifications sudah ditangani oleh PurchaseContext
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
    validateField,
    validateForm,
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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
  const { formatCurrency } = useCurrency();      validateForm();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData, validateForm]);

  // Item management
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const handleEditItem = useCallback((index: number) => {
  const { formatCurrency } = useCurrency();    setEditingItemIndex(index);
    toast.info('Mode edit item aktif');
  }, []);

  const handleSaveEditedItem = useCallback((index: number, updatedItem: Partial<PurchaseItem>) => {
  const { formatCurrency } = useCurrency();    const qty = Number(updatedItem.quantity) || 0;
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
  const { formatCurrency } = useCurrency();    if (isDirty) {
      if (confirm('Ada perubahan yang belum disimpan. Yakin ingin keluar?')) {
        navigate('/purchase');
      }
    } else {
      navigate('/purchase');
    }
  }, [isDirty, navigate]);

  const handleResetForm = useCallback(() => {
  const { formatCurrency } = useCurrency();    if (confirm('Reset semua perubahan ke kondisi awal?')) {
      handleReset();
      handleCancelEditItem();
      toast.info('Form direset ke kondisi awal');
    }
  }, [handleReset, handleCancelEditItem]);

  const onSubmit = useCallback(async (status?: string) => {
  const { formatCurrency } = useCurrency();    // Authentication is already handled by AuthGuard at router level
    
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
  const { formatCurrency } = useCurrency();    addItem(item);
    toast.success(`${item.nama} berhasil ditambahkan`);
  }, [addItem]);

  const canEdit = !purchase || purchase.status !== 'cancelled';
  const isViewOnly = !canEdit;

  // ✅ PERFORMANCE: Memoized breadcrumb items to prevent unnecessary re-renders
  const breadcrumbItems = useMemo(() => [
    { label: 'Purchase', href: '/purchase' },
    { 
      label: isEditing ? 'Edit Pembelian' : 'Tambah Pembelian'
    }
  ], [isEditing]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <LoadingStates.Form text="Memuat data pembelian..." />
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

        {/* Validation Summary */}
        {(validation?.errors?.length > 0 || validation?.warnings?.length > 0) && (
          <div 
            className="mt-4 space-y-3"
            role="region"
            aria-live="polite"
            aria-label="Form validation messages"
          >
            {validation.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Perbaiki kesalahan berikut:</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc pl-5 space-y-1">
                        {validation.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Peringatan:</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc pl-5 space-y-1">
                        {validation.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
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
              <Package className="h-5 w-5 text-orange-600" aria-hidden="true" />
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
                  hasError={!!(validation?.fieldErrors?.supplier)}
                />
                {validation?.fieldErrors?.supplier && (
                  <p className="text-xs text-red-500">{validation.fieldErrors.supplier}</p>
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
                error={validation?.fieldErrors?.tanggal}
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
              <Package className="h-5 w-5 text-orange-600" aria-hidden="true" />
              Daftar Item Pembelian
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Validation Errors for Items */}
            {validation?.errors?.length > 0 && validation.errors.some(error => 
              error.toLowerCase().includes('item') || 
              error.toLowerCase().includes('minimal satu') ||
              error.toLowerCase().includes('bahan baku')
            ) && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Ada kesalahan dalam daftar item:</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc pl-5 space-y-1">
                        {validation.errors.filter(error => 
                          error.toLowerCase().includes('item') || 
                          error.toLowerCase().includes('minimal satu') ||
                          error.toLowerCase().includes('bahan baku')
                        ).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Add New Item Form */}
            {!isViewOnly && (
              <React.Suspense fallback={<div className="animate-pulse bg-gray-200 h-32 rounded-md"></div>}>
                <NewItemForm onAddItem={handleAddNewItem} />
              </React.Suspense>
            )}

            {/* Items Table */}
            {formData.items.length > 0 ? (
              <div className="border rounded-lg overflow-x-auto">
                {/* Mobile Card Layout */}
                <div className="block md:hidden">
                  {formData.items.map((item, index) => (
                    <ItemRow
                      key={item.bahanBakuId || `item-${index}`}
                      item={item}
                      index={index}
                      isViewOnly={isViewOnly}
                      isSubmitting={isSubmitting}
                      onEdit={handleEditItem}
                      onDelete={removeItem}
                      variant="mobile"
                    />
                  ))}
                  <ItemTotal
                    total_nilai={total_nilai}
                    variant="mobile"
                    isViewOnly={isViewOnly}
                  />
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden md:block">
                  <table 
                    className="w-full"
                    role="table"
                    aria-label="Purchase items table"
                  >
                    <thead className="bg-gray-50">
                      <tr role="row">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" role="columnheader" scope="col">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" role="columnheader" scope="col">Kuantitas</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" role="columnheader" scope="col">Harga Satuan</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" role="columnheader" scope="col">Subtotal</th>
                        {!isViewOnly && (
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" role="columnheader" scope="col">Aksi</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200" role="rowgroup">
                      {formData.items.map((item, index) => (
                        <ItemRow
                          key={item.bahanBakuId || `item-${index}`}
                          item={item}
                          index={index}
                          isViewOnly={isViewOnly}
                          isSubmitting={isSubmitting}
                          onEdit={handleEditItem}
                          onDelete={removeItem}
                          variant="desktop"
                        />
                      ))}
                    </tbody>
                    <ItemTotal
                      total_nilai={total_nilai}
                      variant="desktop"
                      isViewOnly={isViewOnly}
                    />
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
                    ? 'Supplier: ' + formData.supplier
                    : 'Supplier belum dipilih'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Bar (Sticky) */}
        {!isViewOnly && (
          <div className="sticky bottom-0 sm:bottom-0 md:bottom-0 z-40 bg-white/95 backdrop-blur border-t px-4 py-3 mt-6 mb-16 sm:mb-0">
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetForm}
                disabled={isSubmitting || !isDirty}
                className="h-11"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => onSubmit()}
                disabled={isSubmitting}
                className="h-11"
              >
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Simpan Perubahan' : 'Simpan Draft'}
              </Button>

              {(!purchase || purchase.status !== 'completed') && (
                <Button
                  type="button"
                  onClick={() => onSubmit('completed')}
                  disabled={isSubmitting || formData.items.length === 0 || !formData.supplier.trim()}
                  className="bg-orange-500 hover:bg-orange-600 text-white h-11 flex-1 sm:flex-none"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  <span className="truncate sm:hidden">Selesaikan</span>
                  <span className="hidden sm:inline">Selesaikan & Update Gudang</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseAddEditPage;
