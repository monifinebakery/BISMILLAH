import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { AppUpdate, UpdateFormData, UpdatePriority } from './types';
import { Save, X, AlertTriangle, Info, Bell, Zap, Eye, EyeOff } from 'lucide-react';

interface UpdateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: AppUpdate; // Support for edit mode
}

export const UpdateForm: React.FC<UpdateFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [formData, setFormData] = useState<UpdateFormData>({
    version: initialData?.version || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'normal',
    is_active: initialData?.is_active ?? true,
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setCheckingAdmin(false);
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
    };

    checkAdminStatus();
  }, [user]);

  if (checkingAdmin) {
    return (
      <div className="max-w-md mx-auto p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <div>
            <h3 className="font-semibold">Memverifikasi Akses</h3>
            <p className="text-sm mt-1">Memeriksa izin admin...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-3 text-red-800">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">Akses Ditolak</h3>
            <p className="text-sm mt-1">Hanya admin yang dapat menambahkan pembaruan aplikasi.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: keyof UpdateFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.version.trim()) {
      toast.error('Versi harus diisi');
      return false;
    }
    if (!formData.title.trim()) {
      toast.error('Judul harus diisi');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Deskripsi harus diisi');
      return false;
    }

    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(formData.version)) {
      toast.error('Format versi harus seperti: 1.2.3');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (initialData) {
        // Mode edit
        const { error } = await supabase
          .from('app_updates')
          .update({
            version: formData.version.trim(),
            title: formData.title.trim(),
            description: formData.description.trim(),
            priority: formData.priority,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', initialData.id);

        if (error) throw error;
        toast.success('Pembaruan berhasil diperbarui!');
      } else {
        // Mode tambah
        const { data: existingUpdate } = await supabase
          .from('app_updates')
          .select('id')
          .eq('version', formData.version)
          .single();

        if (existingUpdate) {
          toast.error('Versi ini sudah ada. Gunakan versi yang berbeda.');
          setLoading(false);
          return;
        }

        const { error } = await supabase
          .from('app_updates')
          .insert({
            version: formData.version.trim(),
            title: formData.title.trim(),
            description: formData.description.trim(),
            priority: formData.priority,
            is_active: formData.is_active,
            release_date: new Date().toISOString(),
            created_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
        toast.success('Pembaruan berhasil ditambahkan!');
      }

      setFormData({
        version: '',
        title: '',
        description: '',
        priority: 'normal',
        is_active: true,
      });
      onSuccess?.();
    } catch (error: any) {
      console.error('Error adding/updating update:', error);
      toast.error(`Gagal ${initialData ? 'memperbarui' : 'menambahkan'} pembaruan: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority: UpdatePriority) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high': return <Zap className="w-4 h-4 text-orange-600" />;
      case 'normal': return <Bell className="w-4 h-4 text-blue-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityDescription = (priority: UpdatePriority) => {
    switch (priority) {
      case 'critical': return 'Pembaruan penting yang harus segera diketahui user';
      case 'high': return 'Pembaruan penting dengan fitur atau perbaikan signifikan';
      case 'normal': return 'Pembaruan standar dengan fitur atau perbaikan biasa';
      case 'low': return 'Pembaruan minor atau informasi tambahan';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {initialData ? 'Edit Pembaruan' : 'Tambah Pembaruan Baru'}
        </h2>
        <p className="text-gray-600">
          {initialData ? 'Ubah detail pembaruan yang ada' : 'Buat pengumuman pembaruan aplikasi yang akan dilihat oleh semua user'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Versi Aplikasi</label>
          <input
            type="text"
            placeholder="Contoh: 1.2.3"
            value={formData.version}
            onChange={(e) => handleInputChange('version', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Format: major.minor.patch (contoh: 1.2.3)</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Judul Pembaruan</label>
          <input
            type="text"
            placeholder="Contoh: Fitur Baru: Dashboard Analytics"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Prioritas Pembaruan</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['critical', 'high', 'normal', 'low'] as UpdatePriority[]).map((priority) => (
              <label
                key={priority}
                className={`relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.priority === priority
                    ? priority === 'critical'
                      ? 'border-red-500 bg-red-50'
                      : priority === 'high'
                      ? 'border-orange-500 bg-orange-50'
                      : priority === 'normal'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-500 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={priority}
                  checked={formData.priority === priority}
                  onChange={(e) => handleInputChange('priority', e.target.value as UpdatePriority)}
                  className="sr-only"
                />
                <div className="flex items-center gap-3">
                  {getPriorityIcon(priority)}
                  <div>
                    <div className="font-semibold capitalize text-gray-900">{priority}</div>
                    <div className="text-xs text-gray-600">{getPriorityDescription(priority)}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi Pembaruan</label>
          <textarea
            placeholder="Jelaskan secara detail tentang pembaruan ini. Apa yang baru, bug yang diperbaiki, atau fitur yang ditambahkan..."
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Gunakan bahasa yang mudah dipahami oleh user aplikasi</p>
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <button
            type="button"
            onClick={() => handleInputChange('is_active', !formData.is_active)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              formData.is_active
                ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
                : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            {formData.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {formData.is_active ? 'Aktif' : 'Draft'}
          </button>
          <p className="text-sm text-gray-600">
            {formData.is_active
              ? 'Pembaruan akan langsung terlihat oleh user'
              : 'Pembaruan disimpan sebagai draft'}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {initialData ? 'Memperbarui...' : 'Menyimpan...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {initialData ? 'Perbarui Pembaruan' : 'Publikasikan Pembaruan'}
              </>
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-colors"
            >
              <X className="w-4 h-4" />
              Batal
            </button>
          )}
        </div>
      </form>
    </div>
  );
};