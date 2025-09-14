import { describe, it, expect, beforeEach, beforeAll, mock } from 'bun:test';

// In-memory database simulation
const purchaseId = 'p1';
const userId = 'user1';

const db: any = {
  purchases: {
    [purchaseId]: {
      id: purchaseId,
      user_id: userId,
      status: 'pending',
      items: [
        {
          bahanBakuId: 'item1',
          quantity: 100,
          unitPrice: 2000,
          subtotal: 200000
        }
      ]
    }
  },
  warehouse: {
    item1: { id: 'item1', stok: 100, hargaRataRata: 1000 }
  }
};

// Supabase mock handling basic operations
mock.module('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: (table: string) => ({
        select: () => ({
          eq: (_col: string, val: any) => ({
            eq: (_col2: string, _val2: any) => ({
              single: () => {
                if (table === 'purchases') {
                  return Promise.resolve({ data: (db.purchases as any)[val], error: null });
                }
                if (table === 'bahan_baku') {
                  const item = (db.warehouse as any)[val];
                  if (!item) return Promise.resolve({ data: null, error: { message: 'not found' } });
                  return Promise.resolve({
                    data: {
                      id: item.id,
                      stok: item.stok,
                      harga_rata_rata: item.hargaRataRata,
                      harga_satuan: item.hargaSatuan ?? item.hargaRataRata
                    },
                    error: null
                  });
                }
                return Promise.resolve({ data: null, error: null });
              }
            })
          })
        }),
        update: (payload: any) => ({
          eq: (_col: string, val: any) => ({
            eq: (_col2: string, _val2: any) => {
              if (table === 'purchases') {
                const purchase = (db.purchases as any)[val];
                if (purchase) purchase.status = payload.status;
              } else if (table === 'bahan_baku') {
                const wh = (db.warehouse as any)[val];
                if (wh) {
                  if (typeof payload.stok === 'number') wh.stok = payload.stok;
                  if (typeof payload.harga_rata_rata === 'number') wh.hargaRataRata = payload.harga_rata_rata;
                  if (typeof payload.harga_satuan === 'number') wh.hargaSatuan = payload.harga_satuan;
                }
              }
              return Promise.resolve({ data: null, error: null });
            }
          })
        }),
        insert: (payload: any) => {
          if (table === 'purchases') {
            const newId = `p${Object.keys(db.purchases).length + 1}`;
            db.purchases[newId] = {
              id: newId,
              user_id: payload.user_id,
              status: payload.status,
              items: payload.items
            };
            return {
              select: () => ({
                single: () => Promise.resolve({ data: { id: newId }, error: null })
              })
            };
          }
          if (table === 'bahan_baku') {
            (db.warehouse as any)[payload.id] = {
              id: payload.id,
              stok: payload.stok,
              hargaRataRata: payload.harga_rata_rata,
              hargaSatuan: payload.harga_satuan
            };
            return Promise.resolve({ data: null, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        }
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
    db.purchases = {
      [purchaseId]: {
        id: purchaseId,
        user_id: userId,
        status: 'pending',
        items: [
          {
            bahanBakuId: 'item1',
            quantity: 100,
            unitPrice: 2000,
            subtotal: 200000
          }
        ]
      }
    };
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

  it('multiple completed purchases should accumulate stock and WAC', async () => {
    await PurchaseApiService.completePurchase(purchaseId, userId);
    await PurchaseApiService.createPurchase(
      {
        supplier: '',
        tanggal: new Date(),
        total_nilai: 150000,
        items: [
          {
            bahanBakuId: 'item1',
            quantity: 50,
            unitPrice: 3000,
            subtotal: 150000
          }
        ],
        status: 'completed',
        metode_perhitungan: 'AVERAGE'
      },
      userId
    );

    expect(db.warehouse.item1.stok).toBe(250);
    expect(db.warehouse.item1.hargaRataRata).toBe(1800);
  });
});

