import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { BahanBaku } from '@/types/recipe';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";

interface BahanBakuEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<BahanBaku>) => Promise<void>;
  item: BahanBaku | null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const BahanBakuEditDialog = ({ isOpen, onClose, onSave, item }: BahanBakuEditDialogProps) => {
  const [formData, setFormData] = useState<Partial<BahanBaku>>({
    nama: '',
    kategori: '',
    stok: 0,
    satuan: '',
    minimum: 0,
    hargaSatuan: 0,
    supplier: '',
    tanggalKadaluwarsa: undefined,
    jumlahBeliKemasan: 0,
    satuanKemasan: '',
    hargaTotalBeliKemasan: 0,
  });

  const unitConversionMap: { [baseUnit: string]: { [purchaseUnit: string]: number } } = {
    'gram': { 'kg': 1000, 'gram': 1, 'pon': 453.592, 'ons': 28.3495 },
    'ml': { 'liter': 1000, 'ml': 1, 'galon': 3785.41 },
    'pcs': { 'pcs': 1, 'lusin': 12, 'gross': 144, 'box': 1, 'bungkus': 1 },
    'butir': { 'butir': 1, 'tray': 30, 'lusin': 12 },
    'kg': { 'kg': 1, 'gram': 0.001, 'ons': 0.0283495 },
    'liter': { 'liter': 1, 'ml': 0.001 },
  };

  useEffect(() => {
    if (item) {
      setFormData({
        nama: item.nama,
        kategori: item.kategori,
        stok: item.stok,
        satuan: item.satuan,
        minimum: item.minimum,
        hargaSatuan: item.hargaSatuan,
        supplier: item.supplier,
        tanggalKadaluwarsa: item.tanggalKadaluwarsa,
        jumlahBeliKemasan: item.jumlahBeliKemasan ?? 0,
        satuanKemasan: item.satuanKemasan ?? '',
        hargaTotalBeliKemasan: item.hargaTotalBeliKemasan ?? 0,
      });
    } else {
      setFormData({
        nama: '', kategori: '', stok: 0, satuan: '', minimum: 0, hargaSatuan: 0, supplier: '', tanggalKadaluwarsa: undefined,
        jumlahBeliKemasan: 0,
        satuanKemasan: '',
        hargaTotalBeliKemasan: 0,
      });
    }
  }, [item, isOpen]);

  const debouncedJumlahBeliKemasan = useDebounce(formData.jumlahBeliKemasan, 300);
  const debouncedSatuanKemasan = useDebounce(formData.satuanKemasan, 300);
  const debouncedHargaTotalBeliKemasan = useDebounce(formData.hargaTotalBeliKemasan, 300);
  const debouncedSatuanUtama = useDebounce(formData.satuan, 300);

  useEffect(() => {
    const purchaseQuantity = debouncedJumlahBeliKemasan;
    const purchaseUnit = debouncedSatuanKemasan;
    const purchaseTotalPrice = debouncedHargaTotalBeliKemasan;
    const baseUnit = debouncedSatuanUtama?.toLowerCase();

    let calculatedHarga = 0;

    if (
      (purchaseQuantity && purchaseQuantity > 0) &&
      (purchaseTotalPrice && purchaseTotalPrice > 0) &&
      (purchaseUnit && purchaseUnit !== '') &&
      baseUnit
    ) {
      const lowerCasePurchaseUnit = purchaseUnit.toLowerCase();
      const conversionRates = unitConversionMap[baseUnit];
      let factor = 0;

      if (conversionRates) {
        factor = conversionRates[lowerCasePurchaseUnit];
      }

      if (factor !== undefined && factor > 0) {
        calculatedHarga = purchaseTotalPrice / (purchaseQuantity * factor);
      } else if (lowerCasePurchaseUnit === baseUnit) {
        calculatedHarga = purchaseTotalPrice / purchaseQuantity;
      }
    }

    setFormData(prev => ({ ...prev, hargaSatuan: parseFloat(calculatedHarga.toFixed(2)) }));
  }, [debouncedJumlahBeliKemasan, debouncedSatuanKemasan, debouncedHargaTotalBeliKemasan, debouncedSatuanUtama]);

  const handleSave = async () => {
    if (
      !formData.nama || !formData.kategori || !formData.satuan ||
      formData.stok === undefined || formData.stok < 0 ||
      formData.hargaSatuan === undefined || formData.hargaSatuan < 0 ||
      formData.minimum === undefined || formData.minimum < 0
    ) {
      toast.error("Harap lengkapi semua field wajib dan pastikan nilai tidak negatif.");
      return;
    }

    if (
      formData.jumlahBeliKemasan === undefined || formData.jumlahBeliKemasan <= 0 ||
      !formData.satuanKemasan || formData.satuanKemasan.trim() === '' ||
      formData.hargaTotalBeliKemasan === undefined || formData.hargaTotalBeliKemasan <= 0
    ) {
      toast.error("Detail Pembelian: Jumlah Beli, Satuan Kemasan, dan Harga Total Beli wajib diisi dan harus lebih dari 0.");
      return;
    }

    const updatesToSend: Partial<BahanBaku> = {
      ...formData,
      stok: parseFloat(String(formData.stok)) || 0,
      minimum: parseFloat(String(formData.minimum)) || 0,
      hargaSatuan: parseFloat(String(formData.hargaSatuan)) || 0,
      tanggalKadaluwarsa: formData.tanggalKadaluwarsa,
    };

    await onSave(updatesToSend);
    onClose();
  };

  const handleClose = () => {
    setFormData({
      nama: '', kategori: '', stok: 0, satuan: '', minimum: 0, hargaSatuan: 0, supplier: '', tanggalKadaluwarsa: undefined,
      jumlahBeliKemasan: 0, satuanKemasan: '', hargaTotalBeliKemasan: 0,
    });
    onClose();
  };

  // Updated getInputValue with robust date handling
  const getInputValue = <T extends string | number | Date | null | undefined>(value: T): string | number => {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        return '';
      }
      // Safely handle toISOString with fallback
      const isoString = value.toISOString();
      return isoString ? isoString.split('T')[0] : '';
    }
    
    if (typeof value !== 'string' && typeof value !== 'number') {
      return '';
    }
    
    return value;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md font-inter flex flex-col h-[90vh] md:h-auto md:max-h-[90vh]">
        {/* ... rest of the JSX remains the same ... */}
      </DialogContent>
    </Dialog>
  );
};

export default BahanBakuEditDialog;