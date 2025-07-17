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
  onAddTransaction: (transaction: FinancialTransaction) => Promise<boolean>;
  categories: { income: string[]; expense: string[] };
}

interface FinancialTransaction {
  user_id: string;
  type: 'pemasukan' | 'pengeluaran';
  category: string;
  amount: number;
  description: string;
  date: string; // Stored as ISO string
}

const FinancialTransactionDialog: React.FC<FinancialTransactionDialogProps> = ({ 
  isOpen, 
  onClose, 
  onAddTransaction, 
  categories 
}) => {
  const [formData, setFormData] = useState<FinancialTransaction>({
    user_id: '',
    type: 'pemasukan',
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString(),
  });

  const [isLoading, setIsLoading] = useState(false);

  // Helper function to safely format values for inputs
  const getInputValue = (value: string | number | Date): string | number => {
    if (value instanceof Date) {
      // Handle invalid dates
      if (isNaN(value.getTime())) return '';
      
      try {
        return value.toISOString().split('T')[0];
      } catch {
        return '';
      }
    }
    return value;
  };

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        user_id: '',
        type: 'pemasukan',
        category: '',
        amount: 0,
        description: '',
        date: new Date().toISOString(),
      });
    }
  }, [isOpen]);

  const handleChange = (name: keyof FinancialTransaction, value: string | number) => {
    if (name === 'category' && (value === "" || value === "-placeholder-category-")) {
      setFormData(prev => ({ ...prev, [name]: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.category.trim()) {
      toast.error('Kategori harus diisi');
      return;
    }

    if (formData.amount <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Deskripsi harus diisi');
      return;
    }

    // Date validation
    let transactionDate: Date;
    try {
      transactionDate = new Date(formData.date);
      if (isNaN(transactionDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch {
      toast.error('Tanggal tidak valid');
      return;
    }

    setIsLoading(true);

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user.id) {
        throw new Error('User not authenticated');
      }

      const transactionData: FinancialTransaction = {
        ...formData,
        user_id: session.user.id,
        date: transactionDate.toISOString(),
      };

      const success = await onAddTransaction(transactionData);
      
      if (success) {
        toast.success('Transaksi berhasil ditambahkan!');
        onClose();
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Gagal menambahkan transaksi');
    } finally {
      setIsLoading(false);
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
            {/* Transaction Type */}
            <div>
              <Label htmlFor="type">Tipe Transaksi</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'pemasukan' | 'pengeluaran') => 
                  handleChange('type', value)
                }
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

            {/* Category */}
            <div>
              <Label htmlFor="category">Kategori</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange('category', value)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-placeholder-category-" disabled>
                    Pilih Kategori
                  </SelectItem>
                  {(formData.type === 'pemasukan' ? categories.income : categories.expense).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount">Jumlah</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange('amount', Number(e.target.value))}
                className="mt-1 w-full"
                placeholder="Masukkan jumlah"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="mt-1 w-full"
                placeholder="Masukkan deskripsi"
                rows={3}
              />
            </div>

            {/* Date */}
            <div>
              <Label htmlFor="date">Tanggal</Label>
              <Input
                type="date"
                value={getInputValue(new Date(formData.date)) as string}
                onChange={(e) => handleChange('date', e.target.value)}
                className="mt-1 w-full"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end space-x-4">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialTransactionDialog;