import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { BahanBaku } from "@/types/recipe"; // Pastikan BahanBaku interface mencakup harga_satuan (snake_case) dan tanggal_kadaluwarsa (snake_case)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Import Card components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components

interface BahanBakuEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<BahanBaku>) => void;
  item: BahanBaku | null;
}

const BahanBakuEditDialog = ({ isOpen, onClose, onSave, item }: BahanBakuEditDialogProps) => {
  // State untuk form utama
  const [formData, setFormData] = useState({
    nama: '',
    kategori: '',
    stok: 0,
    satuan: '',
    minimum: 0,
    hargaSatuan: 0, // Ini adalah state lokal untuk hargaSatuan (camelCase)
    supplier: '',
    tanggalKadaluwarsa: '' as string, // String format YYYY-MM-DD for date input
  });

  // State baru untuk Detail Pembelian
  const [purchaseDetails, setPurchaseDetails] = useState({
    purchaseQuantity: 0,   // Jumlah Beli Kemasan
    purchaseUnit: '',      // Satuan Kemasan
    purchaseTotalPrice: 0, // Harga Total Beli Kemasan
  });

  // unitConversionMap: Faktor konversi dari Satuan Kemasan ke satuan dasar bahan baku
  const unitConversionMap: { [baseUnit: string]: { [purchaseUnit: string]: number } } = {
    'gram': {
      'kg': 1000,
      'gram': 1,
      'pon': 453.592, // 1 pon = 453.592 gram
    },
    'ml': {
      'liter': 1000,
      'ml': 1,
      'galon': 3785.41, // 1 galon US = 3785.41 ml
    },
    'pcs': {
      'pcs': 1,
      'lusin': 12,
      'gross': 144,
      'box': 1, // Asumsi 1 box berisi 1 pcs standar (sesuaikan jika berbeda)
      'bungkus': 1, // Asumsi 1 bungkus berisi 1 pcs standar (sesuaikan jika berbeda)
    },
    'butir': {
      'butir': 1,
      'tray': 30, // Asumsi 1 tray = 30 butir
      'lusin': 12, // 1 lusin = 12 butir
    },
    // Tambahkan satuan dasar lain yang relevan di sini
  };

  // useEffect untuk mengisi formData dan purchaseDetails saat item berubah atau dialog dibuka
  useEffect(() => {
    if (item) {
      // Format tanggal_kadaluwarsa dari Date object/ISO string ke string YYYY-MM-DD untuk input type="date"
      const formattedDate = item.tanggal_kadaluwarsa // Asumsi item.tanggal_kadaluwarsa dari DB adalah string ISO atau Date object
        ? new Date(item.tanggal_kadaluwarsa).toISOString().split('T')[0]
        : '';

      setFormData({
        nama: item.nama,
        kategori: item.kategori,
        stok: item.stok,
        satuan: item.satuan,
        minimum: item.minimum,
        hargaSatuan: item.harga_satuan, // Mengambil harga_satuan dari item (DB)
        supplier: item.supplier,
        tanggalKadaluwarsa: formattedDate,
      });

      // Reset purchaseDetails saat item baru dimuat untuk diedit
      // Ini penting agar user bisa memilih untuk mengedit harga satuan secara manual atau via detail pembelian
      setPurchaseDetails({
        purchaseQuantity: 0,
        purchaseUnit: '',
        purchaseTotalPrice: 0,
      });

    } else {
      // Reset form jika item null (misal saat dialog ditutup)
      setFormData({
        nama: '', kategori: '', stok: 0, satuan: '', minimum: 0, hargaSatuan: 0, supplier: '', tanggalKadaluwarsa: '',
      });
      setPurchaseDetails({ purchaseQuantity: 0, purchaseUnit: '', purchaseTotalPrice: 0 });
    }
  }, [item, isOpen]);


  // useEffect untuk menghitung hargaSatuan otomatis berdasarkan Detail Pembelian
  useEffect(() => {
    const { purchaseQuantity, purchaseUnit, purchaseTotalPrice } = purchaseDetails;
    const baseUnit = formData.satuan.toLowerCase(); // Satuan dasar bahan baku yang dipilih

    let calculatedHarga = 0;

    // Hanya hitung jika semua input pembelian valid dan satuan dasar sudah diisi
    if (purchaseQuantity > 0 && purchaseTotalPrice > 0 && purchaseUnit && baseUnit) {
      const conversionRates = unitConversionMap[baseUnit];

      if (conversionRates) {
        const factor = conversionRates[purchaseUnit.toLowerCase()];

        if (factor !== undefined && factor > 0) {
          calculatedHarga = purchaseTotalPrice / (purchaseQuantity * factor);
        } else if (purchaseUnit.toLowerCase() === baseUnit) {
          // Jika satuan pembelian sama dengan satuan dasar (e.g., beli 'gram', satuan dasar 'gram')
          calculatedHarga = purchaseTotalPrice / purchaseQuantity;
        } else {
          // Jika satuan dasar ada tapi satuan pembelian tidak memiliki faktor konversi yang valid
          // Atau jika faktor <= 0
          // toast.warning(`Tidak ada faktor konversi yang valid untuk '${purchaseUnit}' ke '${baseUnit}'.`, { duration: 3000 });
        }
      } else {
        // Jika satuan dasar bahan baku (formData.satuan) tidak ada di unitConversionMap
        // toast.warning(`Satuan dasar bahan baku '${baseUnit}' tidak ada dalam peta konversi.`, { duration: 3000 });
      }
    }

    // Hanya update hargaSatuan jika ada detail pembelian yang diisi
    // Jika purchaseDetails.purchaseQuantity === 0 dan purchaseDetails.purchaseTotalPrice === 0,
    // maka biarkan hargaSatuan tetap dari `item` yang sedang diedit (yang diambil di useEffect pertama)
    if (purchaseQuantity > 0 || purchaseTotalPrice > 0) {
      setFormData(prev => ({ ...prev, hargaSatuan: parseFloat(calculatedHarga.toFixed(2)) }));
    }
    // Jika detail pembelian dikosongkan setelah diisi, biarkan hargaSatuan tetap pada nilai awal dari item
    // atau jika ingin dikembalikan ke 0:
    // else if (purchaseQuantity === 0 && purchaseTotalPrice === 0 && (item?.harga_satuan !== 0 && item?.harga_satuan !== undefined)) {
    //   setFormData(prev => ({ ...prev, hargaSatuan: 0 }));
    // }

  }, [purchaseDetails, formData.satuan, item]); // Tambahkan `item` sebagai dependensi untuk memastikan nilai awal

  const handleSave = () => {
    // Mapping properti dari state lokal (camelCase) ke format DB (snake_case)
    // Pastikan hanya properti yang relevan yang diperbarui
    const updates: Partial<BahanBaku> = {
      nama: formData.nama,
      kategori: formData.kategori,
      stok: formData.stok,
      satuan: formData.satuan,
      minimum: formData.minimum,
      supplier: formData.supplier,
      // Mapping hargaSatuan (camelCase) dari state ke harga_satuan (snake_case) untuk DB
      harga_satuan: formData.hargaSatuan,
      // Mapping tanggalKadaluwarsa (string) ke tanggal_kadaluwarsa (string ISO atau null) untuk DB
      tanggal_kadaluwarsa: formData.tanggalKadaluwarsa ? new Date(formData.tanggalKadaluwarsa).toISOString() : null,
    };

    onSave(updates); // Panggil onSave dari parent dengan updates yang sudah di-map
    onClose();
  };

  const handleClose = () => {
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
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="border-orange-200 focus:border-orange-400 rounded-md"
            />
          </div>

          <div>
            <Label htmlFor="kategori" className="text-gray-700">Kategori</Label>
            <Input
              id="kategori"
              value={formData.kategori}
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
                value={formData.stok}
                onChange={(e) => setFormData({ ...formData, stok: parseInt(e.target.value) || 0 })}
                min="0"
                className="border-orange-200 focus:border-orange-400 rounded-md"
              />
            </div>
            <div>
              <Label htmlFor="satuan" className="text-gray-700">Satuan</Label>
              <Input
                id="satuan"
                value={formData.satuan}
                onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                className="border-orange-200 focus:border-orange-400 rounded-md"
              />
            </div>
          </div>

          {/* Harga per Satuan (Rp) - Sekarang Read-Only */}
          <div>
            <Label htmlFor="hargaSatuan" className="text-gray-700">Harga per Satuan (Rp)</Label>
            <Input
              id="hargaSatuan"
              type="number"
              value={formData.hargaSatuan}
              readOnly // Jadikan read-only
              className="border-orange-200 focus:border-orange-400 rounded-md bg-gray-100 cursor-not-allowed" // Styling untuk read-only
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
              value={formData.minimum}
              onChange={(e) => setFormData({ ...formData, minimum: parseInt(e.target.value) || 0 })}
              min="0"
              className="border-orange-200 focus:border-orange-400 rounded-md"
            />
          </div>

          <div>
            <Label htmlFor="supplier" className="text-gray-700">Supplier</Label>
            <Input
              id="supplier"
              value={formData.supplier}
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
              value={formData.tanggalKadaluwarsa || ''} // Pastikan default ke '' jika null
              onChange={(e) => setFormData({ ...formData, tanggalKadaluwarsa: e.target.value })}
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
                      {/* Daftar pilihan satuan harus konsisten dengan `unitConversionMap` */}
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