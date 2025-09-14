// src/components/purchase/tests/supplierNameDisplay.test.ts
// Test untuk memastikan supplier name resolver berfungsi dengan benar

import { createSupplierNameResolver } from '../utils/purchaseHelpers';
import { describe, it, expect } from 'vitest';

describe('Supplier Name Display', () => {
  const mockSuppliers = [
    { id: 'sup1', nama: 'PT. Supplier Utama' },
    { id: 'sup2', nama: 'CV. Bahan Baku Sejahtera' },
    { id: 'sup3', nama: 'UD. Sumber Rejeki' }
  ];

  describe('createSupplierNameResolver', () => {
    it('should resolve supplier ID to supplier name correctly', () => {
      const getSupplierName = createSupplierNameResolver(mockSuppliers);
      
      expect(getSupplierName('sup1')).toBe('PT. Supplier Utama');
      expect(getSupplierName('sup2')).toBe('CV. Bahan Baku Sejahtera');
      expect(getSupplierName('sup3')).toBe('UD. Sumber Rejeki');
    });

    it('should return supplier ID as fallback if not found in list', () => {
      const getSupplierName = createSupplierNameResolver(mockSuppliers);
      
      expect(getSupplierName('sup999')).toBe('sup999');
      expect(getSupplierName('unknown-id')).toBe('unknown-id');
    });

    it('should handle empty or invalid supplier IDs gracefully', () => {
      const getSupplierName = createSupplierNameResolver(mockSuppliers);
      
      expect(getSupplierName('')).toBe('Tidak ada supplier');
      expect(getSupplierName(null as any)).toBe('Tidak ada supplier');
      expect(getSupplierName(undefined as any)).toBe('Tidak ada supplier');
    });

    it('should work with empty suppliers list', () => {
      const getSupplierName = createSupplierNameResolver([]);
      
      expect(getSupplierName('sup1')).toBe('sup1');
      expect(getSupplierName('')).toBe('Tidak ada supplier');
    });

    it('should handle suppliers with duplicate IDs correctly (return first match)', () => {
      const suppliersWithDuplicates = [
        { id: 'dup1', nama: 'First Supplier' },
        { id: 'dup1', nama: 'Second Supplier' }, // Same ID, different name
        { id: 'dup2', nama: 'Another Supplier' }
      ];
      
      const getSupplierName = createSupplierNameResolver(suppliersWithDuplicates);
      
      // Should return the first match
      expect(getSupplierName('dup1')).toBe('First Supplier');
      expect(getSupplierName('dup2')).toBe('Another Supplier');
    });

    it('should be case-sensitive for IDs', () => {
      const getSupplierName = createSupplierNameResolver(mockSuppliers);
      
      expect(getSupplierName('SUP1')).toBe('SUP1'); // Not found, returns ID
      expect(getSupplierName('sup1')).toBe('PT. Supplier Utama'); // Found
    });
  });

  describe('Integration with UI Components', () => {
    it('should provide expected format for table display', () => {
      const getSupplierName = createSupplierNameResolver(mockSuppliers);
      
      // Simulate what would appear in table cells
      const tableDisplayValues = [
        { supplierId: 'sup1', expectedDisplay: 'PT. Supplier Utama' },
        { supplierId: 'sup2', expectedDisplay: 'CV. Bahan Baku Sejahtera' },
        { supplierId: 'unknown', expectedDisplay: 'unknown' },
        { supplierId: '', expectedDisplay: 'Tidak ada supplier' }
      ];

      tableDisplayValues.forEach(({ supplierId, expectedDisplay }) => {
        const displayValue = getSupplierName(supplierId);
        expect(displayValue).toBe(expectedDisplay);
        expect(typeof displayValue).toBe('string');
        expect(displayValue.length).toBeGreaterThan(0);
      });
    });

    it('should handle real-world supplier data structure', () => {
      // Simulate real supplier data from database
      const realWorldSuppliers = [
        { id: 'uuid-123-abc', nama: 'PT. Indofood Sukses Makmur' },
        { id: 'uuid-456-def', nama: 'CV. Sumber Alam Jaya' },
        { id: 'uuid-789-ghi', nama: 'UD. Berkah Bersama' }
      ];

      const getSupplierName = createSupplierNameResolver(realWorldSuppliers);

      expect(getSupplierName('uuid-123-abc')).toBe('PT. Indofood Sukses Makmur');
      expect(getSupplierName('uuid-456-def')).toBe('CV. Sumber Alam Jaya');
      expect(getSupplierName('uuid-789-ghi')).toBe('UD. Berkah Bersama');
    });
  });

  describe('Performance considerations', () => {
    it('should handle large suppliers list efficiently', () => {
      // Create a large list of suppliers for performance testing
      const largeSuppliersList = Array.from({ length: 1000 }, (_, i) => ({
        id: `supplier-${i}`,
        nama: `Supplier Name ${i}`
      }));

      const getSupplierName = createSupplierNameResolver(largeSuppliersList);

      // Test lookup performance
      const startTime = performance.now.call(performance);
      
      // Test multiple lookups
      expect(getSupplierName('supplier-0')).toBe('Supplier Name 0');
      expect(getSupplierName('supplier-500')).toBe('Supplier Name 500');
      expect(getSupplierName('supplier-999')).toBe('Supplier Name 999');
      expect(getSupplierName('non-existent')).toBe('non-existent');
      
      const endTime = performance.now.call(performance);
      const executionTime = endTime - startTime;

      // Should complete in reasonable time (less than 10ms for 1000 items)
      expect(executionTime).toBeLessThan(10);
    });
  });
});

/**
 * Mock Purchase Data for Integration Testing
 */
export const mockPurchaseData = {
  id: 'purchase-123',
  userId: 'user-456',
  supplier: 'sup1', // This should resolve to 'PT. Supplier Utama'
  tanggal: new Date('2024-01-15'),
  totalNilai: 150000,
  items: [
    {
      bahanBakuId: 'bb1',
      nama: 'Tepung Terigu',
      quantity: 10,
      satuan: 'kg',
      unitPrice: 15000,
      subtotal: 150000
    }
  ],
  status: 'completed' as const,
  metodePerhitungan: 'AVERAGE' as const,
  createdAt: new Date('2024-01-15T08:00:00'),
  updatedAt: new Date('2024-01-15T08:00:00')
};

/**
 * Integration test that verifies the complete flow from data to display
 */
describe('Purchase Supplier Display Integration', () => {
  it('should correctly display supplier name in purchase table row', () => {
    const suppliers = [
      { id: 'sup1', nama: 'PT. Supplier Utama' },
      { id: 'sup2', nama: 'CV. Bahan Baku Sejahtera' }
    ];

    const getSupplierName = createSupplierNameResolver(suppliers);

    // Test with mock purchase data
    const displayName = getSupplierName(mockPurchaseData.supplier);
    
    expect(displayName).toBe('PT. Supplier Utama');
    expect(displayName).not.toBe('sup1'); // Should not display ID
    expect(displayName).not.toBe(''); // Should not be empty
  });
});
