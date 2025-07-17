import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea }area from '@/components/ui/textarea'; // Tambahkan Textarea jika dibutuhkan, ada di import list
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'; // Hapus jika tidak digunakan
// import { Plus, X } from 'lucide-react'; // Hapus jika tidak digunakan
import { toast } from "sonner";

interface FinancialTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: any) => Promise<boolean>;
  categories: { income: string[]; expense: string[] };
}

const FinancialTransactionDialog: React.FC<FinancialTransactionDialogProps> = ({ isOpen, onClose, onAddTransaction, categories }) => {
  const [formData, setFormData] = useState({
    user_id: '', // Ini akan diisi saat handleSave
    type: 'pemasukan' as 'pemasukan' | 'pengeluaran',
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD string
  });

  // MODIFIED: useEffect untuk mereset form saat dialog dibuka/ditutup
  useEffect(() => {
    if (isOpen) {
      setFormData({
        user_id: '', // Akan diisi saat handleSave
        type: 'pemasukan',
        category: '',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [isOpen]);


  const handleChange = (name: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.category || formData.amount <= 0 || !formData.description || !formData.date) {
      toast.error('Kategori, jumlah, deskripsi, dan tanggal wajib diisi, jumlah harus lebih dari 0.');
      return;
    }

    const { supabase } = await import('@/integrations/supabase/client'); // Dynamic import
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id || '';

    const transactionData = {
      user_id: userId,
      type: formData.type,
      category: formData.category,
      amount: parseFloat(formData.amount.toString()), // Pastikan ini number
      description: formData.description,
      date: new Date(formData.date), // Konversi string tanggal ke Date object
    };

    const success = await onAddTransaction(transactionData);
    if (success) {
      onClose(); // Tutup dialog setelah berhasil
      // Tidak perlu reset formData di sini, karena useEffect di atas akan meresetnya saat isOpen berubah
      toast.success('Transaksi berhasil ditambahkan!');
    }
  };

  // MODIFIED: Bungkus DialogContent dengan Dialog dan hapus conditional return null
  return (
    <Dialog open={isOpen} onOpenChange={onClose}> {/* Controlled by isOpen and onClose props */}
      <DialogContent className="max-w-md"> {/* Tidak ada perubahan kelas di sini sesuai instruksi terakhir */}
        <DialogHeader>
          <DialogTitle>Tambah Transaksi Keuangan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipe Transaksi</Label>
            <Select name="type" value={formData.type} onValueChange={(value: 'pemasukan' | 'pengeluaran') => handleChange('type', value)}>
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
            <Select name="category" value={formData.category} onValueChange={(value) => handleChange('category', value)}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Pilih Kategori</SelectItem>
                {(formData.type === 'pemasukan' ? categories.income : categories.expense).map((cat) => (
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
              value={formData.amount}
              // MODIFIED: Konversi e.target.value menjadi Number secara eksplisit
              onChange={(e) => handleChange('amount', Number(e.target.value))}
              className="mt-1 w-full"
              placeholder="Masukkan jumlah"
            />
          </div>
          <div>
            <Label htmlFor="description" className="block text-sm font-medium text-gray-700">Deskripsi</Label>
            <Input
              type="text"
              name="description"
              value={formData.description}
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
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="mt-1 w-full"
              placeholder="Masukkan tanggal"
            />
          </div>
        </div>
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