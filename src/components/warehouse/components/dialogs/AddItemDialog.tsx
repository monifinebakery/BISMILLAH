// src/components/warehouse/components/dialogs/AddItemDialog.tsx
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus,
  Loader2,
  Package,
  Tag,
  Hash,
  Scale,
  DollarSign,
  User,
  Calendar,
  AlertCircle,
  Info,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';
import { BahanBaku } from '../../types/warehouse';
import { validateBahanBakuData } from '../../context/utils/transformers';
import { cn } from '@/lib/utils';

// Default categories and units
const DEFAULT_CATEGORIES = [
  'Bahan Pokok',
  'Bumbu & Rempah',
  'Protein',
  'Sayuran',
  'Buah-buahan',
  'Dairy & Telur',
  'Minyak & Lemak',
  'Karbohidrat',
  'Bahan Pengawet',
  'Kemasan',
  'Lainnya',
];

const DEFAULT_UNITS = [
  'kg', 'gram', 'liter', 'ml', 'pcs', 'pack', 'box', 'karton',
  'botol', 'kaleng', 'sachet', 'lembar', 'meter', 'roll',
];

interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
  initialData?: Partial<BahanBaku>;
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
  notes?: string;
}

const initialFormData: FormData = {
  nama: '',
  kategori: '',
  stok: '',
  satuan: '',
  minimum: '',
  hargaSatuan: '',
  supplier: '',
  tanggalKadaluwarsa: '',
  jumlahBeliKemasan: '',
  satuanKemasan: '',
  hargaTotalBeliKemasan: '',
  notes: '',
};

