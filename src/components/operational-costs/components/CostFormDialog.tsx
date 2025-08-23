// src/components/operational-costs/components/CostFormDialog.tsx

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OperationalCost } from '../types';

interface CostFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    nama_biaya: string;
    jumlah_per_bulan: number;
    jenis: 'tetap' | 'variabel';
    cost_category: string;
    status?: string;
  }) => Promise<boolean>;
  cost?: OperationalCost | null; // null for new cost, object for edit
  isLoading?: boolean;
}

export const CostFormDialog: React.FC<CostFormDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  cost = null,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    nama_biaya: '',
    jumlah_per_bulan: 0,
    jenis: 'tetap' as 'tetap' | 'variabel',
    cost_category: 'general'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when cost prop changes
  useEffect(() => {
    if (isOpen) {
      if (cost) {
        // Edit mode
        setFormData({
          nama_biaya: cost.nama_biaya,
          jumlah_per_bulan: cost.jumlah_per_bulan,
          jenis: cost.jenis as 'tetap' | 'variabel',
          cost_category: 'general'
        });
      } else {
        // Add mode
        setFormData({
          nama_biaya: '',
          jumlah_per_bulan: 0,
          jenis: 'tetap',
          cost_category: 'general'
        });
      }
      setErrors({});
    }
  }, [cost, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama_biaya.trim()) {
      newErrors.nama_biaya = 'Nama biaya harus diisi';
    }

    if (formData.jumlah_per_bulan <= 0) {
      newErrors.jumlah_per_bulan = 'Jumlah harus lebih dari 0';
    }

    if (formData.jumlah_per_bulan > 999999999) {
      newErrors.jumlah_per_bulan = 'Jumlah terlalu besar';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const success = await onSave({
        ...formData,
        status: 'aktif'
      });

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving cost:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {cost ? '✏️ Edit Biaya Operasional' : '➕ Tambah Biaya Operasional'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nama Biaya */}
          <div className="space-y-2">
            <Label htmlFor="nama_biaya" className="text-sm font-medium">
              Nama Biaya <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nama_biaya"
              type="text"
              placeholder="Contoh: Sewa, Listrik, Marketing..."
              value={formData.nama_biaya}
              onChange={(e) => setFormData(prev => ({ ...prev, nama_biaya: e.target.value }))}
              className={errors.nama_biaya ? 'border-red-500' : ''}
              disabled={isSubmitting}
              autoFocus
            />
            {errors.nama_biaya && (
              <p className="text-sm text-red-600">{errors.nama_biaya}</p>
            )}
          </div>

          {/* Jumlah per Bulan */}
          <div className="space-y-2">
            <Label htmlFor="jumlah_per_bulan" className="text-sm font-medium">
              Jumlah per Bulan <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                Rp
              </span>
              <Input
                id="jumlah_per_bulan"
                type="number"
                min="0"
                placeholder="0"
                value={formData.jumlah_per_bulan || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  jumlah_per_bulan: parseFloat(e.target.value) || 0 
                }))}
                className={`pl-8 ${errors.jumlah_per_bulan ? 'border-red-500' : ''}`}
                disabled={isSubmitting}
              />
            </div>
            {errors.jumlah_per_bulan && (
              <p className="text-sm text-red-600">{errors.jumlah_per_bulan}</p>
            )}
            <p className="text-xs text-gray-500">
              Masukkan jumlah biaya yang dikeluarkan per bulan
            </p>
          </div>

          {/* Jenis */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Jenis Biaya <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.jenis}
              onValueChange={(value: 'tetap' | 'variabel') => 
                setFormData(prev => ({ ...prev, jenis: value }))
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis biaya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tetap">
                  <div className="flex flex-col">
                    <span className="font-medium">Tetap</span>
                    <span className="text-xs text-gray-500">Biaya yang sama setiap bulan</span>
                  </div>
                </SelectItem>
                <SelectItem value="variabel">
                  <div className="flex flex-col">
                    <span className="font-medium">Variabel</span>
                    <span className="text-xs text-gray-500">Biaya yang berubah-ubah</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Kategori */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Kategori
            </Label>
            <Select
              value={formData.cost_category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, cost_category: value }))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">
                  <div className="flex flex-col">
                    <span className="font-medium">General</span>
                    <span className="text-xs text-gray-500">Biaya umum</span>
                  </div>
                </SelectItem>
                <SelectItem value="administrative">
                  <div className="flex flex-col">
                    <span className="font-medium">Administrative</span>
                    <span className="text-xs text-gray-500">Biaya administrasi</span>
                  </div>
                </SelectItem>
                <SelectItem value="selling">
                  <div className="flex flex-col">
                    <span className="font-medium">Selling</span>
                    <span className="text-xs text-gray-500">Biaya penjualan/marketing</span>
                  </div>
                </SelectItem>
                <SelectItem value="overhead">
                  <div className="flex flex-col">
                    <span className="font-medium">Overhead</span>
                    <span className="text-xs text-gray-500">Biaya overhead produksi</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full sm:w-auto order-1 sm:order-2 bg-orange-600 hover:bg-orange-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  {cost ? 'Menyimpan...' : 'Menambah...'}
                </>
              ) : (
                cost ? '💾 Simpan Perubahan' : '➕ Tambah Biaya'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
