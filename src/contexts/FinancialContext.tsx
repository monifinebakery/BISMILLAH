// src/contexts/FinancialContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FinancialTransaction } from '@/types/financial'; // Pastikan path ke tipe data Anda benar
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateUUID } from '@/utils/uuid';
import { toSafeISOString, safeParseDate } from '@/utils/dateUtils';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';

// --- INTERFACE & CONTEXT ---
interface FinancialContextType {
  financialTransactions: FinancialTransaction[];
  addFinancialTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'userId' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateFinancialTransaction: (id: string, transaction: Partial<FinancialTransaction>) => Promise<boolean>;
  deleteFinancialTransaction: (id: string) => Promise<boolean>;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// --- CONSTANTS ---
const STORAGE_KEY = 'hpp_app_financial_transactions';

// --- PROVIDER COMPONENT ---
export const FinancialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- LOCAL STATE ---
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);

  // --- DEPENDENCY HOOKS ---
  const { session } = useAuth();
  const { addActivity } = useActivity();

  // --- LOAD & SAVE EFFECTS ---
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored).map((item: any) => ({
          ...item,
          date: safeParseDate(item.date),
          created_at: safeParseDate(item.created_at),
          updated_at: safeParseDate(item.updated_at),
        }));
        setFinancialTransactions(parsed);
      }
    } catch (error) {
      console.error("Gagal memuat transaksi keuangan dari localStorage:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(financialTransactions));
  }, [financialTransactions]);

  // --- FUNCTIONS ---
  const addFinancialTransaction = async (transaction: Omit<FinancialTransaction, 'id' | 'userId' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    if (!session) {
        toast.error("Anda harus login untuk menambah transaksi");
        return false;
    }
    const newTransaction: FinancialTransaction = {
      ...transaction,
      id: generateUUID(),
      userId: session.user.id,
      date: transaction.date || new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    // ... Logika insert ke Supabase ...

    setFinancialTransactions(prev => [...prev, newTransaction].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0)));
    addActivity({
      title: 'Transaksi Keuangan Ditambahkan',
      description: `${newTransaction.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'} Rp ${newTransaction.amount.toLocaleString('id-ID')}`,
      type: 'keuangan',
      value: null,
    });
    toast.success('Transaksi keuangan berhasil ditambahkan!');
    return true;
  };

  const updateFinancialTransaction = async (id: string, updatedTransaction: Partial<FinancialTransaction>): Promise<boolean> => {
    if (!session) {
        toast.error("Anda harus login untuk memperbarui transaksi");
        return false;
    }
    // ... Implementasi lengkap sama seperti di AppDataContext asli ...
    setFinancialTransactions(prev => prev.map(t => (t.id === id ? { ...t, ...updatedTransaction, updated_at: new Date() } : t)));
    toast.success('Transaksi keuangan berhasil diperbarui!');
    return true;
  };

  const deleteFinancialTransaction = async (id: string): Promise<boolean> => {
    if (!session) {
        toast.error("Anda harus login untuk menghapus transaksi");
        return false;
    }
    const transaction = financialTransactions.find(t => t.id === id);
    // ... Logika delete dari Supabase ...

    setFinancialTransactions(prev => prev.filter(t => t.id !== id));
    if (transaction) {
      addActivity({
        title: 'Transaksi Keuangan Dihapus',
        description: `${transaction.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'} Rp ${(transaction.amount ?? 0).toLocaleString('id-ID')} dihapus`,
        type: 'keuangan',
        value: null,
      });
      toast.success('Transaksi keuangan berhasil dihapus!');
    }
    return true;
  };

  const value: FinancialContextType = {
    financialTransactions,
    addFinancialTransaction,
    updateFinancialTransaction,
    deleteFinancialTransaction,
  };

  return <FinancialContext.Provider value={value}>{children}</FinancialContext.Provider>;
};

// --- CUSTOM HOOK ---
export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};