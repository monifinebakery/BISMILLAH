// src/components/financial/dialogs/FinancialTransactionDialog.tsx
// Modular and Clean Transaction Dialog

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatDateToYYYYMMDD, safeParseDate } from '@/utils/unifiedDateUtils';

// Types
export type TransactionType = 'income' | 'expense';

interface Transaction {
  id?: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: Date;
}

interface FinancialTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<boolean>;
  onUpdateTransaction?: (id: string, transaction: Partial<Transaction>) => Promise<boolean>;
  transaction?: Transaction | null;
  categories?: {
    income: string[];
    expense: string[];
  };
}

// Default form state
const getInitialFormState = (): Omit<Transaction, 'id'> => ({
  type: 'expense',
  amount: 0,
  category: '',
  description: '',
  date: new Date(),
});

// Form validation
const validateForm = (formData: Omit<Transaction, 'id'>): string | null => {
  if (formData.amount <= 0) {
    return "Jumlah transaksi harus lebih dari 0.";
  }
  if (!formData.category.trim()) {
    return "Kategori wajib dipilih.";
  }
  if (!formData.description.trim()) {
    return "Deskripsi tidak boleh kosong.";
  }
  return null;
};

const FinancialTransactionDialog: React.FC<FinancialTransactionDialogProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  onUpdateTransaction,
  transaction,
  categories = { income: [], expense: [] }
}) => {
  const [formData, setFormData] = useState<Omit<Transaction, 'id'>>(getInitialFormState());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when dialog opens or transaction changes
  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        setFormData({
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date ? safeParseDate(transaction.date) || new Date() : new Date(),
        });
      } else {
        setFormData(getInitialFormState());
      }
    }
  }, [transaction, isOpen]);

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof typeof formData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Reset category when type changes
      if (field === 'type') {
        newData.category = '';
      }
      return newData;
    });
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationError = validateForm(formData);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      let success = false;
      
      if (transaction && onUpdateTransaction) {
        // Update existing transaction
        success = await onUpdateTransaction(transaction.id!, formData);
      } else {
        // Create new transaction
        success = await onAddTransaction(formData);
      }

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Transaction submission error:', error);
      toast.error('Terjadi kesalahan saat menyimpan transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current category list based on transaction type
  const currentCategoryList = formData.type === 'income' ? categories.income : categories.expense;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Transaction Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Tipe</Label>
              <Select
                value={formData.type}
                onValueChange={(value: TransactionType) => handleFieldChange('type', value)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                  <SelectItem value="income">Pemasukan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount">Jumlah (Rp)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="1000"
                value={formData.amount}
                onChange={(e) => handleFieldChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="0"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Kategori</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleFieldChange('category', value)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Pilih kategori..." />
              </SelectTrigger>
              <SelectContent>
                {currentCategoryList.length > 0 ? (
                  currentCategoryList.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    Tidak ada kategori tersedia
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Contoh: Beli Tepung Terigu"
              required
            />
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="date">Tanggal</Label>
            <Input
              id="date"
              type="date"
              value={formatDateToYYYYMMDD(formData.date)}
              onChange={(e) => handleFieldChange('date', new Date(e.target.value))}
              required
            />
          </div>

          {/* Footer */}
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialTransactionDialog;