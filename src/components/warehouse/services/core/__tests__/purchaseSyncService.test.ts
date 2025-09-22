import { describe, it, expect, beforeEach, beforeAll, mock } from 'bun:test';

interface WarehouseRow {
  id: string;
  user_id: string;
  nama: string;
  satuan: string;
  stok: number;
  harga_rata_rata: number;
  harga_satuan: number;
  supplier?: string;
  created_at?: string;
  updated_at?: string;
}

type Filter = {
  type: 'eq' | 'ilike';
  column: string;
  value: any;
};

const warehouseTable = new Map<string, WarehouseRow>();

mock.module('@/integrations/supabase/client', () => {
  const tableData = {
    bahan_baku: warehouseTable,
  } as const;

  const filterRows = (table: keyof typeof tableData, filters: Filter[]) => {
    const rows = Array.from(tableData[table].values());
    return rows.filter(row =>
      filters.every(filter => {
        const rowValue = (row as any)[filter.column];
        if (filter.type === 'eq') {
          return rowValue === filter.value;
        }
        if (filter.type === 'ilike') {
          if (typeof rowValue !== 'string') return false;
          const pattern = String(filter.value ?? '').toLowerCase();
          const sanitized = pattern.replace(/%/g, '');
          return rowValue.toLowerCase().includes(sanitized);
        }
        return false;
      })
    );
  };

  return {
    supabase: {
      from(table: keyof typeof tableData) {
        if (!tableData[table]) {
          throw new Error(`Unknown table ${String(table)}`);
        }

        return {
          select: (_columns?: string) => {
            const filters: Filter[] = [];
            const builder: any = {
              eq(column: string, value: any) {
                filters.push({ type: 'eq', column, value });
                return builder;
              },
              ilike(column: string, value: string) {
                filters.push({ type: 'ilike', column, value });
                const rows = filterRows(table, filters);
                return Promise.resolve({ data: rows, error: null });
              },
              maybeSingle: async () => {
                const rows = filterRows(table, filters);
                return { data: rows[0] ?? null, error: null };
              },
              single: async () => {
                const rows = filterRows(table, filters);
                return { data: rows[0] ?? null, error: null };
              },
              limit: () => builder,
              order: () => builder,
            };
            return builder;
          },
          update: (payload: any) => {
            const filters: Filter[] = [];
            const builder: any = {
              eq(column: string, value: any) {
                filters.push({ type: 'eq', column, value });
                return builder;
              },
              select: () => ({
                single: async () => {
                  const rows = filterRows(table, filters);
                  const target = rows[0];
                  if (!target) {
                    return { data: null, error: { message: 'not found' } };
                  }
                  Object.assign(target, payload);
                  return { data: { ...target }, error: null };
                },
              }),
            };
            return builder;
          },
          insert: (payload: any) => ({
            select: (_columns?: string) => ({
              single: async () => {
                const value = Array.isArray(payload) ? payload[0] : { ...payload };
                if (!value.id) {
                  value.id = `generated-${tableData[table].size + 1}`;
                }
                tableData[table].set(value.id, value);
                return { data: { id: value.id }, error: null };
              },
            }),
          }),
        };
      },
    },
  };
});

let applyPurchaseToWarehouse: typeof import('../purchaseSyncService').applyPurchaseToWarehouse;

beforeAll(async () => {
  ({ applyPurchaseToWarehouse } = await import('../purchaseSyncService'));
});

beforeEach(() => {
  warehouseTable.clear();
  warehouseTable.set('mat-1', {
    id: 'mat-1',
    user_id: 'user-1',
    nama: 'Gula Pasir',
    satuan: 'kg',
    stok: 10,
    harga_rata_rata: 2000,
    harga_satuan: 2000,
    supplier: 'Supplier A',
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  });
});

describe('applyPurchaseToWarehouse', () => {
  it('menambah stok ketika namaBarang digunakan sebagai fallback nama', async () => {
    const purchase = {
      id: 'purchase-1',
      userId: 'user-1',
      supplier: 'Supplier B',
      items: [
        {
          bahanBakuId: 'mat-1',
          namaBarang: 'Gula Pasir',
          quantity: 5,
          satuan: 'kg',
          unitPrice: 2500,
          subtotal: 12500,
        },
      ],
    };

    await applyPurchaseToWarehouse(purchase as any);

    const updated = warehouseTable.get('mat-1');
    expect(updated?.stok).toBe(15);
    expect(updated?.harga_satuan).toBe(2500);
    expect(updated?.harga_rata_rata).toBeCloseTo((10 * 2000 + 5 * 2500) / 15, 4);
    expect(updated?.supplier).toContain('Supplier B');
  });
});
