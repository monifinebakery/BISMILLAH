import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { BahanBaku } from "@/types/recipe"; // Pastikan BahanBaku interface mencakup tanggalKadaluwarsa
import { toast } from "sonner"; // Import toast

interface BahanBakuEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<BahanBaku>) => void;
  item: BahanBaku | null;
}

const BahanBakuEditDialog = ({ isOpen, onClose, onSave, item }: BahanBakuEditDialogProps) => {
  const [formData, setFormData] = useState<Partial<BahanBaku>>({ // MODIFIED: Gunakan Partial<BahanBaku> untuk type safety
    nama: '',
    kategori: '',
    stok: 0,
    satuan: '',
    minimum: 0,
    hargaSatuan: 0,
    supplier: '',
    tanggalKadaluwarsa: undefined, 
  });

  useEffect(() => {
    if (item) {
      // Format Date object ke string YYYY-MM-DD untuk input type="date"
      const formattedDateString = item.tanggalKadaluwarsa instanceof Date && !isNaN(item.tanggalKadaluwarsa.getTime())
        ? item.tanggalKadaluwarsa.toISOString().split('T')[0]
        : ''; // Kosongkan jika bukan Date atau invalid

      setFormData({
        nama: item.nama,
        kategori: item.kategori,
        stok: item.stok,
        satuan: item.satuan,
        minimum: item.minimum,
        hargaSatuan: item.hargaSatuan,
        supplier: item.supplier,
        // Simpan sebagai string YYYY-MM-DD untuk input
        tanggalKadaluwarsa: formattedDateString, 
      });
    } else {
      setFormData({
        nama: '', kategori: '', stok: 0, satuan: '', minimum: 0, hargaSatuan: 0, supplier: '', tanggalKadaluwarsa: undefined,
      });
    }
  }, [item, isOpen]);

  const handleSave = () => {
    // Validasi dasar
    if (!formData.nama || !formData.kategori || formData.stok === undefined || formData.stok < 0 || formData.hargaSatuan === undefined || formData.hargaSatuan < 0 || formData.minimum === undefined || formData.minimum < 0) {
      toast.error("Harap lengkapi semua field wajib dan pastikan nilai tidak negatif.");
      return;
    }

    // Konversi tanggalKadaluwarsa dari string YYYY-MM-DD kembali ke Date object
    const tanggalKadaluwarsaDate = formData.tanggalKadaluwarsa 
      ? new Date(formData.tanggalKadaluwarsa) 
      : undefined;

    onSave({
      ...formData,
      stok: parseFloat(String(formData.stok)) || 0, // Pastikan number
      minimum: parseFloat(String(formData.minimum)) || 0, // Pastikan number
      hargaSatuan: parseFloat(String(formData.hargaSatuan)) || 0, // Pastikan number
      tanggalKadaluwarsa: tanggalKadaluwarsaDate, // Kirim sebagai Date object atau undefined
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
            <Label htmlFor="harga" className="text-gray-700">Harga per Satuan (Rp)</Label>
            <Input
              id="harga"
              type="number"
              value={formData.hargaSatuan || ''}
              onChange={(e) => setFormData({ ...formData, hargaSatuan: parseFloat(e.target.value) || 0 })}
              min="0"
              className="border-orange-200 focus:border-orange-400 rounded-md"
            />
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
