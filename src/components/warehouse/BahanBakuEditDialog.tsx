import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { BahanBaku } from '@/types/recipe';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";
import { formatDateToYYYYMMDD, safeParseDate } from '@/utils/unifiedDateUtils';
import { getInputValue } from '@/utils/inputUtils'; // Use imported version

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
    tanggalKadaluwarsa: null,
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
        nama: item.nama || '',
        kategori: item.kategori || '',
        stok: item.stok || 0,
        satuan: item.satuan || '',
        minimum: item.minimum || 0,
        hargaSatuan: item.hargaSatuan || 0,
        supplier: item.supplier || '',
        tanggalKadaluwarsa: safeParseDate(item.tanggalKadaluwarsa),
        jumlahBeliKemasan: item.jumlahBeliKemasan || 0,
        satuanKemasan: item.satuanKemasan || '',
        hargaTotalBeliKemasan: item.hargaTotalBeliKemasan || 0,
      });
    } else {
      setFormData({
        nama: '', kategori: '', stok: 0, satuan: '', minimum: 0,
        hargaSatuan: 0, supplier: '', tanggalKadaluwarsa: null,
        jumlahBeliKemasan: 0, satuanKemasan: '', hargaTotalBeliKemasan: 0,
      });
    }
  }, [item, isOpen]);

  const debouncedJumlahBeliKemasan = useDebounce(formData.jumlahBeliKemasan, 300);
  const debouncedSatuanKemasan = useDebounce(formData.satuanKemasan, 300);
  const debouncedHargaTotalBeliKemasan = useDebounce(formData.hargaTotalBeliKemasan, 300);
  const debouncedSatuanUtama = useDebounce(formData.satuan, 300);

  useEffect(() => {
    const purchaseQuantity = debouncedJumlahBeliKemasan || 0;
    const purchaseUnit = debouncedSatuanKemasan || '';
    const purchaseTotalPrice = debouncedHargaTotalBeliKemasan || 0;
    const baseUnit = debouncedSatuanUtama?.toLowerCase() || '';

    let calculatedHarga = 0;

    if (purchaseQuantity > 0 && purchaseTotalPrice > 0 && purchaseUnit && baseUnit) {
      const lowerCasePurchaseUnit = purchaseUnit.toLowerCase();
      const conversionRates = unitConversionMap[baseUnit] || {};
      const factor = conversionRates[lowerCasePurchaseUnit] || (lowerCasePurchaseUnit === baseUnit ? 1 : 0);

      if (factor > 0) {
        calculatedHarga = purchaseTotalPrice / (purchaseQuantity * factor);
      }
    }

    setFormData(prev => ({ ...prev, hargaSatuan: parseFloat(calculatedHarga.toFixed(2)) || 0 }));
  }, [debouncedJumlahBeliKemasan, debouncedSatuanKemasan, debouncedHargaTotalBeliKemasan, debouncedSatuanUtama]);

  const handleSave = async () => {
    if (
      !formData.nama?.trim() || !formData.kategori?.trim() || !formData.satuan?.trim() ||
      (formData.stok !== undefined && formData.stok < 0) ||
      (formData.hargaSatuan !== undefined && formData.hargaSatuan < 0) ||
      (formData.minimum !== undefined && formData.minimum < 0)
    ) {
      toast.error("Harap lengkapi semua field wajib dan pastikan nilai tidak negatif.");
      return;
    }

    if (
      (formData.jumlahBeliKemasan !== undefined && formData.jumlahBeliKemasan <= 0) ||
      !formData.satuanKemasan?.trim() ||
      (formData.hargaTotalBeliKemasan !== undefined && formData.hargaTotalBeliKemasan <= 0)
    ) {
      toast.error("Detail Pembelian: Jumlah Beli, Satuan Kemasan, dan Harga Total Beli wajib diisi dan harus lebih dari 0.");
      return;
    }

    const updatesToSend: Partial<BahanBaku> = {
      ...formData,
      stok: formData.stok !== undefined ? parseFloat(String(formData.stok)) || 0 : 0,
      minimum: formData.minimum !== undefined ? parseFloat(String(formData.minimum)) || 0 : 0,
      hargaSatuan: formData.hargaSatuan !== undefined ? parseFloat(String(formData.hargaSatuan)) || 0 : 0,
      tanggalKadaluwarsa: formData.tanggalKadaluwarsa,
    };

    try {
      await onSave(updatesToSend);
      onClose();
      toast.success("Bahan baku berhasil diperbarui!");
    } catch (error) {
      toast.error("Gagal menyimpan perubahan.");
    }
  };

  const handleClose = () => {
    setFormData({
      nama: '', kategori: '', stok: 0, satuan: '', minimum: 0,
      hargaSatuan: 0, supplier: '', tanggalKadaluwarsa: null,
      jumlahBeliKemasan: 0, satuanKemasan: '', hargaTotalBeliKemasan: 0,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md font-inter flex flex-col h-[90vh] md:h-auto md:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-orange-600">Edit Bahan Baku</DialogTitle>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-4 -mr-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="nama" className="text-gray-700">Nama Bahan</Label>
              <Input
                id="nama"
                value={getInputValue(formData.nama)}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="border-orange-200 focus:border-orange-400 rounded-md"
              />
            </div>

            <div>
              <Label htmlFor="kategori" className="text-gray-700">Kategori</Label>
              <Input
                id="kategori"
                value={getInputValue(formData.kategori)}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                className="border-orange-200 focus:border-orange-400 rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="stok" className="text-gray-700">Stok</Label>
                <Input
                  id="stok"
                  type="number"
                  value={getInputValue(formData.stok)}
                  onChange={(e) => setFormData({ ...formData, stok: parseFloat(e.target.value) || 0 })}
                  min="0"
                  className="border-orange-200 focus:border-orange-400 rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="satuan" className="text-gray-700">Satuan</Label>
                <Input
                  id="satuan"
                  value={getInputValue(formData.satuan)}
                  onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                  className="border-orange-200 focus:border-orange-400 rounded-md"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="hargaSatuan" className="text-gray-700">Harga per Satuan (Rp)</Label>
              <Input
                id="hargaSatuan"
                type="number"
                value={getInputValue(formData.hargaSatuan)}
                readOnly
                className="border-orange-200 focus:border-orange-400 rounded-md bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Harga per {getInputValue(formData.satuan) || 'unit'} akan dihitung otomatis jika 'Detail Pembelian' diisi.
              </p>
            </div>

            <div>
              <Label htmlFor="minimum" className="text-gray-700">Stok Minimum</Label>
              <Input
                id="minimum"
                type="number"
                value={getInputValue(formData.minimum)}
                onChange={(e) => setFormData({ ...formData, minimum: parseFloat(e.target.value) || 0 })}
                min="0"
                className="border-orange-200 focus:border-orange-400 rounded-md"
              />
            </div>

            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={getInputValue(formData.supplier)}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="border-orange-200 focus:border-orange-400 rounded-md"
              />
            </div>

            <div>
              <Label htmlFor="tanggalKadaluwarsa">Tanggal Kadaluwarsa</Label>
              <Input
                id="tanggalKadaluwarsa"
                type="date"
                value={formatDateToYYYYMMDD(formData.tanggalKadaluwarsa)}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  setFormData({
                    ...formData,
                    tanggalKadaluwarsa: date && !isNaN(date.getTime()) ? date : null,
                  });
                }}
                className="border-orange-200 focus:border-orange-400 rounded-md"
              />
            </div>

            <Card className="border-orange-200 bg-orange-50 shadow-sm rounded-lg mt-6">
              <CardHeader>
                <CardTitle className="text-base text-gray-800">Detail Pembelian</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="jumlahBeliKemasan">Jumlah Beli Kemasan *</Label>
                    <Input
                      id="jumlahBeliKemasan"
                      type="number"
                      value={getInputValue(formData.jumlahBeliKemasan)}
                      onChange={(e) => setFormData({ ...formData, jumlahBeliKemasan: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="satuanKemasan">Satuan Kemasan *</Label>
                    <Select
                      value={getInputValue(formData.satuanKemasan) as string}
                      onValueChange={(value) => setFormData({ ...formData, satuanKemasan: value })}
                      required
                    >
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder="Pilih satuan" />
                      </SelectTrigger>
                      <SelectContent>
                        {['kg', 'liter', 'pcs', 'bungkus', 'karung', 'box', 'tray', 'lusin', 'butir', 'gram', 'ml', 'pon', 'ons', 'galon'].map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="hargaTotalBeliKemasan">Harga Total Beli Kemasan *</Label>
                    <Input
                      id="hargaTotalBeliKemasan"
                      type="number"
                      value={getInputValue(formData.hargaTotalBeliKemasan)}
                      onChange={(e) => setFormData({ ...formData, hargaTotalBeliKemasan: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="rounded-md"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Harga Satuan akan dihitung otomatis jika detail pembelian diisi.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={handleClose} className="flex-1 border-gray-300 hover:bg-gray-50 rounded-md">
            Batal
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-md">
            Simpan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BahanBakuEditDialog;