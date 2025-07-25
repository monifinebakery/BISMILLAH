import { Purchase } from '@/types/supplier';
import { safeParseDate } from '@/utils/unifiedDateUtils';

/**
 * Transform purchase data from database format to application format
 */
export const transformPurchaseFromDB = (dbItem: any): Purchase => ({
  id: dbItem.id,
  supplier: dbItem.supplier,
  totalNilai: Number(dbItem.total_nilai) || 0,
  tanggal: safeParseDate(dbItem.tanggal),
  items: dbItem.items || [],
  userId: dbItem.user_id,
  createdAt: safeParseDate(dbItem.created_at),
  updatedAt: safeParseDate(dbItem.updated_at),
  status: dbItem.status,
  metodePerhitungan: dbItem.metode_perhitungan || 'FIFO',
});

/**
 * Transform purchase data from application format to database format
 */
export const transformPurchaseToDB = (purchase: Partial<Purchase>, userId: string) => {
  const dbData: any = {
    user_id: userId,
    updated_at: new Date().toISOString()
  };

  if (purchase.supplier !== undefined) dbData.supplier = purchase.supplier;
  if (purchase.totalNilai !== undefined) dbData.total_nilai = purchase.totalNilai;
  if (purchase.tanggal !== undefined) {
    dbData.tanggal = purchase.tanggal instanceof Date 
      ? purchase.tanggal.toISOString() 
      : purchase.tanggal;
  }
  if (purchase.items !== undefined) dbData.items = purchase.items;
  if (purchase.status !== undefined) dbData.status = purchase.status;
  if (purchase.metodePerhitungan !== undefined) dbData.metode_perhitungan = purchase.metodePerhitungan;

  return dbData;
};

/**
 * Transform multiple purchases from DB
 */
export const transformPurchasesFromDB = (dbItems: any[]): Purchase[] => {
  return dbItems.map(transformPurchaseFromDB);
};

/**
 * Get status display text in Indonesian
 */
export const getStatusDisplayText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'pending': 'Menunggu',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan'
  };
  return statusMap[status] || status;
};

/**
 * Get status color class for UI
 */
export const getStatusColorClass = (status: string): string => {
  const colorMap: { [key: string]: string } = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Transform supplier name helper
 */
export const getSupplierName = (supplierId: string, suppliers: any[]): string => {
  const supplier = suppliers.find(s => s.id === supplierId);
  return supplier?.nama || 'Supplier tidak ditemukan';
};

/**
 * Calculate total items count in purchase
 */
export const calculateTotalItems = (purchase: Purchase): number => {
  return purchase.items?.reduce((total, item) => total + (item.jumlah || 0), 0) || 0;
};

/**
 * Format purchase summary for notifications
 */
export const formatPurchaseSummary = (purchase: Purchase, suppliers: any[]) => {
  const supplierName = getSupplierName(purchase.supplier, suppliers);
  const itemCount = purchase.items?.length || 0;
  
  return {
    supplierName,
    itemCount,
    totalValue: purchase.totalNilai,
    statusText: getStatusDisplayText(purchase.status)
  };
};