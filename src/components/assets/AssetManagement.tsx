// src/components/assets/AssetManagement.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, AlertTriangle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useAssetQuery, 
  useAssetMutations, 
  useAssetForm, 
  useAssetCalculations 
} from './hooks';
import { Asset, AssetCreateInput, AssetUpdateInput } from './types';
import { 
  AssetStatistics, 
  AssetTable, 
  AssetCard, 
  AssetForm,
  AssetDeleteDialog 
} from './components';

export const AssetManagement: React.FC = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  // State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<{ id: string; name: string } | null>(null);

  // Hooks
  const { assets, isLoading, error } = useAssetQuery({ 
    userId: user?.id,
    enableRealtime: true 
  });

  const { statistics } = useAssetCalculations({ assets });

  const { 
    createAsset, 
    updateAsset, 
    deleteAsset: performDelete,
    isLoading: isMutating 
  } = useAssetMutations({
    userId: user?.id || '',
    onSuccess: {
      onCreate: () => {
        setShowAddForm(false);
        resetForm();
      },
      onUpdate: () => {
        setShowAddForm(false);
        setEditingAsset(null);
        resetForm();
      },
      onDelete: () => {
        setDeleteAsset(null);
      }
    }
  });

  const {
    data: formData,
    errors: formErrors,
    canSubmit,
    updateField,
    resetForm,
    validateForm,
  } = useAssetForm({
    mode: editingAsset ? 'edit' : 'create',
    asset: editingAsset || undefined,
  });

  // Handlers
  const handleAddNew = () => {
    setEditingAsset(null);
    resetForm();
    setShowAddForm(true);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setShowAddForm(true);
  };

  const handleDeleteRequest = (id: string, name: string) => {
    setDeleteAsset({ id, name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAsset) return;
    
    try {
      await performDelete(deleteAsset.id, deleteAsset.name);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingAsset) {
        const updateData: AssetUpdateInput = {
          nama: formData.nama,
          kategori: formData.kategori as any,
          nilaiAwal: formData.nilaiAwal as number,
          nilaiSaatIni: formData.nilaiSaatIni as number,
          tanggalPembelian: formData.tanggalPembelian!,
          kondisi: formData.kondisi as any,
          lokasi: formData.lokasi,
          deskripsi: formData.deskripsi || undefined,
          depresiasi: formData.depresiasi as number || undefined,
        };
        await updateAsset(editingAsset.id, updateData);
      } else {
        const createData: AssetCreateInput = {
          nama: formData.nama,
          kategori: formData.kategori as any,
          nilaiAwal: formData.nilaiAwal as number,
          nilaiSaatIni: formData.nilaiSaatIni as number,
          tanggalPembelian: formData.tanggalPembelian!,
          kondisi: formData.kondisi as any,
          lokasi: formData.lokasi,
          deskripsi: formData.deskripsi || undefined,
          depresiasi: formData.depresiasi as number || undefined,
        };
        await createAsset(createData);
      }
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  const handleFormClose = () => {
    setShowAddForm(false);
    setEditingAsset(null);
    resetForm();
  };

  // Error state
  if (error && !user) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access asset management.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Memuat data aset...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white">
      <div className={`w-full max-w-none px-4 py-4 ${isMobile ? 'pb-20' : ''}`}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full mr-4">
              <Building2 className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Manajemen Aset
              </h1>
              <p className="text-gray-600 text-sm">
                Kelola dan pantau aset bisnis Anda
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <AssetStatistics 
          statistics={statistics} 
          isLoading={isLoading}
          isMobile={isMobile}
        />

        {/* Assets List */}
        <Card className="border-orange-200 bg-white">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <CardTitle className="text-lg">Daftar Aset</CardTitle>
              <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-white text-orange-600 hover:bg-gray-100 w-full sm:w-auto text-sm py-2 px-3"
                    onClick={handleAddNew}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Aset
                  </Button>
                </DialogTrigger>
                <DialogContent className={`${isMobile ? 'w-[95vw] max-w-sm h-[90vh]' : 'w-[95vw] max-w-md max-h-[90vh]'}`}>
                  <DialogHeader>
                    <DialogTitle className="text-orange-600">
                      {editingAsset ? 'Edit Aset' : 'Tambah Aset Baru'}
                    </DialogTitle>
                  </DialogHeader>
                  <AssetForm
                    formData={formData}
                    errors={formErrors}
                    onFieldChange={updateField}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormClose}
                    isSubmitting={isMutating}
                    canSubmit={canSubmit}
                    mode={editingAsset ? 'edit' : 'create'}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Mobile View */}
            {isMobile ? (
              <div className="space-y-4">
                {assets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                    isDeleting={isMutating}
                  />
                ))}
                {assets.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-base">Belum ada aset yang terdaftar</p>
                    <p className="text-sm mt-1">Klik tombol "Tambah Aset" untuk memulai</p>
                  </div>
                )}
              </div>
            ) : (
              /* Desktop View */
              <AssetTable
                assets={assets}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
                onAddNew={handleAddNew}
                isLoading={isLoading}
                isDeleting={isMutating}
              />
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AssetDeleteDialog
          isOpen={!!deleteAsset}
          assetName={deleteAsset?.name || ''}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteAsset(null)}
          isDeleting={isMutating}
        />
      </div>
    </div>
  );
};