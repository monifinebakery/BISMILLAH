import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea'; // Perbaikan sintaks import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";
import { safeParseDate } from '@/utils/dateUtils'; // safeParseDate dari utils
import { formatDateToYYYYMMDD } from '@/utils/dateUtils'; // formatDateToYYYYMMDD dari utils

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

  // Helper function to safely render values in inputs as string or number
  const getInputValue = <T extends string | number | Date | null | undefined>(value: T): string | number => {
    if (value === null || value === undefined) {
      return '';
    }
    // Jika itu objek Date, konversi ke YYYY-MM-DD
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        return ''; // Tanggal tidak valid, kembalikan string kosong
      }
      const isoString = value.toISOString() || '';
      return isoString.split('T')[0];
    }
    if (typeof value !== 'string' && typeof value !== 'number') {
      return '';
    }
    return value;
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
        date: formatDateToYYYYMMDD(new Date()), // Pastikan inisialisasi juga melalui formatDateToYYYYMMDD agar konsisten
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

  const handleSave = async () => {
    if (
      !formData.category.trim() ||
      formData.amount <= 0 ||
      !formData.description.trim() ||
      !formData.date // Pastikan string tanggal tidak kosong
    ) {
      toast.error('Kategori, jumlah, deskripsi, dan tanggal wajib diisi, jumlah harus lebih dari 0.');
      return;
    }

    const { supabase } = await import('@/integrations/supabase/client'); // Dynamic import untuk supabase
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id || '';

    // MODIFIED: Pastikan objek Date dibuat dengan aman
    const dateToSave = formData.date ? safeParseDate(formData.date) : null; // Gunakan safeParseDate

    if (dateToSave === null) { // Validasi jika safeParseDate mengembalikan null
      toast.error('Tanggal yang dimasukkan tidak valid.');
      return;
    }

    const transactionData = {
      user_id: userId,
      type: formData.type,
      category: formData.category,
      amount: Number(formData.amount),
      description: formData.description,
      date: dateToSave, // Gunakan objek Date yang sudah divalidasi
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
                value={getInputValue(formData.type) as string}
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
                value={getInputValue(formData.category) as string}
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
                value={getInputValue(formData.amount)}
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
                value={getInputValue(formData.description)}
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
                value={formatDateToYYYYMMDD(formData.date)} // Pastikan formatDateToYYYYMMDD menerima string/Date
                onChange={(e) => handleChange('date', e.target.value)}
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