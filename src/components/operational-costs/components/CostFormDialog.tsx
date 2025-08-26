// src/components/operational-costs/components/CostFormDialog.tsx

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Info, 
  Lightbulb, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles,
  Package,
  TrendingUp
} from 'lucide-react';
import { OperationalCost, CostFormData } from '../types';
import { useCostClassification } from '../hooks/useCostClassification';
import { getCostGroupLabel, getCostGroupDescription } from '../constants/costClassification';
import { formatCurrency } from '@/utils/formatUtils';
import { toast } from 'sonner';

interface CostFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CostFormData) => Promise<boolean>;
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
  const [formData, setFormData] = useState<CostFormData>({
    nama_biaya: '',
    jumlah_per_bulan: 0,
    jenis: 'tetap' as 'tetap' | 'variabel',
    group: 'operasional' as 'hpp' | 'operasional', // Default to operasional
    status: 'aktif' as 'aktif' | 'nonaktif',
    deskripsi: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showClassificationSuggestion, setShowClassificationSuggestion] = useState(false);

  // Classification hook
  const {
    suggestion,
    isClassifying,
    getSuggestionForCost,
    clearSuggestion,
    applySuggestion,
    getGroupLabel,
    getGroupDescription
  } = useCostClassification();

  // Initialize form when cost prop changes
  useEffect(() => {
    if (isOpen) {
      if (cost) {
        // Edit mode
        setFormData({
          nama_biaya: cost.nama_biaya,
          jumlah_per_bulan: cost.jumlah_per_bulan,
          jenis: cost.jenis as 'tetap' | 'variabel',
          group: cost.group || 'operasional', // Include group field
          status: cost.status as 'aktif' | 'nonaktif',
          deskripsi: cost.deskripsi || ''
        });
      } else {
        // Add mode
        setFormData({
          nama_biaya: '',
          jumlah_per_bulan: 0,
          jenis: 'tetap',
          group: 'operasional', // Default for new costs
          status: 'aktif',
          deskripsi: ''
        });
      }
      setErrors({});
      clearSuggestion();
      setShowClassificationSuggestion(false);
    }
  }, [cost, isOpen, clearSuggestion]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama_biaya.trim()) {
      newErrors.nama_biaya = 'Nama biaya harus diisi';
    } else if (formData.nama_biaya.trim().length < 3) {
      newErrors.nama_biaya = 'Nama biaya minimal 3 karakter';
    }

    if (formData.jumlah_per_bulan <= 0) {
      newErrors.jumlah_per_bulan = 'Jumlah harus lebih dari 0';
    } else if (formData.jumlah_per_bulan < 1000) {
      newErrors.jumlah_per_bulan = 'Jumlah biaya terlalu kecil. Minimal 1.000 untuk pencatatan yang akurat';
    }

    if (formData.jumlah_per_bulan > 999999999) {
      newErrors.jumlah_per_bulan = 'Jumlah terlalu besar';
    }

    if (!formData.group) {
      newErrors.group = 'Kelompok biaya harus dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const success = await onSave(formData); // Send complete formData including group

      if (success) {
        onClose();
        toast.success(
          cost ? 'Biaya berhasil diperbarui!' : 'Biaya berhasil ditambahkan!',
          {
            description: `${getGroupLabel(formData.group)} - ${formatCurrency(formData.jumlah_per_bulan)}/bulan`
          }
        );
      }
    } catch (error) {
      console.error('Error saving cost:', error);
      toast.error('Gagal menyimpan biaya');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Apply automatic classification suggestion
  const handleApplySuggestion = () => {
    const suggestedGroup = applySuggestion();
    if (suggestedGroup) {
      setFormData(prev => ({ ...prev, group: suggestedGroup }));
      setShowClassificationSuggestion(false);
    }
  };

  // Dismiss classification suggestion
  const handleDismissSuggestion = () => {
    setShowClassificationSuggestion(false);
    clearSuggestion();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {cost ? '✏️ Edit Biaya Operasional' : '➕ Tambah Biaya Operasional'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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

          {/* Kelompok Biaya (Dual-Mode) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Kelompok Biaya <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.group}
              onValueChange={(value: 'hpp' | 'operasional') => 
                setFormData(prev => ({ ...prev, group: value }))
              }
              disabled={isSubmitting}
            >
              <SelectTrigger className={errors.group ? 'border-red-500' : ''}>
                <SelectValue placeholder="Pilih kelompok biaya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hpp">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-600" />
                    <div className="flex flex-col">
                      <span className="font-medium">Overhead Pabrik (HPP)</span>
                      <span className="text-xs text-gray-500">Masuk ke harga pokok produksi</span>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="operasional">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <div className="flex flex-col">
                      <span className="font-medium">Biaya Operasional</span>
                      <span className="text-xs text-gray-500">Untuk analisis BEP, tidak masuk HPP</span>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.group && (
              <p className="text-sm text-red-600">{errors.group}</p>
            )}
            <p className="text-xs text-gray-500">
              Pilih apakah biaya ini masuk ke HPP atau hanya untuk operasional
            </p>
          </div>

          {/* Classification Suggestion */}
          {showClassificationSuggestion && suggestion && suggestion.suggested_group && (
            <Alert className="border-amber-200 bg-amber-50">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-amber-800 mb-1">
                      💡 Saran Klasifikasi Otomatis
                    </p>
                    <p className="text-amber-700 mb-2">
                      Berdasarkan nama "{formData.nama_biaya}", disarankan masuk kelompok:
                    </p>
                    <Badge 
                      className={`mb-2 ${
                        suggestion.suggested_group === 'hpp' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {getGroupLabel(suggestion.suggested_group)}
                    </Badge>
                    <p className="text-xs text-amber-600">
                      {suggestion.reason}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleApplySuggestion}
                      className="text-xs h-7"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Gunakan
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleDismissSuggestion}
                      className="text-xs h-7"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Deskripsi (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="deskripsi" className="text-sm font-medium">
              Deskripsi <span className="text-gray-400">(Opsional)</span>
            </Label>
            <Input
              id="deskripsi"
              type="text"
              placeholder="Tambahkan catatan atau keterangan..."
              value={formData.deskripsi || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              Keterangan tambahan untuk biaya ini
            </p>
          </div>

          {/* Info about dual-mode classification */}
          <div className="space-y-2">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-green-900 mb-1">Pemisahan Biaya Dual-Mode</p>
                  <p className="text-green-700 mb-2">
                    Sistem akan memisahkan biaya berdasarkan kelompok:
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3 text-purple-600" />
                      <span className="text-green-700"><strong>Overhead Pabrik (HPP):</strong> Masuk ke perhitungan harga pokok produksi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-blue-600" />
                      <span className="text-green-700"><strong>Biaya Operasional:</strong> Untuk analisis BEP dan pricing strategy</span>
                    </div>
                  </div>
                  {!cost && (
                    <p className="text-xs text-green-600 mt-2">
                      💡 Tip: Sistem akan memberikan saran klasifikasi otomatis berdasarkan nama biaya
                    </p>
                  )}
                </div>
              </div>
            </div>
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
