import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { BahanBaku } from '@/hooks/useBahanBaku'; // Pastikan BahanBaku interface mencakup tanggalKadaluwarsa (Date | undefined)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner"; // Import toast

interface BahanBakuEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<BahanBaku>) => void;
  item: BahanBaku | null; // item ini adalah data asli dari database (sudah camelCase dari hook, dengan tanggalKadaluwarsa: Date | undefined)
}

const BahanBakuEditDialog = ({ isOpen, onClose, onSave, item }: BahanBakuEditDialogProps) => {
  // State untuk form utama. Sekarang tanggalKadaluwarsa akan menjadi Date | undefined
  const [formData, setFormData] = useState<Partial<BahanBaku>>({
    nama: '',
    kategori: '',
    stok: 0,
    satuan: '',
    minimum: 0,
    hargaSatuan: 0,
    supplier: '',
    tanggalKadaluwarsa: undefined, // MODIFIED: Inisialisasi sebagai undefined (Date | undefined)
  });

  // State baru untuk Detail Pembelian
  const [purchaseDetails, setPurchaseDetails] = useState({
    purchaseQuantity: 0,
    purchaseUnit: '',
    purchaseTotalPrice: 0,
  });

  // unitConversionMap: Faktor konversi (sama seperti di WarehousePage)
  const unitConversionMap: { [baseUnit: string]: { [purchaseUnit: string]: number } } = {
    'gram': { 'kg': 1000, 'gram': 1, 'pon': 453.592, 'ons': 28.3495 },
    'ml': { 'liter': 1000, 'ml': 1, 'galon': 3785.41 },
    'pcs': { 'pcs': 1, 'lusin': 12, 'gross': 144, 'box': 1, 'bungkus': 1 },
    'butir': { 'butir': 1, 'tray': 30, 'lusin': 12 },
    'kg': { 'kg': 1, 'gram': 0.001, 'ons': 0.0283495 }, // Tambahkan konversi umum
    'liter': { 'liter': 1, 'ml': 0.001 },
  };

  // MODIFIED: useEffect pertama (Inisialisasi data form saat dialog dibuka/item berubah)
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
        tanggalKadaluwarsa: item.tanggalKadaluwarsa, // MODIFIED: Langsung assign Date | undefined dari item
      });

      setPurchaseDetails({
        purchaseQuantity: 0,
        purchaseUnit: '',
        purchaseTotalPrice: 0,
      });

    } else {
      // Reset form jika item null (misal saat dialog ditutup atau untuk item baru)
      setFormData({
        nama: '', kategori: '', stok: 0, satuan: '', minimum: 0, hargaSatuan: 0, supplier: '', tanggalKadaluwarsa: undefined,
      });
      setPurchaseDetails({ purchaseQuantity: 0, purchaseUnit: '', purchaseTotalPrice: 0 });
    }
  }, [item, isOpen]); // Dependensi: item dan isOpen

  // useEffect kedua (Perhitungan harga satuan)
  useEffect(() => {
    const { purchaseQuantity, purchaseUnit, purchaseTotalPrice } = purchaseDetails;
    const baseUnit = formData.satuan?.toLowerCase(); // Satuan dasar bahan baku yang dipilih, gunakan optional chaining

    let calculatedHarga = 0;

    // Lakukan perhitungan hanya jika ada input aktif di "Detail Pembelian"
    const isPurchaseDetailsActive = purchaseQuantity > 0 || purchaseTotalPrice > 0 || purchaseUnit !== '';

    if (isPurchaseDetailsActive) {
      if (purchaseQuantity > 0 && purchaseTotalPrice > 0 && purchaseUnit && baseUnit) {
        const conversionRates = unitConversionMap[baseUnit];

        if (conversionRates) {
          const factor = conversionRates[purchaseUnit.toLowerCase()];

          if (factor !== undefined && factor > 0) {
            calculatedHarga = purchaseTotalPrice / (purchaseQuantity * factor);
          } else if (purchaseUnit.toLowerCase() === baseUnit) {
            calculatedHarga = purchaseTotalPrice / purchaseQuantity;
          }
        }
      }
      setFormData(prev => ({ ...prev, hargaSatuan: parseFloat(calculatedHarga.toFixed(2)) }));
    } else {
      // Jika tidak ada input aktif di "Detail Pembelian", kembalikan hargaSatuan ke nilai aslinya dari item
      // Ini penting agar harga tidak terreset ke 0 jika user tidak mengisi detail pembelian
      if (item) {
        setFormData(prev => ({ ...prev, hargaSatuan: item.hargaSatuan }));
      } else {
        setFormData(prev => ({ ...prev, hargaSatuan: 0 })); // Jika item baru, set ke 0
      }
    }
  }, [purchaseDetails, formData.satuan, item]); // Tambahkan `item` sebagai dependensi

  const handleSave = () => {
    // Validasi dasar
    if (!formData.nama || !formData.kategori || formData.stok === undefined || formData.stok < 0 || formData.hargaSatuan === undefined || formData.hargaSatuan < 0 || formData.minimum === undefined || formData.minimum < 0) {
      toast.error("Harap lengkapi semua field wajib dan pastikan nilai tidak negatif.");
      return;
    }

    // MODIFIED: formData.tanggalKadaluwarsa sekarang sudah Date | undefined, jadi bisa langsung dilewatkan
    onSave({
      ...formData,
      stok: parseFloat(String(formData.stok)) || 0,
      minimum: parseFloat(String(formData.minimum)) || 0,
      hargaSatuan: parseFloat(String(formData.hargaSatuan)) || 0,
      tanggalKadaluwarsa: formData.tanggalKadaluwarsa, // MODIFIED: Langsung lewatkan Date | undefined
      // Tambahkan properti detail pembelian
      jumlahBeliKemasan: purchaseDetails.purchaseQuantity,
      satuanKemasan: purchaseDetails.purchaseUnit,
      hargaTotalBeliKemasan: purchaseDetails.purchaseTotalPrice,
    });
    onClose();
  };

  const handleClose = () => {
    // Reset state saat dialog ditutup untuk memastikan bersih saat dibuka lagi
    setFormData({ nama: '', kategori: '', stok: 0, satuan: '', minimum: 0, hargaSatuan: 0, supplier: '', tanggalKadaluwarsa: undefined }); // MODIFIED: Reset ke undefined
    setPurchaseDetails({ purchaseQuantity: 0, purchaseUnit: '', purchaseTotalPrice: 0 });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md font-inter">
        <DialogHeader>
          <DialogTitle className="text-orange-600">Edit Bahan Baku</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="nama" className="text-gray-700">Nama Bahan</Label>
            <Input
              id="nama"
              value={formData.nama || ''}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="border-orange-200 focus:border-orange-400 rounded-md"
            />
          </div>

          <div>
            <Label htmlFor="kategori" className="text-gray-700">Kategori</Label>
            <Input
              id="kategori"
              value={formData.kategori || ''}
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
                value={formData.stok || ''}
                onChange={(e) => setFormData({ ...formData, stok: parseFloat(e.target.value) || 0 })}
                min="0"
                className="border-orange-200 focus:border-orange-400 rounded-md"
              />
            </div>
            <div>
              <Label htmlFor="satuan" className="text-gray-700">Satuan</Label>
              <Input
                id="satuan"
                value={formData.satuan || ''}
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
              value={formData.hargaSatuan || ''}
              readOnly
              className="border-orange-200 focus:border-orange-400 rounded-md bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Harga per {formData.satuan || 'unit'} akan dihitung otomatis jika 'Detail Pembelian' diisi.
            </p>
          </div>

          <div>
            <Label htmlFor="minimum" className="text-gray-700">Stok Minimum</Label>
            <Input
              id="minimum"
              type="number"
              value={formData.minimum || ''}
              onChange={(e) => setFormData({ ...formData, minimum: parseFloat(e.target.value) || 0 })}
              min="0"
              className="border-orange-200 focus:border-orange-400 rounded-md"
            />
          </div>

          <div>
            <Label htmlFor="supplier" className="text-gray-700">Supplier</Label>
            <Input
              id="supplier"
              value={formData.supplier || ''}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="border-orange-200 focus:border-orange-400 rounded-md"
            />
          </div>

          {/* Input Tanggal Kadaluwarsa */}
          <div>
            <Label htmlFor="tanggalKadaluwarsa" className="text-gray-700">Tanggal Kadaluwarsa</Label>
            <Input
              id="tanggalKadaluwarsa"
              type="date"
              // MODIFIED: Tampilkan Date object sebagai string YYYY-MM-DD untuk input
              value={formData.tanggalKadaluwarsa instanceof Date ? formData.tanggalKadaluwarsa.toISOString().split('T')[0] : ''}
              // MODIFIED: Konversi string dari input kembali menjadi Date object atau undefined
              onChange={(e) => setFormData({ ...formData, tanggalKadaluwarsa: e.target.value ? new Date(e.target.value) : undefined })}
              className="border-orange-200 focus:border-orange-400 rounded-md"
            />
          </div>

          {/* NEW SECTION: Detail Pembelian */}
          <Card className="border-orange-200 bg-orange-50 shadow-sm rounded-lg mt-6">
            <CardHeader>
              <CardTitle className="text-base text-gray-800">Detail Pembelian (Opsional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="purchaseQuantity">Jumlah Beli Kemasan</Label>
                  <Input
                    id="purchaseQuantity"
                    type="number"
                    value={purchaseDetails.purchaseQuantity || ''}
                    onChange={(e) => setPurchaseDetails({ ...purchaseDetails, purchaseQuantity: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="rounded-md"
                  />
                </div>
                <div>
                  <Label htmlFor="purchaseUnit">Satuan Kemasan</Label>
                  <Select
                    value={purchaseDetails.purchaseUnit}
                    onValueChange={(value) => setPurchaseDetails({ ...purchaseDetails, purchaseUnit: value })}
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
                  <Label htmlFor="purchaseTotalPrice">Harga Total Beli Kemasan</Label>
                  <Input
                    id="purchaseTotalPrice"
                    type="number"
                    value={purchaseDetails.purchaseTotalPrice || ''}
                    onChange={(e) => setPurchaseDetails({ ...purchaseDetails, purchaseTotalPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="rounded-md"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Harga Satuan akan dihitung otomatis jika detail pembelian diisi.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 mt-6">
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