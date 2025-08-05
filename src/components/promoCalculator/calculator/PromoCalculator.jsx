// src/pages/PromoCalculator.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; // ✅ Gunakan React Router
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  ArrowLeft, 
  Eye, 
  Edit, 
  Trash2 
} from 'lucide-react';
import PromoCard from '@/components/promoCalculator/components/PromoCard'; // ✅ Sesuaikan path
import PromoEditDialog from '@/components/promoCalculator/dialogs/PromoEditDialog'; // ✅ Sesuaikan path
import { promoService } from '@/components/promoCalculator/services/promoService'; // ✅ Sesuaikan path
import { LoadingState } from '@/components/recipe/components/shared/LoadingState'; // ✅ Sesuaikan path

// ✅ Query Keys
const PROMO_QUERY_KEYS = {
  all: ['promos'],
  lists: () => [...PROMO_QUERY_KEYS.all, 'list'],
  list: (params) => [...PROMO_QUERY_KEYS.lists(), params],
  detail: (id) => [...PROMO_QUERY_KEYS.all, 'detail', id],
};

const PromoCalculator = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // ✅ Cek mode edit dari URL
  const editId = searchParams.get('edit');

  // ✅ State untuk promo calculator itu sendiri (jika ada form kalkulasi)
  // Untuk contoh ini, kita fokus pada daftar promo terbaru
  const [latestPromos, setLatestPromos] = useState([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  // ✅ useQuery: Fetch 3 Promo Terbaru
  const latestPromosQuery = useQuery({
    queryKey: PROMO_QUERY_KEYS.list({ limit: 3 }), // Parameter khusus untuk limit
    queryFn: async () => {
      // Modifikasi promoService.getAll untuk menerima limit jika perlu
      // Untuk sementara, kita fetch semua dan slice di frontend
      const allPromos = await promoService.getAll({});
      return (allPromos || []).slice(0, 3);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });

  // ✅ useMutation: Delete Promo (untuk aksi di card)
  const deletePromoMutation = useMutation({
    mutationFn: async (id) => {
      await promoService.delete(id);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.all });
      toast.success('Promo berhasil dihapus');
    },
    onError: (error) => {
      console.error('Delete promo error (Calculator):', error);
      toast.error(error.message || 'Gagal menghapus promo');
    },
  });

  // ✅ useMutation: Toggle Promo Status (untuk aksi di card)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }) => {
      const updatedPromo = await promoService.toggleStatus({ id, newStatus });
      return updatedPromo;
    },
    onSuccess: (updatedPromo) => {
      queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.all });
      toast.success(`Promo berhasil ${updatedPromo.status === 'aktif' ? 'diaktifkan' : 'dinonaktifkan'}`);
    },
    onError: (error) => {
      console.error('Toggle status error (Calculator):', error);
      toast.error(error.message || 'Gagal mengubah status promo');
    },
  });

  // ✅ Sinkronisasi data terbaru
  useEffect(() => {
    if (latestPromosQuery.data) {
      setLatestPromos(latestPromosQuery.data);
    }
  }, [latestPromosQuery.data]);

  const handleRefresh = () => {
    latestPromosQuery.refetch();
    if (isEditDialogOpen) {
      setIsEditDialogOpen(false);
      setEditingPromo(null);
    }
  };

  const handleCreateNew = () => {
    // Arahkan ke halaman kalkulator promo penuh (jika berbeda) atau halaman baru
    // Misalnya, jika ini adalah halaman ringkas, arahkan ke halaman penuh
    navigate('/promo/full-calculator'); // Sesuaikan dengan route Anda
    // Atau jika ini adalah halaman utama kalkulator:
    // window.location.href = '/promo/create'; 
  };

  const handleViewAll = () => {
    navigate('/promo/list'); // Arahkan ke halaman daftar promo
  };

  // ✅ Handler untuk card actions
  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus promo ini?')) {
      await deletePromoMutation.mutateAsync(id);
    }
  };

  const handleToggleStatus = async (id, newStatus) => {
    await toggleStatusMutation.mutateAsync({ id, newStatus });
  };

  const handleView = (promo) => {
    toast.info(`Melihat detail promo: ${promo.namaPromo}`);
    // Implementasi detail view jika diperlukan, misalnya modal atau halaman baru
    // navigate(`/promo/${promo.id}`);
  };

  const handleEditSuccess = (updatedPromo) => {
    console.log('Promo updated in calculator:', updatedPromo.id);
    // Optional: Refresh data lokal jika perlu
  };

  // ✅ Loading & Error State
  if (latestPromosQuery.isLoading && latestPromos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4 sm:p-6">
        <LoadingState />
      </div>
    );
  }

  if (latestPromosQuery.error && latestPromos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Gagal Memuat Promo Terbaru
            </h2>
            <p className="text-gray-600 mb-4">
              {latestPromosQuery.error.message || 'Terjadi kesalahan saat memuat data promo terbaru'}
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleRefresh}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kalkulator Promo</h1>
            <p className="text-gray-600 mt-1">
              Hitung dan kelola promo Anda
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={latestPromosQuery.isFetching}
              className="border-gray-300"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${latestPromosQuery.isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleCreateNew}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Promo Baru
            </Button>
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Promo Terbaru</span>
              <Button variant="link" onClick={handleViewAll} className="text-orange-600 hover:text-orange-700 p-0 h-auto">
                Lihat Semua Promo
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestPromos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestPromos.map(promo => (
                  <PromoCard
                    key={promo.id}
                    promo={promo}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                    onToggleStatus={handleToggleStatus}
                    showActions={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">🎯</div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Belum Ada Promo</h3>
                <p className="text-gray-500 mb-4">Buat promo pertama Anda untuk melihatnya di sini.</p>
                <Button onClick={handleCreateNew} className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Promo Pertama
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ✅ Promo Edit Dialog */}
      <PromoEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingPromo(null);
        }}
        promo={editingPromo}
        onEditSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default PromoCalculator;