const AddItemDialog: React.FC<AddItemDialogProps> = ({
  isOpen,
  onClose,
  onAdd,
  initialData,
  existingCategories = [],
  existingSuppliers = [],
}) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Combine existing with defaults
  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories])).sort();
  const allUnits = Array.from(new Set([...DEFAULT_UNITS])).sort();
  const allSuppliers = Array.from(new Set(existingSuppliers)).sort();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          nama: initialData.nama || '',
          kategori: initialData.kategori || '',
          stok: initialData.stok?.toString() || '',
          satuan: initialData.satuan || '',
          minimum: initialData.minimum?.toString() || '',
          hargaSatuan: initialData.hargaSatuan?.toString() || '',
          supplier: initialData.supplier || '',
          tanggalKadaluwarsa: initialData.tanggalKadaluwarsa 
            ? new Date(initialData.tanggalKadaluwarsa).toISOString().split('T')[0] 
            : '',
          jumlahBeliKemasan: initialData.jumlahBeliKemasan?.toString() || '',
          satuanKemasan: initialData.satuanKemasan || '',
          hargaTotalBeliKemasan: initialData.hargaTotalBeliKemasan?.toString() || '',
          notes: '',
        });
      } else {
        setFormData(initialFormData);
      }
      setCurrentStep(1);
      setShowAdvanced(false);
      setValidationErrors([]);
    }
  }, [isOpen, initialData]);

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
      setCurrentStep(1); // Go back to first step if validation fails
      return;
    }

    setIsSubmitting(true);

    try {
      const bahanData = {
        nama: formData.nama.trim(),
        kategori: formData.kategori,
        stok: parseFloat(formData.stok) || 0,
        satuan: formData.satuan,
        minimum: parseFloat(formData.minimum) || 0,
        hargaSatuan: parseFloat(formData.hargaSatuan) || 0,
        supplier: formData.supplier.trim(),
        tanggalKadaluwarsa: formData.tanggalKadaluwarsa ? new Date(formData.tanggalKadaluwarsa) : null,
        jumlahBeliKemasan: parseFloat(formData.jumlahBeliKemasan) || 0,
        satuanKemasan: formData.satuanKemasan,
        hargaTotalBeliKemasan: parseFloat(formData.hargaTotalBeliKemasan) || 0,
      };

      const success = await onAdd(bahanData);
      
      if (success) {
        onClose();
        toast.success(`${bahanData.nama} berhasil ditambahkan!`);
      }
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Terjadi kesalahan saat menambahkan item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate basic info before proceeding
      const basicValidation = formData.nama && formData.kategori && formData.satuan && formData.stok;
      if (!basicValidation) {
        toast.error('Mohon isi semua field yang wajib');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const calculateHargaSatuan = () => {
    const totalHarga = parseFloat(formData.hargaTotalBeliKemasan) || 0;
    const jumlahKemasan = parseFloat(formData.jumlahBeliKemasan) || 0;
    
    if (totalHarga > 0 && jumlahKemasan > 0) {
      const hargaSatuan = totalHarga / jumlahKemasan;
      setFormData(prev => ({ ...prev, hargaSatuan: hargaSatuan.toFixed(2) }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-orange-500" />
            Tambah Bahan Baku Baru
          </DialogTitle>
          <DialogDescription>
            Tambahkan item baru ke inventory gudang Anda. Step {currentStep} dari 3.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                step <= currentStep 
                  ? "bg-orange-500 text-white" 
                  : "bg-gray-200 text-gray-600"
              )}>
                {step}
              </div>
              {step < 3 && (
                <div className={cn(
                  "w-12 h-0.5 mx-2",
                  step < currentStep ? "bg-orange-500" : "bg-gray-200"
                )} />
              )}
            </div>
          ))}
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

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
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
                  placeholder="Contoh: Tepung Terigu Premium"
                  className="mt-1"
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
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((category) => (
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
                <Select
                  value={formData.satuan}
                  onValueChange={(value) => handleInputChange('satuan', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih satuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {allUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stok */}
              <div>
                <Label htmlFor="stok" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Stok Awal *
                </Label>
                <Input
                  id="stok"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.stok}
                  onChange={(e) => handleInputChange('stok', e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
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
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pricing & Supplier */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Harga Satuan */}
              <div>
                <Label htmlFor="hargaSatuan" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Harga per Satuan
                </Label>
                <Input
                  id="hargaSatuan"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hargaSatuan}
                  onChange={(e) => handleInputChange('hargaSatuan', e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
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
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih atau ketik supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {allSuppliers.map((supplier) => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={formData.supplier}
                  onChange={(e) => handleInputChange('supplier', e.target.value)}
                  placeholder="Atau ketik nama supplier baru"
                  className="mt-2"
                />
              </div>

              {/* Tanggal Kadaluwarsa */}
              <div className="sm:col-span-2">
                <Label htmlFor="tanggalKadaluwarsa" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Tanggal Kadaluwarsa (Opsional)
                </Label>
                <Input
                  id="tanggalKadaluwarsa"
                  type="date"
                  value={formData.tanggalKadaluwarsa}
                  onChange={(e) => handleInputChange('tanggalKadaluwarsa', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Advanced Options */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-600">
                Informasi tambahan untuk tracking pembelian dalam kemasan
              </span>
            </div>

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
                  placeholder="0"
                  className="mt-1"
                />
              </div>

              {/* Satuan Kemasan */}
              <div>
                <Label htmlFor="satuanKemasan">Satuan Kemasan</Label>
                <Input
                  id="satuanKemasan"
                  value={formData.satuanKemasan}
                  onChange={(e) => handleInputChange('satuanKemasan', e.target.value)}
                  placeholder="Contoh: karton, dus, ball"
                  className="mt-1"
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
                    placeholder="0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={calculateHargaSatuan}
                    disabled={!formData.hargaTotalBeliKemasan || !formData.jumlahBeliKemasan}
                  >
                    Hitung Harga Satuan
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={isSubmitting}
            >
              Sebelumnya
            </Button>
          )}
          
          {currentStep < 3 ? (
            <Button onClick={nextStep} disabled={isSubmitting}>
              Selanjutnya
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menambahkan...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Item
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemDialog;