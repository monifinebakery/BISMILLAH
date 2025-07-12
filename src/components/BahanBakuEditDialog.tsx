import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { BahanBaku } from "@/types/recipe"; // Pastikan BahanBaku interface mencakup tanggalKadaluwarsa

interface BahanBakuEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<BahanBaku>) => void;
  item: BahanBaku | null;
}

const BahanBakuEditDialog = ({ isOpen, onClose, onSave, item }: BahanBakuEditDialogProps) => {
  // MODIFIED: Tambahkan tanggalKadaluwarsa ke state formData
  const [formData, setFormData] = useState({
    nama: '',
    kategori: '',
    stok: 0,
    satuan: '',
    minimum: 0,
    hargaSatuan: 0,
    supplier: '',
    tanggalKadaluwarsa: '' as string | undefined, // Akan disimpan sebagai string YYYY-MM-DD
  });

  useEffect(() => {
    if (item) {
      // MODIFIED: Format tanggalKadaluwarsa dari Date object ke string YYYY-MM-DD untuk input type="date"
      const formattedDate = item.tanggalKadaluwarsa
        ? item.tanggalKadaluwarsa.toISOString().split('T')[0]
        : undefined;

      setFormData({
        nama: item.nama,
        kategori: item.kategori,
        stok: item.stok,
        satuan: item.satuan,
        minimum: item.minimum,
        hargaSatuan: item.hargaSatuan,
        supplier: item.supplier,
        tanggalKadaluwarsa: formattedDate,
      });
    } else {
      setFormData({
        nama: '',
        kategori: '',
        stok: 0,
        satuan: '',
        minimum: 0,
        hargaSatuan: 0,
        supplier: '',
        tanggalKadaluwarsa: undefined,
      });
    }
  }, [item, isOpen]);

  const handleSave = () => {
    // MODIFIED: Pastikan tanggalKadaluwarsa disertakan dalam objek yang diteruskan ke onSave
    // Konversi kembali ke Date object atau ISO string di handleEditSave di WarehousePage
    onSave({
      ...formData,
      tanggalKadaluwarsa: formData.tanggalKadaluwarsa // Kirim apa adanya, konversi di parent
    });
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

          <div>
            <Label htmlFor="harga" className="text-gray-700">Harga per Satuan (Rp)</Label>
            <Input
              id="harga"
              type="number"
              value={formData.hargaSatuan}
              onChange={(e) => setFormData({ ...formData, hargaSatuan: parseInt(e.target.value) || 0 })}
              min="0"
              className="border-orange-200 focus:border-orange-400 rounded-md"
            />
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

          {/* MODIFIED: Tambahkan input Tanggal Kadaluwarsa */}
          <div>
            <Label htmlFor="tanggalKadaluwarsa" className="text-gray-700">Tanggal Kadaluwarsa</Label>
            <Input
              id="tanggalKadaluwarsa"
              type="date"
              value={formData.tanggalKadaluwarsa || ''} // Pastikan default ke '' jika undefined/null
              onChange={(e) => setFormData({ ...formData, tanggalKadaluwarsa: e.target.value })}
              className="border-orange-200 focus:border-orange-400 rounded-md"
            />
          </div>
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
