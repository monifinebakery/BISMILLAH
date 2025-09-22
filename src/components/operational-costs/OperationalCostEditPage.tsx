// src/components/operational-costs/OperationalCostEditPage.tsx

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import type { CostFormData, OperationalCost } from './types';
import { ArrowLeft, Home, Notebook, Edit3 } from 'lucide-react';

const OperationalCostEditContent: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { state, actions } = useOperationalCost();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cost, setCost] = useState<OperationalCost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadCost = async () => {
      if (!id) {
        navigate('/biaya-operasional');
        return;
      }

      try {
        // Find the cost in current state
        const foundCost = state.costs.find((c: OperationalCost) => c.id === id);

        if (!foundCost) {
          toast.error('Biaya operasional tidak ditemukan');
          navigate('/biaya-operasional');
          return;
        }

        setCost(foundCost);
      } catch (error) {
        console.error('Error loading cost:', error);
        toast.error('Gagal memuat data biaya operasional');
        navigate('/biaya-operasional');
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    if (state.costs.length > 0) {
      loadCost();
    }
  }, [id, state.costs, navigate]);

  const handleSubmit = async (data: CostFormData): Promise<boolean> => {
    if (isSubmitting || !cost) {
      return false;
    }

    setIsSubmitting(true);
    try {
      const success = await actions.updateCost(cost.id, {
        ...data,
        status: data.status || cost.status,
      });

      if (success) {
        toast.success('Biaya operasional berhasil diperbarui', {
          description: 'Perubahan telah disimpan ke sistem.',
        });

        try {
          await actions.refreshData();
        } catch (refreshError) {
          console.error('Gagal menyegarkan data biaya operasional:', refreshError);
        }

        navigate('/biaya-operasional');
        return true;
      }

      toast.error('Gagal memperbarui biaya operasional');
      return false;
    } catch (error) {
      console.error('Error updating operational cost:', error);
      toast.error('Terjadi kesalahan saat memperbarui biaya operasional');
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

  if (state.loading.auth || isLoading) {
    return <LoadingState />;
  }

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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

  if (!cost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="h-12 w-12 text-red-500 mx-auto mb-4 text-4xl">❌</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Data Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-4">
            Biaya operasional yang Anda cari tidak tersedia.
          </p>
          <Button onClick={() => navigate('/biaya-operasional')}>
            Kembali ke Daftar Biaya
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                <BreadcrumbPage>Edit Biaya Operasional</BreadcrumbPage>
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
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-blue-600" />
                  </div>
                  Edit Biaya Operasional
                </h1>
                <p className="text-gray-600 mt-2 text-sm sm:text-base max-w-2xl">
                  Perbarui informasi biaya operasional "{cost.nama_biaya}" agar data tetap akurat.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-lg shadow-blue-100/60">
          <CardHeader className="border-b border-gray-100 bg-white">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Informasi Biaya
            </CardTitle>
            <p className="mt-2 text-sm text-gray-500">
              Perbarui detail biaya operasional per bulan berikut dengan jenis dan statusnya.
            </p>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <CostForm
              initialData={cost}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={isSubmitting}
              className="space-y-6"
            />
          </CardContent>
        </Card>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white shadow-sm border border-blue-100">
            <h3 className="font-semibold text-blue-700 flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Tips Edit Biaya
            </h3>
            <ul className="mt-2 text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Pastikan perubahan jumlah biaya berdasarkan data terbaru.</li>
              <li>Update tanggal mulai berlaku jika ada perubahan kontrak.</li>
              <li>Periksa jenis biaya tetap akurat untuk analitik yang tepat.</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white shadow-sm border border-green-100">
            <h3 className="font-semibold text-green-700 flex items-center gap-2">
              <Notebook className="h-4 w-4" />
              Dampak Perubahan
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Perubahan biaya operasional akan langsung mempengaruhi perhitungan HPP, profit margin,
              dan semua laporan bisnis yang menggunakan data operasional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const OperationalCostEditPage: React.FC = () => {
  return (
    <OperationalCostProvider>
      <OperationalCostEditContent />
    </OperationalCostProvider>
  );
};

export default OperationalCostEditPage;
