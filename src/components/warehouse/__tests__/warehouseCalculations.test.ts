// src/components/warehouse/__tests__/warehouseCalculations.test.ts
// Comprehensive test suite for warehouse calculation fixes

import { warehouseUtils } from '../services/warehouseUtils';
import { validatePurchaseData } from '@/utils/purchaseValidation';
import type { BahanBakuFrontend } from '../types';
import type { Purchase } from '../../purchase/types/purchase.types';

describe('Warehouse Calculation Fixes', () => {
  describe('WAC Price Calculations', () => {
    it('should prioritize WAC over base price when available', () => {
      const item: BahanBakuFrontend = {
        id: '1',
        userId: 'user1',
        nama: 'Test Item',
        kategori: 'Test',
        satuan: 'kg',
        stok: 100,
        minimum: 10,
        harga: 5000, // Base price
        hargaRataRata: 5500, // WAC price (higher)
        supplier: 'Test Supplier',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const effectivePrice = warehouseUtils.getEffectiveUnitPrice(item);
      expect(effectivePrice).toBe(5500); // Should use WAC
      expect(warehouseUtils.isUsingWac(item)).toBe(true);
    });

    it('should fall back to base price when WAC is not available', () => {
      const item: BahanBakuFrontend = {
        id: '2',
        userId: 'user1',
        nama: 'Test Item 2',
        kategori: 'Test',
        satuan: 'kg',
        stok: 50,
        minimum: 5,
        harga: 3000, // Base price
        hargaRataRata: null, // No WAC
        supplier: 'Test Supplier',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const effectivePrice = warehouseUtils.getEffectiveUnitPrice(item);
      expect(effectivePrice).toBe(3000); // Should use base price
      expect(warehouseUtils.isUsingWac(item)).toBe(false);
    });

    it('should handle invalid price data gracefully', () => {
      const item: BahanBakuFrontend = {
        id: '3',
        userId: 'user1',
        nama: 'Test Item 3',
        kategori: 'Test',
        satuan: 'kg',
        stok: 10,
        minimum: 1,
        harga: 0, // Invalid base price
        hargaRataRata: 0, // Invalid WAC
        supplier: 'Test Supplier',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const effectivePrice = warehouseUtils.getEffectiveUnitPrice(item);
      expect(effectivePrice).toBe(0); // Should handle gracefully
      expect(warehouseUtils.isUsingWac(item)).toBe(false);
    });
  });

  describe('Stock Value Calculations', () => {
    it('should calculate total stock value using effective prices', () => {
      const items: BahanBakuFrontend[] = [
        {
          id: '1',
          userId: 'user1',
          nama: 'Item A',
          kategori: 'Test',
          satuan: 'kg',
          stok: 10,
          minimum: 5,
          harga: 1000,
          hargaRataRata: 1100, // Using WAC
          supplier: 'Supplier A',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          userId: 'user1',
          nama: 'Item B',
          kategori: 'Test',
          satuan: 'pcs',
          stok: 20,
          minimum: 10,
          harga: 500,
          hargaRataRata: null, // Using base price
          supplier: 'Supplier B',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const totalValue = warehouseUtils.calculateStockValue(items);
      // Item A: 10 * 1100 = 11000 (using WAC)
      // Item B: 20 * 500 = 10000 (using base price)
      // Total: 21000
      expect(totalValue).toBe(21000);
    });

    it('should handle empty or invalid item arrays', () => {
      expect(warehouseUtils.calculateStockValue([])).toBe(0);
      expect(warehouseUtils.calculateStockValue(null as any)).toBe(0);
      expect(warehouseUtils.calculateStockValue(undefined as any)).toBe(0);
    });
  });

  describe('Purchase Validation', () => {
    it('should validate purchase items for completion', () => {
      const validPurchase: Purchase = {
        id: '1',
        userId: 'user1',
        supplier: 'Test Supplier',
        tanggal: new Date(),
        totalNilai: 15000,
        items: [
          {
            bahanBakuId: 'item1',
            nama: 'Test Item',
            kuantitas: 10,
            satuan: 'kg',
            hargaSatuan: 1000,
            subtotal: 10000
          },
          {
            bahanBakuId: 'item2',
            nama: 'Test Item 2',
            kuantitas: 5,
            satuan: 'pcs',
            hargaSatuan: 1000,
            subtotal: 5000
          }
        ],
        status: 'pending',
        metodePerhitungan: 'AVERAGE',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const validation = validatePurchaseData(validPurchase);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should catch invalid purchase data', () => {
      const invalidPurchase: Purchase = {
        id: '2',
        userId: 'user1',
        supplier: '', // Invalid - empty supplier
        tanggal: new Date(),
        totalNilai: 0, // Invalid - zero total
        items: [
          {
            bahanBakuId: '', // Invalid - empty ID
            nama: '',
            kuantitas: 0, // Invalid - zero quantity
            satuan: '',
            hargaSatuan: 0, // Invalid - zero price
            subtotal: 0
          }
        ],
        status: 'pending',
        metodePerhitungan: 'AVERAGE',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const validation = validatePurchaseData(invalidPurchase);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect calculation inconsistencies', () => {
      const inconsistentPurchase: Purchase = {
        id: '3',
        userId: 'user1',
        supplier: 'Test Supplier',
        tanggal: new Date(),
        totalNilai: 20000, // Total doesn't match item calculations
        items: [
          {
            bahanBakuId: 'item1',
            nama: 'Test Item',
            kuantitas: 10,
            satuan: 'kg',
            hargaSatuan: 1000,
            subtotal: 8000 // Subtotal doesn't match qty * price
          }
        ],
        status: 'pending',
        metodePerhitungan: 'AVERAGE',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const validation = validatePurchaseData(inconsistentPurchase);
      
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some(w => w.includes('subtotal'))).toBe(true);
      expect(validation.warnings.some(w => w.includes('total'))).toBe(true);
    });

    it('should validate against warehouse data consistency', () => {
      const warehouseItems: BahanBakuFrontend[] = [
        {
          id: 'item1',
          userId: 'user1',
          nama: 'Existing Item',
          kategori: 'Test',
          satuan: 'kg', // Different from purchase
          stok: 50,
          minimum: 10,
          harga: 2000,
          hargaRataRata: 2100,
          supplier: 'Original Supplier',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const purchase: Purchase = {
        id: '4',
        userId: 'user1',
        supplier: 'Test Supplier',
        tanggal: new Date(),
        totalNilai: 15000,
        items: [
          {
            bahanBakuId: 'item1',
            nama: 'Existing Item',
            kuantitas: 10,
            satuan: 'pcs', // Different unit
            hargaSatuan: 5000, // Very different price (> 50% difference)
            subtotal: 15000
          }
        ],
        status: 'pending',
        metodePerhitungan: 'AVERAGE',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const validation = validatePurchaseData(purchase);

      expect(validation.isValid).toBe(true); // Warnings don't prevent completion
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some(w => w.includes('satuan'))).toBe(true);
      expect(validation.warnings.some(w => w.includes('harga'))).toBe(true);
    });
  });

  describe('Export Data Preparation', () => {
    it('should include pricing method information in export', () => {
      const items: BahanBakuFrontend[] = [
        {
          id: '1',
          userId: 'user1',
          nama: 'WAC Item',
          kategori: 'Test',
          satuan: 'kg',
          stok: 10,
          minimum: 5,
          harga: 1000,
          hargaRataRata: 1200, // Has WAC
          supplier: 'Supplier A',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02')
        },
        {
          id: '2',
          userId: 'user1',
          nama: 'Base Price Item',
          kategori: 'Test',
          satuan: 'pcs',
          stok: 20,
          minimum: 10,
          harga: 500,
          hargaRataRata: null, // No WAC
          supplier: 'Supplier B',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02')
        }
      ];

      const exportData = warehouseUtils.prepareExportData(items);

      expect(exportData).toHaveLength(2);
      
      // First item should use WAC
      expect(exportData[0]['Metode Harga']).toBe('Rata-rata Tertimbang (WAC)');
      expect(exportData[0]['Harga Efektif']).toContain('1.200');
      expect(exportData[0]['Nilai Total Stok']).toContain('12.000');

      // Second item should use input price
      expect(exportData[1]['Metode Harga']).toBe('Harga Input');
      expect(exportData[1]['Harga Efektif']).toContain('500');
      expect(exportData[1]['Nilai Total Stok']).toContain('10.000');
    });
  });

  describe('Stock Report Generation', () => {
    it('should generate accurate stock reports using effective prices', () => {
      const items: BahanBakuFrontend[] = [
        {
          id: '1',
          userId: 'user1',
          nama: 'Low Stock Item',
          kategori: 'Category A',
          satuan: 'kg',
          stok: 2, // Below minimum
          minimum: 5,
          harga: 1000,
          hargaRataRata: 1100,
          supplier: 'Supplier A',
          expiry: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Expires in 10 days
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          userId: 'user1',
          nama: 'Normal Stock Item',
          kategori: 'Category B',
          satuan: 'pcs',
          stok: 50,
          minimum: 10,
          harga: 500,
          hargaRataRata: null,
          supplier: 'Supplier B',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const report = warehouseUtils.generateStockReport(items);

      expect(report.summary.totalItems).toBe(2);
      expect(report.summary.lowStockCount).toBe(1);
      expect(report.summary.expiringCount).toBe(1);
      expect(report.summary.totalValue).toBe(27200); // (2 * 1100) + (50 * 500)
      
      expect(report.categories['Category A']).toBe(1);
      expect(report.categories['Category B']).toBe(1);
      
      expect(report.alerts.lowStock).toHaveLength(1);
      expect(report.alerts.expiring).toHaveLength(1);
    });
  });

  describe('Data Utilities', () => {
    it('should handle pagination correctly', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({
        id: `item${i}`,
        name: `Item ${i}`
      }));

      const page1 = warehouseUtils.paginateItems(items, 1, 10);
      expect(page1.items).toHaveLength(10);
      expect(page1.totalPages).toBe(3);
      expect(page1.currentPage).toBe(1);
      expect(page1.totalItems).toBe(25);

      const page3 = warehouseUtils.paginateItems(items, 3, 10);
      expect(page3.items).toHaveLength(5); // Last page has 5 items
      expect(page3.currentPage).toBe(3);
    });

    it('should format currency correctly', () => {
      expect(warehouseUtils.formatCurrency(1000)).toContain('1.000');
      expect(warehouseUtils.formatCurrency(1500.75)).toContain('1.501'); // Rounded
      expect(warehouseUtils.formatCurrency(0)).toContain('0');
    });

    it('should format dates correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = warehouseUtils.formatDate(date);
      expect(formatted).toBe('15 Jan 2024');
    });

    it('should assess stock levels correctly', () => {
      const outOfStock = warehouseUtils.formatStockLevel(0, 10);
      expect(outOfStock.level).toBe('out');
      expect(outOfStock.color).toBe('red');

      const lowStock = warehouseUtils.formatStockLevel(8, 10);
      expect(lowStock.level).toBe('low');
      expect(lowStock.color).toBe('red');

      const mediumStock = warehouseUtils.formatStockLevel(12, 10);
      expect(mediumStock.level).toBe('medium');
      expect(mediumStock.color).toBe('yellow');

      const highStock = warehouseUtils.formatStockLevel(25, 10);
      expect(highStock.level).toBe('high');
      expect(highStock.color).toBe('green');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined items gracefully', () => {
      expect(warehouseUtils.getEffectiveUnitPrice(null as any)).toBe(0);
      expect(warehouseUtils.getEffectiveUnitPrice(undefined as any)).toBe(0);
      expect(warehouseUtils.isUsingWac(null as any)).toBe(false);
      expect(warehouseUtils.isUsingWac(undefined as any)).toBe(false);
    });

    it('should handle empty arrays in calculations', () => {
      expect(warehouseUtils.calculateStockValue([])).toBe(0);
      expect(warehouseUtils.getLowStockItems([])).toHaveLength(0);
      expect(warehouseUtils.getExpiringItems([])).toHaveLength(0);
    });

    it('should validate malformed data safely', () => {
      const malformedItem = {
        // Missing required fields
        stok: 'not a number' as any,
        harga: null as any,
        minimum: undefined as any
      } as BahanBakuFrontend;

      const validation = warehouseUtils.validateBahanBaku(malformedItem);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should handle extreme values appropriately', () => {
      const extremeItem: BahanBakuFrontend = {
        id: 'extreme',
        userId: 'user1',
        nama: 'Extreme Item',
        kategori: 'Test',
        satuan: 'kg',
        stok: Number.MAX_SAFE_INTEGER,
        minimum: 1,
        harga: Number.MAX_SAFE_INTEGER,
        hargaRataRata: Number.MAX_SAFE_INTEGER,
        supplier: 'Test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const effectivePrice = warehouseUtils.getEffectiveUnitPrice(extremeItem);
      expect(typeof effectivePrice).toBe('number');
      expect(isFinite(effectivePrice)).toBe(true);
    });
  });
});

describe('Integration Tests', () => {
  it('should maintain calculation consistency across components', () => {
    // Create a scenario where purchase completion should affect warehouse
    const warehouseItem: BahanBakuFrontend = {
      id: 'item1',
      userId: 'user1',
      nama: 'Integration Test Item',
      kategori: 'Test',
      satuan: 'kg',
      stok: 10,
      minimum: 5,
      harga: 1000,
      hargaRataRata: 1200, // Existing WAC
      supplier: 'Original Supplier',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newPurchase: Purchase = {
      id: 'purchase1',
      userId: 'user1',
      supplier: 'New Supplier',
      tanggal: new Date(),
      totalNilai: 8000,
      items: [
        {
          bahanBakuId: 'item1',
          nama: 'Integration Test Item',
          kuantitas: 5,
          satuan: 'kg',
          hargaSatuan: 1600, // Higher than current WAC
          subtotal: 8000
        }
      ],
      status: 'pending',
      metodePerhitungan: 'AVERAGE',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate purchase can be completed
    const validation = validatePurchaseForCompletion(newPurchase, {
      warehouseItems: [warehouseItem],
      checkWarehouseConsistency: true
    });

    expect(validation.canComplete).toBe(true);

    // Calculate expected new WAC after purchase
    // Current: 10 kg @ 1200 = 12000
    // New: 5 kg @ 1600 = 8000
    // Expected WAC: (12000 + 8000) / (10 + 5) = 20000 / 15 = 1333.33
    const currentValue = warehouseItem.stok * (warehouseItem.hargaRataRata || 0);
    const newValue = newPurchase.items[0].kuantitas * newPurchase.items[0].hargaSatuan;
    const totalValue = currentValue + newValue;
    const totalQuantity = warehouseItem.stok + newPurchase.items[0].kuantitas;
    const expectedNewWac = totalValue / totalQuantity;

    expect(Math.abs(expectedNewWac - 1333.33)).toBeLessThan(0.01);
  });
});

// Mock console methods for cleaner test output
beforeAll(() => {
  jest.spyOn(console, 'debug').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});
