// src/components/operational-costs/OperationalCostCreatePage.tsx

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingState from './components/LoadingState';
import CostForm from './components/CostForm';
import { OperationalCostProvider, useOperationalCost } from './context';
import type { CostFormData } from './types';
import { ArrowLeft, Home, Notebook, PlusCircle } from 'lucide-react';

const OperationalCostCreateContent: React.FC = () => {
  const navigate = useNavigate();
  const { state, actions } = useOperationalCost();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSubmit = async (data: CostFormData): Promise<boolean> => {
    if (isSubmitting) {
      return false;
    }

    setIsSubmitting(true);
    try {
      const success = await actions.createCost({
        ...data,
        status: data.status || 'aktif',
      });

      if (success) {
        toast.success('Biaya operasional berhasil disimpan', {
          description: 'Biaya baru telah ditambahkan ke daftar operasional.',
        });

        try {
          await actions.refreshData();
        } catch (refreshError) {
          console.error('Gagal menyegarkan data biaya operasional:', refreshError);
        }

        navigate('/biaya-operasional');
        return true;
      }

      toast.error('Gagal menyimpan biaya operasional');
      return false;
    } catch (error) {
      console.error('Error creating operational cost:', error);
      toast.error('Terjadi kesalahan saat menyimpan biaya operasional');
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const handleCancel = () => {
    navigate('/biaya-operasional');
  };

  if (state.loading.auth) {
    return <LoadingState />;
  }

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="h-12 w-12 text-red-500 mx-auto mb-4 text-4xl">🔒</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Akses Terbatas</h2>
          <p className="text-gray-600 mb-4">
            Anda perlu login untuk mengakses halaman ini.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Refresh Halaman
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
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
                  <Button variant="ghost" size="sm" onClick={() => navigate('/biaya-operasional')}>
                    <Notebook className="h-4 w-4" />
                    Biaya Operasional
                  </Button>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Tambah Biaya Operasional</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
              <div className="mt-3 sm:mt-0">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <PlusCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  Tambah Biaya Operasional
                </h1>
                <p className="text-gray-600 mt-2 text-sm sm:text-base max-w-2xl">
                  Catat biaya operasional baru agar perhitungan HPP dan laporan bisnis tetap akurat.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-lg shadow-orange-100/60">
          <CardHeader className="border-b border-gray-100 bg-white">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Informasi Biaya
            </CardTitle>
            <p className="mt-2 text-sm text-gray-500">
              Lengkapi detail biaya operasional per bulan berikut dengan jenis dan statusnya.
            </p>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <CostForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={isSubmitting}
              className="space-y-6"
            />
          </CardContent>
        </Card>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white shadow-sm border border-orange-100">
            <h3 className="font-semibold text-orange-700 flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Tips Pencatatan
            </h3>
            <ul className="mt-2 text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Gunakan nama biaya yang mudah dikenali seluruh tim.</li>
              <li>Masukkan tanggal biaya sesuai mulai berlaku untuk menjaga timeline laporan.</li>
              <li>Pilih jenis biaya yang tepat agar analitik HPP lebih akurat.</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white shadow-sm border border-blue-100">
            <h3 className="font-semibold text-blue-700 flex items-center gap-2">
              <Notebook className="h-4 w-4" />
              Kenapa penting?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Biaya operasional yang rapi akan membantu Anda menghitung profit, menentukan harga jual, dan
              mengambil keputusan investasi yang lebih tepat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const OperationalCostCreatePage: React.FC = () => {
  return (
    <OperationalCostProvider>
      <OperationalCostCreateContent />
    </OperationalCostProvider>
  );
};

export default OperationalCostCreatePage;
