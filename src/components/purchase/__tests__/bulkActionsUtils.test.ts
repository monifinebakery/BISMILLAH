import { describe, it, expect, mock } from 'bun:test';
import type { Purchase } from '../types/purchase.types';

mock.module('@/types', () => ({
  PURCHASE_STATUS_CONFIG: {
    pending: { label: 'Pending', color: '', icon: '' },
    completed: { label: 'Completed', color: '', icon: '' },
    cancelled: { label: 'Cancelled', color: '', icon: '' },
  }
}));

const { exportPurchasesToCSV, generatePurchasePrintContent, markPurchasesAsArchived } = await import('@/utils/purchaseHelpers');

describe('Purchase bulk action helpers', () => {
  const suppliers = [{ id: 's1', nama: 'Supplier A' }];
  const basePurchase: Omit<Purchase, 'id'> = {
    userId: 'u1',
    supplier: 's1',
    tanggal: new Date('2024-01-01'),
    totalNilai: 1000,
    items: [],
    status: 'pending',
    metodePerhitungan: 'AVERAGE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isArchived: false,
  };

  const purchases: Purchase[] = [
    { ...basePurchase, id: 'p1' },
    { ...basePurchase, id: 'p2', totalNilai: 2000 },
  ];

  it('dapat mengekspor pembelian ke CSV', () => {
    const csv = exportPurchasesToCSV(purchases, suppliers);
    expect(csv).toContain('ID');
    expect(csv).toContain('Supplier A');
  });

  it('dapat menghasilkan konten cetak', () => {
    const text = generatePurchasePrintContent(purchases, suppliers);
    expect(text).toContain('Supplier: Supplier A');
    expect(text.split('\n').length).toBe(2);
  });

  it('dapat menandai pembelian sebagai arsip', () => {
    const updated = markPurchasesAsArchived(purchases, ['p1']);
    expect(updated.find(p => p.id === 'p1')?.isArchived).toBe(true);
    expect(updated.find(p => p.id === 'p2')?.isArchived).toBe(false);
  });
});
