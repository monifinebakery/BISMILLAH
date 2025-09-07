import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { AppUpdate } from './types';
import { UpdateForm } from './UpdateForm';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Settings,
  Users,
  TrendingUp,
  Calendar
} from 'lucide-react';

export const AdminUpdatesPage: React.FC = () => {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<AppUpdate | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [stats, setStats] = useState({
    totalUpdates: 0,
    activeUpdates: 0,
    totalViews: 0,
  });

  // ✅ SAFE: Check admin status with proper error handling
  const checkAdminStatus = useCallback(async () => {
    if (!user?.id) {
      setCheckingAdmin(false);
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('is_user_admin');
      
      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data || false);
      }
    } catch (error) {
      console.error('Error in admin check:', error);
      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  }, [user?.id]);

  // ✅ SAFE: Fetch updates with proper error handling
  const fetchUpdates = useCallback(async () => {
    if (!user?.id || !isAdmin) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('app_updates')
        .select(`
          id,
          title,
          description,
          version,
          release_date,
          is_active,
          priority,
          changelog,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching updates:', error);
        toast.error('Gagal memuat data pembaruan');
        return;
      }

      setUpdates(data || []);
      
      // ✅ SAFE: Calculate stats
      const total = data?.length || 0;
      const active = data?.filter(u => u.is_active).length || 0;
      
      setStats({
        totalUpdates: total,
        activeUpdates: active,
        totalViews: 0, // Placeholder, bisa diperbarui dengan view tracking nanti
      });
    } catch (error) {
      console.error('Error in fetchUpdates:', error);
      toast.error('Gagal memuat data pembaruan');
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAdmin]);

  // ✅ SAFE: Toggle update status
  const toggleUpdateStatus = useCallback(async (updateId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('app_updates')
        .update({ is_active: !currentStatus })
        .eq('id', updateId);

      if (error) {
        console.error('Error toggling update status:', error);
        toast.error('Gagal mengubah status pembaruan');
        return;
      }

      toast.success(`Pembaruan ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
      await fetchUpdates();
    } catch (error) {
      console.error('Error in toggleUpdateStatus:', error);
      toast.error('Gagal mengubah status pembaruan');
    }
  }, [fetchUpdates]);

  // ✅ SAFE: Delete update
  const deleteUpdate = useCallback(async (updateId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pembaruan ini?')) return;

    try {
      const { error } = await supabase
        .from('app_updates')
        .delete()
        .eq('id', updateId);

      if (error) {
        console.error('Error deleting update:', error);
        toast.error('Gagal menghapus pembaruan');
        return;
      }

      toast.success('Pembaruan berhasil dihapus');
      await fetchUpdates();
    } catch (error) {
      console.error('Error in deleteUpdate:', error);
      toast.error('Gagal menghapus pembaruan');
    }
  }, [fetchUpdates]);

  // ✅ SAFE: Format date
  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }, []);

  // ✅ SAFE: Get priority badge
  const getPriorityBadge = useCallback((priority: string) => {
    const configs = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      normal: 'bg-blue-100 text-blue-800 border-blue-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return configs[priority as keyof typeof configs] || configs.normal;
  }, []);

  // ✅ SAFE: Check admin status on mount
  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  // ✅ SAFE: Fetch updates when admin status is confirmed
  useEffect(() => {
    if (!checkingAdmin && isAdmin) {
      fetchUpdates();
    }
  }, [checkingAdmin, isAdmin, fetchUpdates]);

  // ✅ SAFE: Show loading while checking admin
  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memverifikasi akses admin...</p>
        </div>
      </div>
    );
  }

  // ✅ SAFE: Show access denied if not admin
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3 text-red-800">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-semibold">Akses Ditolak</h3>
              <p className="text-sm mt-1">Hanya admin yang dapat mengakses halaman ini.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ SAFE: Show loading while fetching data
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data pembaruan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin - Kelola Pembaruan</h1>
                <p className="text-gray-600 mt-1">Kelola pembaruan aplikasi dan notifikasi user</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setEditingUpdate(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" />
              Tambah Pembaruan
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Pembaruan</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalUpdates}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Eye className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-600 font-medium">Pembaruan Aktif</p>
                  <p className="text-2xl font-bold text-green-900">{stats.activeUpdates}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total Views</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.totalViews}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {showForm ? (
          <div className="mb-8">
            <UpdateForm
              onSuccess={() => {
                setShowForm(false);
                setEditingUpdate(null);
                fetchUpdates();
              }}
              onCancel={() => {
                setShowForm(false);
                setEditingUpdate(null);
              }}
              initialData={editingUpdate}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {updates.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Belum Ada Pembaruan
                </h3>
                <p className="text-gray-600 mb-4">
                  Mulai dengan membuat pembaruan aplikasi pertama
                </p>
                <button
                  onClick={() => {
                    setEditingUpdate(null);
                    setShowForm(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Buat Pembaruan
                </button>
              </div>
            ) : (
              updates.map((update) => (
                <div key={update.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{update.title}</h3>
                        <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded-full font-medium">
                          v{update.version}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium border ${getPriorityBadge(update.priority)}`}
                        >
                          {update.priority.toUpperCase()}
                        </span>
                        {update.is_active ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium border border-green-200">
                            AKTIF
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full font-medium border border-gray-200">
                            DRAFT
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-700 mb-4 line-clamp-3">{update.description}</p>
                      
                      <div className="text-sm text-gray-500">
                        <span>Dibuat: {formatDate(update.created_at)}</span>
                        {update.updated_at !== update.created_at && (
                          <span className="ml-4">• Diupdate: {formatDate(update.updated_at)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => toggleUpdateStatus(update.id, update.is_active)}
                        className={`p-2 rounded-lg transition-colors ${
                          update.is_active
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={update.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {update.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => {
                          setEditingUpdate(update);
                          setShowForm(true);
                        }}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => deleteUpdate(update.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};