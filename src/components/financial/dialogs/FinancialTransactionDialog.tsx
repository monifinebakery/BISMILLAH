// src/components/financial/dialogs/FinancialTransactionDialog.tsx
// ✅ FIXED: Support both string and object category formats

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
// ✅ UPDATED: Import unified date handler for consistency
import { UnifiedDateHandler } from '@/utils/unifiedDateHandler';
import { formatDateToYYYYMMDD, safeParseDate } from '@/utils/unifiedDateUtils'; // Keep for transition
import { logger } from '@/utils/logger';

// ✅ UPDATED: Support both category formats
interface CategoryObject {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  isDefault: boolean;
}

type CategoryItem = string | CategoryObject;

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
    income: CategoryItem[]; // ✅ Support both string and object
    expense: CategoryItem[];
  };
}

// ✅ UTILITY: Extract category name and id from both formats
const getCategoryInfo = (category: CategoryItem) => {
  if (typeof category === 'string') {
    return { id: category, name: category };
  }
  return { id: category.id, name: category.name };
};

// ✅ UTILITY: Get category color (for future use)
const getCategoryColor = (category: CategoryItem): string => {
  if (typeof category === 'object' && category.color) {
    return category.color;
  }
  return '#6b7280'; // Default gray color
};

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

  // ✅ DEBUG: Log categories to check format
  useEffect(() => {
    if (isOpen && categories) {
      logger.component('FinancialTransactionDialog', 'Categories received:', categories);
      logger.debug('Income categories:', categories.income);
      logger.debug('Expense categories:', categories.expense);
    }
  }, [categories, isOpen]);

  // Initialize form data when dialog opens or transaction changes using UnifiedDateHandler
  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        const dateResult = UnifiedDateHandler.parseDate(transaction.date);
        setFormData({
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          date: dateResult.isValid && dateResult.date ? dateResult.date : new Date(),
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

  // ✅ FIXED: Get current category list and handle both formats
  const getCurrentCategoryList = (): CategoryItem[] => {
    const currentList = formData.type === 'income' ? categories.income : categories.expense;
    return currentList || [];
  };

  const currentCategoryList = getCurrentCategoryList();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent centerMode="overlay" size="md+">
        <div className="dialog-panel dialog-panel-md-plus">
          <DialogHeader className="dialog-header border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl text-gray-900">
                  {transaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {transaction ? 'Perbarui detail transaksi keuangan' : 'Catat transaksi pemasukan atau pengeluaran'}
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="dialog-no-overflow">
            <div className="dialog-body">
              <div className="space-y-4 sm:space-y-6">
                {/* Transaction Type and Amount Row */}
                <div className="dialog-responsive-grid">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium text-overflow-safe">
                      Tipe Transaksi
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: TransactionType) => handleFieldChange('type', value)}
                    >
                      <SelectTrigger id="type" className="w-full input-mobile-safe">
                        <SelectValue placeholder="Pilih tipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                            <span className="text-overflow-safe">Pengeluaran</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="income">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                            <span className="text-overflow-safe">Pemasukan</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm font-medium text-overflow-safe">
                      Jumlah (Rp)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.amount || ''}
                      onChange={(e) => handleFieldChange('amount', parseFloat(e.target.value) || 0)}
                      placeholder="Masukkan jumlah"
                      className="text-right input-mobile-safe"
                      required
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium text-overflow-safe">
                    Kategori
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleFieldChange('category', value)}
                  >
                    <SelectTrigger id="category" className="w-full input-mobile-safe">
                      <SelectValue placeholder="Pilih kategori..." />
                    </SelectTrigger>
                    <SelectContent>
                      {currentCategoryList.length > 0 ? (
                        currentCategoryList.map((categoryItem) => {
                          const { id, name } = getCategoryInfo(categoryItem);
                          const color = getCategoryColor(categoryItem);
                          
                          return (
                            <SelectItem key={id} value={id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full border flex-shrink-0"
                                  style={{ backgroundColor: color }}
                                ></div>
                                <span className="text-overflow-safe truncate">{name}</span>
                              </div>
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="" disabled>
                          <span className="text-overflow-safe">Tidak ada kategori tersedia</span>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-overflow-safe">
                    Deskripsi
                  </Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Contoh: Beli tepung terigu untuk produksi"
                    className="input-mobile-safe"
                    required
                  />
                </div>

                {/* Date and Time Row */}
                <div className="dialog-responsive-grid">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-medium text-overflow-safe">
                      Tanggal
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formatDateToYYYYMMDD(formData.date)}
                      onChange={(e) => {
                        const newDate = new Date(e.target.value);
                        // Preserve existing time when changing date
                        const currentTime = formData.date;
                        if (currentTime) {
                          newDate.setHours(currentTime.getHours());
                          newDate.setMinutes(currentTime.getMinutes());
                        }
                        handleFieldChange('date', newDate);
                      }}
                      className="input-mobile-safe"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-sm font-medium text-overflow-safe">
                      Waktu (opsional)
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.date ? 
                        `${String(formData.date.getHours()).padStart(2, '0')}:${String(formData.date.getMinutes()).padStart(2, '0')}` 
                        : ''
                      }
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':').map(Number);
                        const newDate = new Date(formData.date);
                        newDate.setHours(hours || 0);
                        newDate.setMinutes(minutes || 0);
                        newDate.setSeconds(0);
                        handleFieldChange('date', newDate);
                      }}
                      placeholder="HH:MM"
                      className="input-mobile-safe"
                    />
                    <p className="text-xs text-gray-500 mt-1 text-overflow-safe">
                      Kosongkan untuk waktu saat ini
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="dialog-footer">
              <div className="dialog-responsive-buttons">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="input-mobile-safe"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="input-mobile-safe"
                >
                  <span className="text-overflow-safe">
                    {isSubmitting ? 'Menyimpan...' : (transaction ? 'Perbarui' : 'Simpan')}
                  </span>
                </Button>
              </div>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialTransactionDialog;