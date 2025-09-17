// src/components/assets/AssetCreatePage.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAssetForm, useAssetMutations } from './hooks';
import { AssetFormFields } from './components';

const AssetCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: formData, errors, updateField, resetForm, validateForm } = useAssetForm({
    mode: 'create',
  });

  const { createAsset, isLoading: isSaving } = useAssetMutations({
    userId: user?.id || '',
    onSuccess: {
      onCreate: () => {
        resetForm();
        navigate('/aset');
      },
      onUpdate: () => {},
      onDelete: () => {},
    },
  });

  const handleSave = async () => {
    if (!validateForm()) return;
    await createAsset({
      nama: formData.nama,
      kategori: formData.kategori as any,
      nilaiAwal: formData.nilaiAwal as number,
      nilaiSaatIni: formData.nilaiSaatIni as number,
      tanggalPembelian: formData.tanggalPembelian!,
      kondisi: formData.kondisi as any,
      lokasi: formData.lokasi,
      deskripsi: formData.deskripsi || undefined,
      depresiasi:
        formData.depresiasi === null || formData.depresiasi === ''
          ? undefined
          : (formData.depresiasi as number),
    });
  };

  const handleCancel = () => {
    navigate('/aset');
  };

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="w-full max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full mr-4">
              <Plus className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Tambah Aset
              </h1>
              <p className="text-gray-600 text-sm">Isi detail aset baru Anda</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-orange-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Form Aset Baru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <AssetFormFields
              formData={formData}
              errors={errors}
              onFieldChange={updateField}
              disabled={isSaving}
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Batal
              </Button>
              <Button
                onClick={handleSave}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssetCreatePage;
