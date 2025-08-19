import { describe, it, expect, beforeEach, beforeAll, mock } from 'bun:test';

// In-memory database simulation
const purchaseId = 'p1';
const userId = 'user1';

const db = {
  purchases: {
    [purchaseId]: {
      id: purchaseId,
      user_id: userId,
      status: 'pending',
      items: [
        {
          bahanBakuId: 'item1',
          kuantitas: 100,
          hargaSatuan: 2000,
          subtotal: 200000,
          prev: { stok: 0, wac: 0 }
        }
      ]
    }
  },
  warehouse: {
    item1: { id: 'item1', stok: 100, hargaRataRata: 1000 }
  }
};

function applyUpdate(table: string, payload: any, filters: Record<string, any>) {
  if (table !== 'purchases') return;
  const id = filters.id;
  const purchase = (db.purchases as any)[id];
  if (!purchase) return;

  if (payload.status === 'completed' && purchase.status !== 'completed') {
    purchase.status = 'completed';
    purchase.items.forEach((item: any) => {
      const wh = (db.warehouse as any)[item.bahanBakuId];
      item.prev = { stok: wh.stok, wac: wh.hargaRataRata };
      const newStock = wh.stok + item.kuantitas;
      const newWac = ((wh.stok * wh.hargaRataRata) + (item.kuantitas * item.hargaSatuan)) / newStock;
      wh.stok = newStock;
      wh.hargaRataRata = newWac;
    });
  }

  if (payload.status === 'pending' && purchase.status === 'completed') {
    purchase.status = 'pending';
    purchase.items.forEach((item: any) => {
      const wh = (db.warehouse as any)[item.bahanBakuId];
      wh.stok = item.prev.stok;
      wh.hargaRataRata = item.prev.wac;
    });
  }
}

mock.module('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: (table: string) => ({
        update: (payload: any) => ({
          eq: (col: string, val: any) => ({
            eq: (col2: string, val2: any) => {
              applyUpdate(table, payload, { [col]: val, [col2]: val2 });
              return Promise.resolve({ data: null, error: null });
            }
          })
        })
      })
    }
  };
});

let PurchaseApiService: typeof import('../services/purchaseApi').PurchaseApiService;

beforeAll(async () => {
  ({ PurchaseApiService } = await import('../services/purchaseApi'));
});

describe('Purchase-Warehouse Sync', () => {
  beforeEach(() => {
    db.purchases[purchaseId].status = 'pending';
    db.warehouse.item1.stok = 100;
    db.warehouse.item1.hargaRataRata = 1000;
  });

  it('completePurchase should increase stock and update WAC', async () => {
    await PurchaseApiService.completePurchase(purchaseId, userId);
    expect(db.warehouse.item1.stok).toBe(200);
    expect(db.warehouse.item1.hargaRataRata).toBe(1500);
  });

  it("setPurchaseStatus to 'pending' after completion should revert stock and WAC", async () => {
    await PurchaseApiService.completePurchase(purchaseId, userId);
    await PurchaseApiService.setPurchaseStatus(purchaseId, userId, 'pending');
    expect(db.warehouse.item1.stok).toBe(100);
    expect(db.warehouse.item1.hargaRataRata).toBe(1000);
  });
});
