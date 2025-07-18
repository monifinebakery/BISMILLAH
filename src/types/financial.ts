
export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense'; // Sesuaikan dengan nilai aktual di DB: 'pemasukan' | 'pengeluaran'
  category: string | null;     // Sesuai DB is_nullable: YES
  amount?: number;
  description: string | null;  // Sesuai DB is_nullable: YES
  date: Date | null;           // Sesuai DB is_nullable: YES
  createdAt: Date | null;      // Sesuai DB is_nullable: YES
  updatedAt: Date | null;      // <-- DITAMBAHKAN/DIUBAH UNTUK KONSISTENSI DENGAN DB is_nullable: YES
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  currentValue: number;
  purchaseDate: Date; | null; 
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
  createdAt: Date; | null; 
  updatedAt: Date; | null; 
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: Date;
}
