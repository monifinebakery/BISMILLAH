// src/components/assets/AssetEditPage.tsx

import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Edit3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAssetForm, useAssetMutations } from './hooks';
import { AssetFormFields } from './components';
import { useAssetDetailQuery } from './index';

const AssetEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: asset, isLoading, isError } = useAssetDetailQuery(id, user?.id);

  const { data: formData, errors, updateField, resetForm, setFormData, validateForm } = useAssetForm({
    mode: 'edit',
    asset: asset,
  });

  useEffect(() => {
    if (asset) setFormData(asset);
  }, [asset, setFormData]);

  const { updateAsset, isLoading: isSaving } = useAssetMutations({
    userId: user?.id || '',
    onSuccess: {
      onCreate: () => {},
      onUpdate: () => {
        resetForm();
        navigate('/aset');
      },
      onDelete: () => {},
    },
  });

  const handleSave = async () => {
    if (!validateForm() || !id) return;
    await updateAsset(id, {
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

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-white p-4">
        <div className="space-y-6 max-w-5xl mx-auto">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3" />
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !asset) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-gray-700">Data aset tidak ditemukan</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate('/aset')}>Kembali</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="w-full max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full mr-4">
              <Edit3 className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Edit Aset
              </h1>
              <p className="text-gray-600 text-sm">Perbarui detail aset</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-orange-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Form Edit Aset</CardTitle>
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
                  'Update'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssetEditPage;
