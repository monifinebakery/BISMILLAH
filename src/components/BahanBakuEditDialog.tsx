import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { BahanBaku } from '@/types/recipe'; // Pastikan BahanBaku interface mencakup properti baru
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner"; // Import toast

interface BahanBakuEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<BahanBaku>) => Promise<void>;
  item: BahanBaku | null; // item ini adalah data asli dari database (sudah camelCase dari hook)
}

// NEW: useDebounce hook (dipindahkan ke luar komponen agar bisa dipakai di sini)
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
  // MODIFIED: formData sekarang akan mengelola SEMUA input
  const [formData, setFormData] = useState<Partial<BahanBaku>>({
    nama: '',
    kategori: '',
    stok: 0,
    satuan: '',
    minimum: 0,
    hargaSatuan: 0,
    supplier: '',
    tanggalKadaluwarsa: undefined,
    // MODIFIED: Inisialisasi properti detail pembelian ke 0 atau '' (tidak lagi null) untuk item baru
    jumlahBeliKemasan: 0,   // Default 0 untuk numeric
    satuanKemasan: '',     // Default '' untuk string
    hargaTotalBeliKemasan: 0, // Default 0 untuk numeric
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
        // Inisialisasi properti detail pembelian langsung dari item ke formData
        // MODIFIED: Pastikan item.jumlahBeliKemasan/etc. tidak undefined/null agar tidak menjadi default 0/''
        jumlahBeliKemasan: item.jumlahBeliKemasan ?? 0, // Assign 0 if null/undefined from DB
        satuanKemasan: item.satuanKemasan ?? '',       // Assign '' if null/undefined from DB
        hargaTotalBeliKemasan: item.hargaTotalBeliKemasan ?? 0, // Assign 0 if null/undefined from DB
      });

    } else {
      // Reset form jika item null (misal saat dialog ditutup atau untuk item baru)
      setFormData({
        nama: '', kategori: '', stok: 0, satuan: '', minimum: 0, hargaSatuan: 0, supplier: '', tanggalKadaluwarsa: undefined,
        // MODIFIED: Pastikan default inisialisasi untuk item baru adalah 0 atau ''
        jumlahBeliKemasan: 0,
        satuanKemasan: '',
        hargaTotalBeliKemasan: 0,
      });
    }
  }, [item, isOpen]);

  // MODIFIED: Debounce dependencies for hargaSatuan calculation
  // Gunakan properti langsung dari formData
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

    // MODIFIED: Validasi agar memastikan nilai yang diperlukan tidak nol/kosong
    if (
      (purchaseQuantity && purchaseQuantity > 0) && // Check that it's a number > 0 (not null/undefined/0)
      (purchaseTotalPrice && purchaseTotalPrice > 0) && // Check that it's a number > 0
      (purchaseUnit && purchaseUnit !== '') && // Check that it's a non-empty string
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
    // Validasi dasar
    if (
        !formData.nama || !formData.kategori || !formData.satuan ||
        formData.stok === undefined || formData.stok < 0 ||
        formData.hargaSatuan === undefined || formData.hargaSatuan < 0 ||
        formData.minimum === undefined || formData.minimum < 0
    ) {
      toast.error("Harap lengkapi semua field wajib dan pastikan nilai tidak negatif.");
      return;
    }

    // MODIFIED: Validasi untuk field Detail Pembelian yang sekarang wajib
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
      // Karena semua sekarang ada di formData, tidak perlu assign dari purchaseDetails lagi
    };

    await onSave(updatesToSend);

    onClose();
  };

  const handleClose = () => {
    // MODIFIED: Reset semua field di formData ke 0 atau '' saat menutup dialog
    setFormData({
      nama: '', kategori: '', stok: 0, satuan: '', minimum: 0, hargaSatuan: 0, supplier: '', tanggalKadaluwarsa: undefined,
      jumlahBeliKemasan: 0, satuanKemasan: '', hargaTotalBeliKemasan: 0, // MODIFIED: Reset ke 0 atau ''
    });
    // MODIFIED: Hapus setPurchaseDetails karena tidak ada lagi
    onClose();
  };

  // Helper function to safely render values in inputs as string or number
  const getInputValue = <T extends string | number | Date | null | undefined>(value: T): string | number => {
    if (value === null || value === undefined) {
      return '';
    }
    // Jika itu objek Date, konversi ke YYYY-MM-DD
    if (value instanceof Date) {
      // Pastikan tanggal valid sebelum memanggil toISOString
      if (isNaN(value.getTime())) {
        return ''; // Tanggal tidak valid, kembalikan string kosong
      }
      return value.toISOString().split('T')[0];
    }
    // Jika nilai bukan Date, string, atau number, kembalikan string kosong
    // Ini menangani kasus di mana 'value' mungkin objek kosong atau array
    if (typeof value !== 'string' && typeof value !== 'number') {
      return '';
    }
    return value;
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
                value={getInputValue(formData.tanggalKadaluwarsa) as string} // MODIFIED: Gunakan getInputValue
                onChange={(e) => setFormData({ ...formData, tanggalKadaluwarsa: e.target.value ? new Date(e.target.value) : undefined })}
                className="border-orange-200 focus:border-orange-400 rounded-md"
              />
            </div>

            {/* NEW SECTION: Detail Pembelian */}
            <Card className="border-orange-200 bg-orange-50 shadow-sm rounded-lg mt-6">
              <CardHeader>
                <CardTitle className="text-base text-gray-800">Detail Pembelian</CardTitle> {/* MODIFIED: Hapus "(Opsional)" */}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="jumlahBeliKemasan">Jumlah Beli Kemasan *</Label> {/* MODIFIED: Tambahkan "*" */}
                    <Input
                      id="jumlahBeliKemasan"
                      type="number"
                      value={getInputValue(formData.jumlahBeliKemasan)}
                      onChange={(e) => setFormData({ ...formData, jumlahBeliKemasan: parseFloat(e.target.value) || null })}
                      placeholder="0"
                      className="rounded-md"
                      required // MODIFIED: Tambahkan required
                    />
                  </div>
                  <div>
                    <Label htmlFor="satuanKemasan">Satuan Kemasan *</Label> {/* MODIFIED: Tambahkan "*" */}
                    <Select
                      value={getInputValue(formData.satuanKemasan) as string}
                      onValueChange={(value) => setFormData({ ...formData, satuanKemasan: value })}
                      required // MODIFIED: Tambahkan required
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
                    <Label htmlFor="hargaTotalBeliKemasan">Harga Total Beli Kemasan *</Label> {/* MODIFIED: Tambahkan "*" */}
                    <Input
                      id="hargaTotalBeliKemasan"
                      type="number"
                      value={getInputValue(formData.hargaTotalBeliKemasan)}
                      onChange={(e) => setFormData({ ...formData, hargaTotalBeliKemasan: parseFloat(e.target.value) || null })}
                      placeholder="0"
                      className="rounded-md"
                      required // MODIFIED: Tambahkan required
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Harga Satuan akan dihitung otomatis jika detail pembelian diisi.
                </p>
              </CardContent>
            </Card>
          </div>

        </div> {/* End flex-grow overflow div */}

        <div className="flex gap-2 pt-4"> {/* Buttons */}
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