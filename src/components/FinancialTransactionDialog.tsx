import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } => { /* ... */ }; // Tambahkan Textarea jika dibutuhkan, ada di import list
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";

interface FinancialTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: any) => Promise<boolean>;
  categories: { income: string[]; expense: string[] };
}

const FinancialTransactionDialog: React.FC<FinancialTransactionDialogProps> = ({ isOpen, onClose, onAddTransaction, categories }) => {
  const [formData, setFormData] = useState({
    user_id: '',
    type: 'pemasukan' as 'pemasukan' | 'pengeluaran',
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD string awal
  });

  // MODIFIED: getInputValue helper function (sekarang sebagai formatDateForInput, lebih spesifik)
  // Nama fungsinya diubah untuk kejelasan agar fokus pada formatting input tanggal
  const formatDateForInput = (date: Date | string | null | undefined): string => {
    try {
      // Jika nilai null/undefined/string kosong, kembalikan string kosong
      if (date === null || date === undefined || date === '') {
        return '';
      }

      let dateObj: Date;
      // Jika sudah objek Date, gunakan langsung
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        // Coba parse string ke Date
        dateObj = new Date(date);
      } else {
        // Tangani tipe yang tidak terduga
        console.warn('formatDateForInput received unexpected type:', typeof date, date);
        return '';
      }

      // Pastikan objek Date yang dihasilkan valid
      if (isNaN(dateObj.getTime())) {
        return ''; // Tanggal tidak valid (misalnya dari string "invalid date"), kembalikan string kosong
      }

      // Dapatkan string ISO, lalu pastikan itu adalah string sebelum di-split
      const isoString = dateObj.toISOString();
      if (typeof isoString !== 'string' || isoString === null || isoString === undefined || isoString.trim() === '') {
          console.warn('toISOString() returned non-string or empty:', isoString);
          return ''; // Jika toISOString entah bagaimana gagal atau mengembalikan string kosong/null/undefined
      }

      return isoString.split('T')[0]; // Ambil bagian YYYY-MM-DD
    } catch (error) {
      console.error('Error formatting date for input (caught):', error, date);
      return ''; // Jika ada error di tengah jalan, kembalikan string kosong
    }
  };


  // useEffect untuk mereset form saat dialog dibuka/ditutup
  useEffect(() => {
    if (isOpen) {
      setFormData({
        user_id: '',
        type: 'pemasukan',
        category: '',
        amount: 0,
        description: '',
        date: formatDateForInput(new Date()), // MODIFIED: Gunakan formatDateForInput
      });
    }
  }, [isOpen]);

  const handleChange = (name: string, value: string | number) => {
    if (name === 'category' && (value === "" || value === "-placeholder-category-")) {
      setFormData(prev => ({ ...prev, [name]: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (value: string) => { // Fungsi ini menerima string YYYY-MM-DD dari Input
    // Simpan string YYYY-MM-DD langsung ke state
    setFormData(prev => ({ ...prev, date: value }));
  };


  const handleSave = async () => {
    // Validasi
    if (
      !formData.category.trim() ||
      formData.amount <= 0 ||
      !formData.description.trim() ||
      !formData.date // formData.date adalah string YYYY-MM-DD
    ) {
      toast.error('Kategori, jumlah, deskripsi, dan tanggal wajib diisi, jumlah harus lebih dari 0.');
      return;
    }

    // Validasi tanggal lebih ketat sebelum dikirim ke onAddTransaction
    let finalDate: Date;
    try {
      const parsedDate = new Date(formData.date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Tanggal tidak valid');
      }
      finalDate = parsedDate;
    } catch (error) {
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
      amount: Number(formData.amount),
      date: finalDate.toISOString(), // Kirim sebagai ISO string ke onAddTransaction
    };

    const success = await onAddTransaction(transactionData);
    if (success) {
      onClose();
      toast.success('Transaksi berhasil ditambahkan!');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md font-inter flex flex-col h-[90vh] md:h-auto md:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Tambah Transaksi Keuangan</DialogTitle>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-4 -mr-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipe Transaksi</Label>
              <Select
                name="type"
                value={formatDateForInput(formData.type) as string} // MODIFIED: Gunakan formatDateForInput
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
                value={formatDateForInput(formData.category) as string} // MODIFIED: Gunakan formatDateForInput
                onValueChange={(value) => handleChange('category', value)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-placeholder-category-" disabled>Pilih Kategori</SelectItem>
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
                value={formatDateForInput(formData.amount)} // MODIFIED: Gunakan formatDateForInput
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
                value={formatDateForInput(formData.description)} // MODIFIED: Gunakan formatDateForInput
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
                value={formatDateForInput(formData.date)} // MODIFIED: Gunakan formatDateForInput
                onChange={(e) => handleDateChange(e.target.value)}
                className="mt-1 w-full"
                placeholder="Masukkan tanggal"
              />
            </div>
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