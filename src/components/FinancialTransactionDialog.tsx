import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";

interface FinancialTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: any) => Promise<boolean>; // Asumsi tipe transaksi dari hook
  categories: { income: string[]; expense: string[] };
}

const FinancialTransactionDialog: React.FC<FinancialTransactionDialogProps> = ({ isOpen, onClose, onAddTransaction, categories }) => {
  const [formData, setFormData] = useState({
    user_id: '', // Akan diisi saat handleSave
    type: 'pemasukan' as 'pemasukan' | 'pengeluaran',
    category: '', // Akan menjadi string kosong jika tidak ada pilihan
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD string
  });

  // useEffect untuk mereset form saat dialog dibuka/ditutup
  useEffect(() => {
    if (isOpen) {
      setFormData({
        user_id: '',
        type: 'pemasukan',
        category: '', // Reset ke string kosong untuk placeholder
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [isOpen]);

  // Helper untuk menangani perubahan input secara umum
  const handleChange = (name: string, value: string | number) => {
    // Penanganan khusus untuk Select category jika nilainya adalah nilai placeholder atau string kosong
    if (name === 'category' && (value === "" || value === "-placeholder-category-")) {
      setFormData(prev => ({ ...prev, [name]: '' })); // Pastikan selalu string kosong untuk 'tidak dipilih'
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    // Validasi yang lebih ketat
    if (
      !formData.category.trim() || // Kategori harus diisi (trim untuk cek spasi kosong)
      formData.amount <= 0 ||    // Jumlah harus > 0
      !formData.description.trim() || // Deskripsi harus diisi
      !formData.date             // Tanggal harus diisi
    ) {
      toast.error('Kategori, jumlah, deskripsi, dan tanggal wajib diisi. Jumlah harus lebih dari 0.');
      return;
    }

    // Pastikan tanggal adalah Date object yang valid
    const parsedDate = new Date(formData.date);
    if (isNaN(parsedDate.getTime())) {
      toast.error('Tanggal tidak valid.');
      return;
    }

    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id || '';

    const transactionData = {
      user_id: userId,
      type: formData.type,
      category: formData.category,
      amount: Number(formData.amount), // Pastikan ini number (gunakan Number() daripada parseFloat(toString()))
      description: formData.description,
      date: parsedDate, // Gunakan Date object yang sudah diparsing dan divalidasi
    };

    const success = await onAddTransaction(transactionData);
    if (success) {
      onClose();
      toast.success('Transaksi berhasil ditambahkan!');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* MODIFIED: Tambahkan flex-col dan atur tinggi untuk scrollability di mobile */}
      <DialogContent className="max-w-md font-inter flex flex-col h-[90vh] md:h-auto md:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Tambah Transaksi Keuangan</DialogTitle>
        </DialogHeader>

        {/* MODIFIED: Wrapper untuk konten yang bisa di-scroll */}
        <div className="flex-grow overflow-y-auto pr-4 -mr-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipe Transaksi</Label>
              <Select
                name="type"
                value={String(formData.type)} // Pastikan string
                onValueChange={(value: 'pemasukan' | 'pengeluaran') => handleChange('type', value)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Pilih tipe transaksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pemasukan">Pemasukan</SelectItem>
                  <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category" className="block text-sm font-medium text-gray-700">Kategori</Label>
              <Select
                name="category"
                value={String(formData.category)} // Pastikan string. Jika "" akan menampilkan placeholder
                onValueChange={(value) => handleChange('category', value)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {/* MODIFIED: Hapus SelectItem value="" yang menyebabkan error. */}
                  {/* Gunakan SelectValue placeholder di atas untuk placeholder. */}
                  {/* Jika Anda benar-benar membutuhkan opsi "Pilih Kategori", berikan nilai unik non-kosong dan non-pilih. */}
                  {/* Contoh: <SelectItem value="default_placeholder_value" disabled>Pilih Kategori</SelectItem> */}
                  {/* atau biarkan kosong dan biarkan placeholder Shadcn UI bekerja. */}

                  {/* Kita bisa menambahkan SelectItem placeholder dengan value unik yang akan dihandle di handleChange */}
                  <SelectItem value="-placeholder-category-" disabled>Pilih Kategori</SelectItem>
                  {(formData.type === 'pemasukan' ? categories.income : categories.expense).map((cat) => (
                    // Asumsi `cat` dari categories.income/expense tidak akan menjadi string kosong
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount" className="block text-sm font-medium text-gray-700">Jumlah</Label>
              <Input
                type="number"
                name="amount"
                value={String(formData.amount)} // Pastikan string untuk input value
                onChange={(e) => handleChange('amount', Number(e.target.value))} // Parse ke number
                className="mt-1 w-full"
                placeholder="Masukkan jumlah"
              />
            </div>
            <div>
              <Label htmlFor="description" className="block text-sm font-medium text-gray-700">Deskripsi</Label>
              <Input
                type="text"
                name="description"
                value={String(formData.description)} // Pastikan string
                onChange={(e) => handleChange('description', e.target.value)}
                className="mt-1 w-full"
                placeholder="Masukkan deskripsi"
              />
            </div>
            <div>
              <Label htmlFor="date" className="block text-sm font-medium text-gray-700">Tanggal</Label>
              <Input
                type="date"
                name="date"
                value={String(formData.date)} // Pastikan string (YYYY-MM-DD)
                onChange={(e) => handleChange('date', e.target.value)}
                className="mt-1 w-full"
                placeholder="Masukkan tanggal"
              />
            </div>
          </div>
        </div> {/* End flex-grow overflow div */}

        <div className="mt-6 flex justify-end space-x-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-4 py-2"
          >
            Batal
          </Button>
          <Button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            Simpan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialTransactionDialog;