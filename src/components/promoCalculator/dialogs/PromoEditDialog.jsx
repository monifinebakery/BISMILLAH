// src/components/promoCalculator/dialogs/PromoEditDialog.jsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { promoService } from '@/components/promoCalculator/services/promoService';

// ✅ Definisikan tipe data promo jika menggunakan TypeScript, atau abaikan jika JavaScript
// interface Promo {
//   id: string;
//   userId: string;
//   namaPromo: string;
//   tipePromo: 'bogo' | 'discount' | 'bundle';
//   status: 'aktif' | 'nonaktif' | 'draft';
//   dataPromo: any;
//   calculationResult: any;
//   tanggalMulai?: string;
//   tanggalSelesai?: string;
//   deskripsi?: string;
//   createdAt: string;
//   updatedAt: string;
// }

const PromoEditDialog = ({ isOpen, onClose, promo, onEditSuccess }) => {
  const queryClient = useQueryClient();

  // ✅ Inisialisasi useForm tanpa resolver Zod
  const {
    register,
    handleSubmit,
    reset,
    setValue, // Untuk mengatur nilai tanggal secara manual jika diperlukan
    formState: { errors, isSubmitting },
  } = useForm({
    // Mode validasi: 'onBlur', 'onChange', 'onSubmit', 'onTouched', 'all'
    mode: 'onBlur', 
    // Mode re-validasi setelah submit pertama gagal
    reValidateMode: 'onChange', 
    // Nilai default
    defaultValues: promo || {
      namaPromo: '',
      tipePromo: 'discount',
      status: 'draft',
      tanggalMulai: '', // String kosong untuk input date
      tanggalSelesai: '',
      deskripsi: '',
    },
  });

  // ✅ Reset form ketika promo berubah atau dialog dibuka
  useEffect(() => {
    if (isOpen && promo) {
      reset(promo);
    } else if (isOpen) {
      // Jika dialog dibuka tanpa promo (misalnya untuk create baru, walau tidak digunakan di sini)
      reset({
        namaPromo: '',
        tipePromo: 'discount',
        status: 'draft',
        tanggalMulai: '',
        tanggalSelesai: '',
        deskripsi: '',
      });
    }
  }, [isOpen, promo, reset]);

  // ✅ Fungsi validasi manual
  const validateForm = (data) => {
    const errors = {};
    if (!data.namaPromo || data.namaPromo.trim().length < 2) {
      errors.namaPromo = 'Nama promo harus minimal 2 karakter';
    }

    if (!data.tipePromo || !['bogo', 'discount', 'bundle'].includes(data.tipePromo)) {
      errors.tipePromo = 'Pilih tipe promo yang valid';
    }

    if (!data.status || !['aktif', 'nonaktif', 'draft'].includes(data.status)) {
      errors.status = 'Pilih status promo yang valid';
    }

    // Validasi tanggal opsional, tidak perlu dicek keberadaannya
    // Tapi bisa dicek format jika diinginkan

    return errors;
  };

  // ✅ Handler submit form
  const onSubmit = async (data) => {
    // Validasi manual sebelum submit
    const formErrors = validateForm(data);
    if (Object.keys(formErrors).length > 0) {
      // Jika ada error, set error ke form state
      Object.keys(formErrors).forEach((key) => {
        // setError(key, { type: 'manual', message: formErrors[key] });
        // Karena kita tidak menggunakan setError, kita bisa tampilkan toast untuk error umum
        // atau tampilkan error di bawah masing-masing field
        // Untuk kesederhanaan, kita tampilkan toast error umum jika ada error validasi
        toast.error(`Validasi gagal: ${formErrors[key]}`);
      });
      return; // Hentikan submit
    }

    try {
      // Pastikan ID promo ada
      if (!promo?.id) {
        toast.error('ID promo tidak ditemukan');
        return;
      }

      console.log('Updating promo with data:', data);
      
      // ✅ Panggil service untuk update promo
      const result = await promoService.update(promo.id, data);

      if (result.success) { // Asumsi apiService.update mengembalikan { success: true, data: ... } atau { success: false, error: '...' }
        toast.success('Promo berhasil diperbarui');
        
        // ✅ Invalidate cache React Query untuk memperbarui data di UI
        queryClient.invalidateQueries({ queryKey: ['promos'] }); // Sesuaikan dengan query key Anda
        
        // ✅ Panggil callback onEditSuccess jika ada
        if (onEditSuccess) {
          onEditSuccess(result.data); // Kirim data promo yang diperbarui
        }
        
        // ✅ Tutup dialog
        onClose();
      } else {
        toast.error(`Gagal memperbarui promo: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating promo:', error);
      toast.error(`Terjadi kesalahan: ${error.message || error}`);
    }
  };

  // ✅ Handler untuk error submit (jika ada error lain selain validasi)
  const onError = (errors) => {
    console.error('Form errors:', errors);
    toast.error('Silakan periksa kembali isian form.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edit Promo</h2>
        
        <form onSubmit={handleSubmit(onSubmit, onError)}>
          {/* Nama Promo */}
          <div className="mb-4">
            <Label htmlFor="namaPromo">Nama Promo</Label>
            <Input
              id="namaPromo"
              {...register('namaPromo', { 
                required: 'Nama promo wajib diisi',
                minLength: { value: 2, message: 'Nama promo harus minimal 2 karakter' }
              })}
              placeholder="Masukkan nama promo"
            />
            {errors.namaPromo && (
              <p className="text-red-500 text-sm mt-1">{errors.namaPromo.message}</p>
            )}
          </div>

          {/* Tipe Promo */}
          <div className="mb-4">
            <Label htmlFor="tipePromo">Tipe Promo</Label>
            <select
              id="tipePromo"
              {...register('tipePromo', { 
                required: 'Tipe promo wajib dipilih' 
              })}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Tipe Promo</option>
              <option value="bogo">Buy One Get One</option>
              <option value="discount">Diskon</option>
              <option value="bundle">Paket Bundle</option>
            </select>
            {errors.tipePromo && (
              <p className="text-red-500 text-sm mt-1">{errors.tipePromo.message}</p>
            )}
          </div>

          {/* Status Promo */}
          <div className="mb-4">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              {...register('status', { 
                required: 'Status promo wajib dipilih' 
              })}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
              <option value="draft">Draft</option>
            </select>
            {errors.status && (
              <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
            )}
          </div>

          {/* Tanggal Mulai */}
          <div className="mb-4">
            <Label htmlFor="tanggalMulai">Tanggal Mulai</Label>
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
              <input
                type="date"
                id="tanggalMulai"
                {...register('tanggalMulai')}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.tanggalMulai && (
              <p className="text-red-500 text-sm mt-1">{errors.tanggalMulai.message}</p>
            )}
          </div>

          {/* Tanggal Selesai */}
          <div className="mb-4">
            <Label htmlFor="tanggalSelesai">Tanggal Selesai</Label>
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
              <input
                type="date"
                id="tanggalSelesai"
                {...register('tanggalSelesai')}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.tanggalSelesai && (
              <p className="text-red-500 text-sm mt-1">{errors.tanggalSelesai.message}</p>
            )}
          </div>

          {/* Deskripsi */}
          <div className="mb-4">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <textarea
              id="deskripsi"
              {...register('deskripsi')}
              rows="3"
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tambahkan deskripsi promo (opsional)"
            />
            {errors.deskripsi && (
              <p className="text-red-500 text-sm mt-1">{errors.deskripsi.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromoEditDialog;