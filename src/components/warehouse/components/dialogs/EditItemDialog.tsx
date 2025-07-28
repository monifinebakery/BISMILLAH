// src/components/warehouse/components/dialogs/EditItemDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Edit3,
  Loader2,
  Package,
  Tag,
  Hash,
  Scale,
  DollarSign,
  User,
  Calendar,
  AlertCircle,
  History,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { BahanBaku } from '../../types/warehouse';
import { validateBahanBakuData } from '../../context/utils/transformers';
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/formatters';
import { cn } from '@/lib/utils';

interface EditItemDialogProps {
  item: BahanBaku;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<BahanBaku>) => Promise<void>;
  existingCategories?: string[];
  existingSuppliers?: string[];
}

interface FormData {
  nama: string;
  kategori: string;
  stok: string;
  satuan: string;
  minimum: string;
  hargaSatuan: string;
  supplier: string;
  tanggalKadaluwarsa: string;
  jumlahBeliKemasan: string;
  satuanKemasan: string;
  hargaTotalBeliKemasan: string;
}

const EditItemDialog: React.FC<EditItemDialogProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
  existingCategories = [],
  existingSuppliers = [],
}) => {
  const [formData, setFormData] = useState<FormData>({} as FormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<FormData>({} as FormData);

  // Initialize form data from item
  useEffect(() => {
    if (isOpen && item) {
      const initialData: FormData = {
        nama: item.nama || '',
        kategori: item.kategori || '',
        stok: item.stok?.toString() || '0',
        satuan: item.satuan || '',
        minimum: item.minimum?.toString() || '0',
        hargaSatuan: item.hargaSatuan?.toString() || '0',
        supplier: item.supplier || '',
        tanggalKadaluwarsa: item.tanggalKadaluwarsa 
          ? new Date(item.tanggalKadaluwarsa).toISOString().split('T')[0] 
          : '',
        jumlahBeliKemasan: item.jumlahBeliKemasan?.toString() || '0',
        satuanKemasan: item.satuanKemasan || '',
        hargaTotalBeliKemasan: item.hargaTotalBeliKemasan?.toString() || '0',
      };
      
      setFormData(initialData);
      setOriginalData(initialData);
      setValidationErrors([]);
      setHasChanges(false);
    }
  }, [isOpen, item]);

  // Check for changes
  useEffect(() => {
    const changes = Object.keys(formData).some(
      key => formData[key as keyof FormData] !== originalData[key as keyof FormData]
    );
    setHasChanges(changes);
  }, [formData, originalData]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const validateForm = (): boolean => {
    const bahanData = {
      nama: formData.nama,
      kategori: formData.kategori,
      stok: parseFloat(formData.stok) || 0,
      satuan: formData.satuan,
      minimum: parseFloat(formData.minimum) || 0,
      hargaSatuan: parseFloat(formData.hargaSatuan) || 0,
      supplier: formData.supplier,
      tanggalKadaluwarsa: formData.tanggalKadaluwarsa ? new Date(formData.tanggalKadaluwarsa) : null,
      jumlahBeliKemasan: parseFloat(formData.jumlahBeliKemasan) || 0,
      satuanKemasan: formData.satuanKemasan,
      hargaTotalBeliKemasan: parseFloat(formData.hargaTotalBeliKemasan) || 0,
    };

    const validation = validateBahanBakuData(bahanData);
    setValidationErrors(validation.errors);
    
    return validation.isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!hasChanges) {
      toast.info('Tidak ada perubahan untuk disimpan');
      return;
    }

    setIsSubmitting(true);

    try {
      const updates: Partial<BahanBaku> = {};

      // Only include changed fields
      if (formData.nama !== originalData.nama) updates.nama = formData.nama.trim();
      if (formData.kategori !== originalData.kategori) updates.kategori = formData.kategori;
      if (formData.stok !== originalData.stok) updates.stok = parseFloat(formData.stok) || 0;
      if (formData.satuan !== originalData.satuan) updates.satuan = formData.satuan;
      if (formData.minimum !== originalData.minimum) updates.minimum = parseFloat(formData.minimum) || 0;
      if (formData.hargaSatuan !== originalData.hargaSatuan) updates.hargaSatuan = parseFloat(formData.hargaSatuan) || 0;
      if (formData.supplier !== originalData.supplier) updates.supplier = formData.supplier.trim();
      if (formData.tanggalKadaluwarsa !== originalData.tanggalKadaluwarsa) {
        updates.tanggalKadaluwarsa = formData.tanggalKadaluwarsa ? new Date(formData.tanggalKadaluwarsa) : null;
      }
      if (formData.jumlahBeliKemasan !== originalData.jumlahBeliKemasan) {
        updates.jumlahBeliKemasan = parseFloat(formData.jumlahBeliKemasan) || 0;
      }
      if (formData.satuanKemasan !== originalData.satuanKemasan) updates.satuanKemasan = formData.satuanKemasan;
      if (formData.hargaTotalBeliKemasan !== originalData.hargaTotalBeliKemasan) {
        updates.hargaTotalBeliKemasan = parseFloat(formData.hargaTotalBeliKemasan) || 0;
      }

      await onSave(updates);
      onClose();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Terjadi kesalahan saat menyimpan perubahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(originalData);
    setValidationErrors([]);
  };

  const calculateHargaSatuan = () => {
    const totalHarga = parseFloat(formData.hargaTotalBeliKemasan) || 0;
    const jumlahKemasan = parseFloat(formData.jumlahBeliKemasan) || 0;
    
    if (totalHarga > 0 && jumlahKemasan > 0) {
      const hargaSatuan = totalHarga / jumlahKemasan;
      setFormData(prev => ({ ...prev, hargaSatuan: hargaSatuan.toFixed(2) }));
    }
  };

  // Calculate stock changes
  const stockChange = parseFloat(formData.stok) - item.stok;
  const priceChange = parseFloat(formData.hargaSatuan) - item.hargaSatuan;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-orange-500" />
            Edit Bahan Baku
          </DialogTitle>
          <DialogDescription>
            Ubah informasi untuk "{item.nama}". Hanya field yang diubah akan disimpan.
          </DialogDescription>
        </DialogHeader>

        {/* Item Status */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-4">
          <Package className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-gray-700">
            Dibuat: {formatRelativeTime(item.createdAt)}
          </span>
          {item.updatedAt && item.updatedAt > item.createdAt && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-700">
                Diubah: {formatRelativeTime(item.updatedAt)}
              </span>
            </>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-900">Error Validasi</span>
            </div>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Changes Indicator */}
        {hasChanges && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">
                  Ada perubahan yang belum disimpan
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="text-orange-600 hover:text-orange-700"
              >
                Reset
              </Button>
            </div>
          </div>
        )}

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Informasi Dasar</TabsTrigger>
            <TabsTrigger value="pricing">Harga & Supplier</TabsTrigger>
            <TabsTrigger value="advanced">Lanjutan</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama */}
              <div className="sm:col-span-2">
                <Label htmlFor="nama" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Nama Bahan Baku *
                </Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => handleInputChange('nama', e.target.value)}
                  className={cn("mt-1", formData.nama !== originalData.nama && "ring-2 ring-orange-200")}
                />
              </div>

              {/* Kategori */}
              <div>
                <Label htmlFor="kategori" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Kategori *
                </Label>
                <Select
                  value={formData.kategori}
                  onValueChange={(value) => handleInputChange('kategori', value)}
                >
                  <SelectTrigger className={cn("mt-1", formData.kategori !== originalData.kategori && "ring-2 ring-orange-200")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {existingCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Satuan */}
              <div>
                <Label htmlFor="satuan" className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Satuan *
                </Label>
                <Input
                  id="satuan"
                  value={formData.satuan}
                  onChange={(e) => handleInputChange('satuan', e.target.value)}
                  className={cn("mt-1", formData.satuan !== originalData.satuan && "ring-2 ring-orange-200")}
                />
              </div>

              {/* Stok */}
              <div>
                <Label htmlFor="stok" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Stok Saat Ini *
                  {stockChange !== 0 && (
                    <Badge variant={stockChange > 0 ? "default" : "destructive"} className="text-xs">
                      {stockChange > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {stockChange > 0 ? '+' : ''}{stockChange}
                    </Badge>
                  )}
                </Label>
                <Input
                  id="stok"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.stok}
                  onChange={(e) => handleInputChange('stok', e.target.value)}
                  className={cn("mt-1", formData.stok !== originalData.stok && "ring-2 ring-orange-200")}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Stok sebelumnya: {item.stok} {item.satuan}
                </div>
              </div>

              {/* Minimum Stok */}
              <div>
                <Label htmlFor="minimum" className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Minimum Stok *
                </Label>
                <Input
                  id="minimum"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minimum}
                  onChange={(e) => handleInputChange('minimum', e.target.value)}
                  className={cn("mt-1", formData.minimum !== originalData.minimum && "ring-2 ring-orange-200")}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Minimum sebelumnya: {item.minimum} {item.satuan}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Pricing & Supplier Tab */}
          <TabsContent value="pricing" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Harga Satuan */}
              <div>
                <Label htmlFor="hargaSatuan" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Harga per Satuan
                  {priceChange !== 0 && (
                    <Badge variant={priceChange > 0 ? "destructive" : "default"} className="text-xs">
                      {priceChange > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {formatCurrency(Math.abs(priceChange))}
                    </Badge>
                  )}
                </Label>
                <Input
                  id="hargaSatuan"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hargaSatuan}
                  onChange={(e) => handleInputChange('hargaSatuan', e.target.value)}
                  className={cn("mt-1", formData.hargaSatuan !== originalData.hargaSatuan && "ring-2 ring-orange-200")}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Harga sebelumnya: {formatCurrency(item.hargaSatuan)}
                </div>
              </div>

              {/* Supplier */}
              <div>
                <Label htmlFor="supplier" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Supplier
                </Label>
                <Select
                  value={formData.supplier}
                  onValueChange={(value) => handleInputChange('supplier', value)}
                >
                  <SelectTrigger className={cn("mt-1", formData.supplier !== originalData.supplier && "ring-2 ring-orange-200")}>
                    <SelectValue placeholder="Pilih supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingSuppliers.map((supplier) => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={formData.supplier}
                  onChange={(e) => handleInputChange('supplier', e.target.value)}
                  placeholder="Atau ketik nama supplier"
                  className="mt-2"
                />
              </div>

              {/* Tanggal Kadaluwarsa */}
              <div className="sm:col-span-2">
                <Label htmlFor="tanggalKadaluwarsa" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Tanggal Kadaluwarsa
                </Label>
                <Input
                  id="tanggalKadaluwarsa"
                  type="date"
                  value={formData.tanggalKadaluwarsa}
                  onChange={(e) => handleInputChange('tanggalKadaluwarsa', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={cn("mt-1", formData.tanggalKadaluwarsa !== originalData.tanggalKadaluwarsa && "ring-2 ring-orange-200")}
                />
                {item.tanggalKadaluwarsa && (
                  <div className="text-xs text-gray-500 mt-1">
                    Tanggal sebelumnya: {formatDate(item.tanggalKadaluwarsa)}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Jumlah Beli Kemasan */}
              <div>
                <Label htmlFor="jumlahBeliKemasan" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Jumlah Beli (Kemasan)
                </Label>
                <Input
                  id="jumlahBeliKemasan"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.jumlahBeliKemasan}
                  onChange={(e) => handleInputChange('jumlahBeliKemasan', e.target.value)}
                  className={cn("mt-1", formData.jumlahBeliKemasan !== originalData.jumlahBeliKemasan && "ring-2 ring-orange-200")}
                />
              </div>

              {/* Satuan Kemasan */}
              <div>
                <Label htmlFor="satuanKemasan">Satuan Kemasan</Label>
                <Input
                  id="satuanKemasan"
                  value={formData.satuanKemasan}
                  onChange={(e) => handleInputChange('satuanKemasan', e.target.value)}
                  className={cn("mt-1", formData.satuanKemasan !== originalData.satuanKemasan && "ring-2 ring-orange-200")}
                />
              </div>

              {/* Harga Total Beli Kemasan */}
              <div className="sm:col-span-2">
                <Label htmlFor="hargaTotalBeliKemasan">Harga Total Beli (Kemasan)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="hargaTotalBeliKemasan"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hargaTotalBeliKemasan}
                    onChange={(e) => handleInputChange('hargaTotalBeliKemasan', e.target.value)}
                    className={cn(formData.hargaTotalBeliKemasan !== originalData.hargaTotalBeliKemasan && "ring-2 ring-orange-200")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={calculateHargaSatuan}
                    disabled={!formData.hargaTotalBeliKemasan || !formData.jumlahBeliKemasan}
                  >
                    Auto Hitung
                  </Button>
                </div>
              </div>
            </div>

            {/* Current Values Display */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <History className="h-4 w-4" />
                Nilai Saat Ini
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Value:</span>
                  <p className="font-medium">{formatCurrency(item.stok * item.hargaSatuan)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <p className="font-medium">{formatRelativeTime(item.updatedAt)}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          
          {hasChanges && (
            <Button
              variant="outline"
              onClick={resetForm}
              disabled={isSubmitting}
            >
              Reset
            </Button>
          )}
          
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !hasChanges}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4 mr-2" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditItemDialog;