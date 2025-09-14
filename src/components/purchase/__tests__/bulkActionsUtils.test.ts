import { describe, it, expect, mock } from 'bun:test';
import type { Purchase } from '../types/purchase.types';

mock.module('@/types', () => ({
  PURCHASE_STATUS_CONFIG: {
    pending: { label: 'Pending', color: '', icon: '' },
    completed: { label: 'Completed', color: '', icon: '' },
    cancelled: { label: 'Cancelled', color: '', icon: '' },
  }
}));

const { exportPurchasesToCSV, generatePurchasePrintContent } = await import('@/utils/purchaseHelpers');

describe('Purchase bulk action helpers', () => {
  const suppliers = [{ id: 's1', nama: 'Supplier A' }];
  const basePurchase: Omit<Purchase, 'id'> = {
    userId: 'u1',
    supplier: 's1',
    tanggal: new Date('2024-01-01'),
    total_nilai: 1000,
    items: [],
    status: 'pending',
    metode_perhitungan: 'AVERAGE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const purchases: Purchase[] = [
    { ...basePurchase, id: 'p1' },
    { ...basePurchase, id: 'p2', total_nilai: 2000 },
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

});
