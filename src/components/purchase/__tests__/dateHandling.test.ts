// src/components/purchase/__tests__/dateHandling.test.ts
/**
 * Comprehensive test suite for date handling consistency across purchase module
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserFriendlyDate } from '@/utils/userFriendlyDate';
import { validatePurchaseDate } from '../utils/validation/dateValidation';
import { transformPurchaseFromDB, transformPurchaseForDB } from '../utils/purchaseTransformers';

// Mock timezone for consistent testing
const mockTimezone = 'Asia/Jakarta';
const originalTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

beforeEach(() => {
  // Mock console methods to avoid noise in test output
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  
  // Set consistent timezone for testing
  Object.defineProperty(Intl, 'DateTimeFormat', {
    writable: true,
    value: class {
      static supportedLocalesOf = Intl.DateTimeFormat.supportedLocalesOf;
      constructor(locale?: any, options?: any) {
        return new (Intl.DateTimeFormat as any)(locale, { 
          ...options, 
          timeZone: mockTimezone 
        });
      }
      resolvedOptions() {
        return { timeZone: mockTimezone };
      }
      format(date: Date) {
        return new (Intl.DateTimeFormat as any)('id-ID', { 
          timeZone: mockTimezone 
        }).format(date);
      }
    }
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Date Handling Consistency in Purchase Module', () => {
  
  describe('UserFriendlyDate Integration', () => {
    test('should parse various Indonesian date formats consistently', () => {
      const testCases = [
        { input: '15/01/2024', expected: '2024-01-15' },
        { input: '1/1/2024', expected: '2024-01-01' },
        { input: '31/12/2023', expected: '2023-12-31' },
        { input: '2024-01-15', expected: '2024-01-15' },
        { input: '15 Januari 2024', expected: '2024-01-15' },
        { input: '1 Jan 2024', expected: '2024-01-01' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = UserFriendlyDate.parse(input);
        expect(result.success, `Failed to parse: ${input}`).toBe(true);
        expect(UserFriendlyDate.toYMD(result.date!)).toBe(expected);
      });
    });

    test('should reject invalid date formats with helpful messages', () => {
      const invalidInputs = [
        '32/01/2024', // Invalid day
        '15/13/2024', // Invalid month
        '15/01/abc',  // Invalid year
        'invalid date',
        '',
        null,
        undefined
      ];

      invalidInputs.forEach((input) => {
        const result = UserFriendlyDate.parse(input);
        expect(result.success, `Should reject: ${input}`).toBe(false);
        expect(result.error).toBeTruthy();
      });
    });

    test('should handle timezone-safe operations', () => {
      const testDate = new Date('2024-01-15T10:30:00Z');
      
      // Should format consistently regardless of local timezone
      const formatted = UserFriendlyDate.formatToLocalString(testDate);
      expect(formatted).toMatch(/15\/01\/2024/);
      
      // Should convert to YYYY-MM-DD format for database
      const ymd = UserFriendlyDate.toYMD(testDate);
      expect(ymd).toBe('2024-01-15');
    });
  });

  describe('Purchase Date Validation', () => {
    test('should validate purchase dates correctly', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 10);
      
      const veryOldDate = new Date(today);
      veryOldDate.setFullYear(veryOldDate.getFullYear() - 2);

      // Valid dates
      expect(validatePurchaseDate(today).isValid).toBe(true);
      expect(validatePurchaseDate(yesterday).isValid).toBe(true);
      
      // Future dates should be valid but with warning
      const futureValidation = validatePurchaseDate(futureDate);
      expect(futureValidation.isValid).toBe(true);
      expect(futureValidation.warning).toBeTruthy();
      
      // Very old dates should be valid but with warning
      const oldValidation = validatePurchaseDate(veryOldDate);
      expect(oldValidation.isValid).toBe(true);
      expect(oldValidation.warning).toBeTruthy();
    });

    test('should handle string date inputs in validation', () => {
      const validDates = [
        '15/01/2024',
        '2024-01-15',
        '15 Januari 2024'
      ];

      validDates.forEach(dateStr => {
        const result = validatePurchaseDate(dateStr);
        expect(result.isValid, `Should validate: ${dateStr}`).toBe(true);
      });
    });
  });

  describe('Database Transformations', () => {
    test('should transform dates correctly from database format', () => {
      const dbData = {
        id: 'test-id',
        user_id: 'user-123',
        supplier: 'Test Supplier',
        tanggal: '2024-01-15', // Database DATE format
        total_nilai: 100000,
        items: [],
        status: 'pending',
        metode_perhitungan: 'AVERAGE',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z'
      };

      const transformed = transformPurchaseFromDB(dbData);
      
      expect(transformed.tanggal).toBeInstanceOf(Date);
      expect(transformed.createdAt).toBeInstanceOf(Date);
      expect(transformed.updatedAt).toBeInstanceOf(Date);
      
      // Check that dates are parsed correctly
      expect(UserFriendlyDate.toYMD(transformed.tanggal)).toBe('2024-01-15');
    });

    test('should transform dates correctly to database format', () => {
      const purchaseData = {
        supplier: 'Test Supplier',
        tanggal: new Date('2024-01-15T10:30:00Z'),
        totalNilai: 100000,
        items: [],
        status: 'pending' as const,
        metodePerhitungan: 'AVERAGE' as const
      };

      const transformed = transformPurchaseForDB(purchaseData, 'user-123');
      
      // Should format date as YYYY-MM-DD for database
      expect(transformed.tanggal).toBe('2024-01-15');
      expect(transformed.user_id).toBe('user-123');
    });

    test('should handle various date input types in transformations', () => {
      const testCases = [
        { input: new Date('2024-01-15'), expected: '2024-01-15' },
        { input: '2024-01-15', expected: '2024-01-15' },
        { input: '15/01/2024', expected: '2024-01-15' },
        { input: '2024-01-15T10:30:00Z', expected: '2024-01-15' }
      ];

      testCases.forEach(({ input, expected }) => {
        const purchaseData = {
          supplier: 'Test',
          tanggal: input,
          totalNilai: 100000,
          items: [],
          status: 'pending' as const,
          metodePerhitungan: 'AVERAGE' as const
        };

        const transformed = transformPurchaseForDB(purchaseData, 'user-123');
        expect(transformed.tanggal, `Failed for input: ${input}`).toBe(expected);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid dates gracefully', () => {
      const invalidDates = [
        'invalid-date',
        '2024-13-45', // Invalid month/day
        new Date('invalid'),
        null,
        undefined
      ];

      invalidDates.forEach((invalidDate) => {
        // Validation should catch these
        const validation = validatePurchaseDate(invalidDate as any);
        expect(validation.isValid, `Should be invalid: ${invalidDate}`).toBe(false);
        
        // Transformers should fallback gracefully
        const purchaseData = {
          supplier: 'Test',
          tanggal: invalidDate as any,
          totalNilai: 100000,
          items: [],
          status: 'pending' as const,
          metodePerhitungan: 'AVERAGE' as const
        };

        const transformed = transformPurchaseForDB(purchaseData, 'user-123');
        // Should fallback to today's date
        expect(transformed.tanggal).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    test('should handle leap year dates correctly', () => {
      const leapYearDate = '29/02/2024'; // 2024 is a leap year
      const nonLeapYearDate = '29/02/2023'; // 2023 is not a leap year

      const leapResult = UserFriendlyDate.parse(leapYearDate);
      expect(leapResult.success).toBe(true);
      expect(UserFriendlyDate.toYMD(leapResult.date!)).toBe('2024-02-29');

      const nonLeapResult = UserFriendlyDate.parse(nonLeapYearDate);
      expect(nonLeapResult.success).toBe(false);
    });

    test('should handle daylight saving time transitions', () => {
      // Test dates around DST transition (if applicable to Indonesia)
      const beforeDST = new Date('2024-03-10T02:00:00Z');
      const afterDST = new Date('2024-03-10T08:00:00Z');

      const beforeFormatted = UserFriendlyDate.formatToLocalString(beforeDST);
      const afterFormatted = UserFriendlyDate.formatToLocalString(afterDST);

      // Both should format consistently
      expect(beforeFormatted).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
      expect(afterFormatted).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
    });
  });

  describe('UI Component Integration', () => {
    test('should provide consistent formatting for table display', () => {
      const testDate = new Date('2024-01-15T10:30:00Z');
      
      // Test different formatting options
      const shortFormat = UserFriendlyDate.formatToLocalString(testDate);
      const longFormat = UserFriendlyDate.formatToLocalString(testDate, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      expect(shortFormat).toMatch(/15\/01\/2024/);
      expect(longFormat).toMatch(/15 Jan 2024/);
    });

    test('should provide safe calendar date conversion', () => {
      const testInputs = [
        new Date('2024-01-15'),
        '2024-01-15',
        '15/01/2024',
        null,
        undefined
      ];

      testInputs.forEach(input => {
        const calendarDate = UserFriendlyDate.forCalendar(input);
        
        if (input) {
          expect(calendarDate).toBeInstanceOf(Date);
          expect(calendarDate?.getTime()).not.toBeNaN();
        } else {
          expect(calendarDate).toBeUndefined();
        }
      });
    });
  });

  describe('CSV Import Date Parsing', () => {
    test('should parse CSV date formats correctly', () => {
      const csvDateFormats = [
        '2024-01-15',
        '15/01/2024',
        '15-01-2024',
        '01/15/2024', // US format (should be handled with warning)
      ];

      csvDateFormats.forEach(dateStr => {
        const result = UserFriendlyDate.parse(dateStr);
        
        if (dateStr === '01/15/2024') {
          // US format might be ambiguous, but should still parse
          expect(result.success || result.error?.includes('ambiguous')).toBe(true);
        } else {
          expect(result.success, `Failed to parse CSV date: ${dateStr}`).toBe(true);
        }
      });
    });

    test('should provide helpful error messages for CSV import failures', () => {
      const invalidCSVDates = [
        '32/01/2024',
        '15/13/2024',
        'Jan 15, 2024', // Unsupported format for CSV
        '15-01-24'      // 2-digit year
      ];

      invalidCSVDates.forEach(dateStr => {
        const result = UserFriendlyDate.parse(dateStr);
        expect(result.success).toBe(false);
        expect(result.error).toContain('format');
      });
    });
  });

  describe('Form Input Validation', () => {
    test('should validate manual form inputs correctly', () => {
      const formInputs = [
        { input: '15/01/2024', shouldBeValid: true },
        { input: '1/1/2024', shouldBeValid: true },
        { input: '32/01/2024', shouldBeValid: false },
        { input: '', shouldBeValid: false },
        { input: 'invalid', shouldBeValid: false }
      ];

      formInputs.forEach(({ input, shouldBeValid }) => {
        const validation = validatePurchaseDate(input);
        expect(validation.isValid, `Input: ${input}`).toBe(shouldBeValid);
      });
    });
  });

  describe('Database Date Storage', () => {
    test('should store dates in correct YYYY-MM-DD format', () => {
      const testDates = [
        new Date('2024-01-15T10:30:00Z'),
        new Date('2024-12-31T23:59:59Z'),
        new Date('2024-02-29T12:00:00Z'), // Leap year
      ];

      testDates.forEach(date => {
        const purchaseData = {
          supplier: 'Test Supplier',
          tanggal: date,
          totalNilai: 100000,
          items: [],
          status: 'pending' as const,
          metodePerhitungan: 'AVERAGE' as const
        };

        const transformed = transformPurchaseForDB(purchaseData, 'user-123');
        
        // Should be in YYYY-MM-DD format
        expect(transformed.tanggal).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        
        // Should be valid date
        const parsedBack = new Date(transformed.tanggal);
        expect(parsedBack.getTime()).not.toBeNaN();
      });
    });

    test('should retrieve dates correctly from database', () => {
      const dbData = {
        id: 'test-id',
        user_id: 'user-123',
        supplier: 'Test Supplier',
        tanggal: '2024-01-15',
        total_nilai: 100000,
        items: [],
        status: 'pending',
        metode_perhitungan: 'AVERAGE',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z'
      };

      const transformed = transformPurchaseFromDB(dbData);
      
      expect(transformed.tanggal).toBeInstanceOf(Date);
      expect(UserFriendlyDate.toYMD(transformed.tanggal)).toBe('2024-01-15');
    });
  });

  describe('Sorting and Comparison', () => {
    test('should sort dates correctly across different input formats', () => {
      const purchases = [
        { tanggal: '15/01/2024' },
        { tanggal: '2024-01-10' },
        { tanggal: new Date('2024-01-20') },
        { tanggal: '05/01/2024' }
      ];

      const sorted = purchases.sort((a, b) => {
        const aTime = UserFriendlyDate.safeParseToDate(a.tanggal).getTime();
        const bTime = UserFriendlyDate.safeParseToDate(b.tanggal).getTime();
        return aTime - bTime;
      });

      // Should be in chronological order
      const sortedDates = sorted.map(p => UserFriendlyDate.toYMD(
        UserFriendlyDate.safeParseToDate(p.tanggal)
      ));
      
      expect(sortedDates).toEqual([
        '2024-01-05',
        '2024-01-10', 
        '2024-01-15',
        '2024-01-20'
      ]);
    });
  });

  describe('Error Recovery and Fallbacks', () => {
    test('should provide safe fallbacks for corrupted date data', () => {
      const corruptedInputs = [
        { tanggal: 'corrupted' },
        { tanggal: null },
        { tanggal: {} },
        { tanggal: [] },
        { tanggal: 999999999999999 } // Invalid timestamp
      ];

      corruptedInputs.forEach((input, index) => {
        // Transformers should not throw errors
        expect(() => {
          const purchaseData = {
            supplier: 'Test',
            ...input,
            totalNilai: 100000,
            items: [],
            status: 'pending' as const,
            metodePerhitungan: 'AVERAGE' as const
          };
          transformPurchaseForDB(purchaseData, 'user-123');
        }).not.toThrow();

        // Should fallback to valid date format
        const purchaseData = {
          supplier: 'Test',
          ...input,
          totalNilai: 100000,
          items: [],
          status: 'pending' as const,
          metodePerhitungan: 'AVERAGE' as const
        };
        
        const result = transformPurchaseForDB(purchaseData, 'user-123');
        expect(result.tanggal).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    test('should handle null/undefined dates in display formatting', () => {
      const nullishInputs = [null, undefined, ''];
      
      nullishInputs.forEach(input => {
        const formatted = UserFriendlyDate.formatToLocalString(input);
        // Should provide fallback display
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance and Memory', () => {
    test('should handle large batches of date operations efficiently', () => {
      const startTime = performance.now.call(performance);
      
      // Process 1000 dates
      const dates = Array.from({ length: 1000 }, (_, i) => {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        return date;
      });

      dates.forEach(date => {
        UserFriendlyDate.formatToLocalString(date);
        UserFriendlyDate.toYMD(date);
      });

      const endTime = performance.now.call(performance);
      const duration = endTime - startTime;

      // Should process 1000 dates in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Internationalization Support', () => {
    test('should support Indonesian month names', () => {
      const indonesianDates = [
        '15 Januari 2024',
        '20 Februari 2024',
        '5 Maret 2024',
        '10 April 2024',
        '25 Mei 2024',
        '30 Juni 2024'
      ];

      indonesianDates.forEach(dateStr => {
        const result = UserFriendlyDate.parse(dateStr);
        expect(result.success, `Failed to parse Indonesian date: ${dateStr}`).toBe(true);
      });
    });

    test('should format dates in Indonesian locale consistently', () => {
      const testDate = new Date('2024-01-15T10:30:00Z');
      
      const formatted = UserFriendlyDate.formatToLocalString(testDate);
      // Should use Indonesian date format (DD/MM/YYYY)
      expect(formatted).toMatch(/15\/01\/2024/);
    });
  });
});

describe('Integration Tests', () => {
  test('should handle complete purchase workflow date consistency', async () => {
    // Simulate a complete workflow: input -> validation -> transform -> store -> retrieve -> display
    
    const userInput = '15/01/2024';
    
    // Step 1: Validate user input
    const validation = validatePurchaseDate(userInput);
    expect(validation.isValid).toBe(true);
    
    // Step 2: Parse to Date object for form
    const parsedDate = UserFriendlyDate.safeParseToDate(userInput);
    expect(parsedDate).toBeInstanceOf(Date);
    
    // Step 3: Transform for database storage
    const purchaseData = {
      supplier: 'Test Supplier',
      tanggal: parsedDate,
      totalNilai: 100000,
      items: [],
      status: 'pending' as const,
      metodePerhitungan: 'AVERAGE' as const
    };
    
    const dbPayload = transformPurchaseForDB(purchaseData, 'user-123');
    expect(dbPayload.tanggal).toBe('2024-01-15');
    
    // Step 4: Simulate database retrieval
    const dbData = {
      id: 'test-id',
      user_id: 'user-123',
      ...dbPayload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const retrieved = transformPurchaseFromDB(dbData);
    expect(retrieved.tanggal).toBeInstanceOf(Date);
    
    // Step 5: Format for display
    const displayed = UserFriendlyDate.formatToLocalString(retrieved.tanggal);
    expect(displayed).toMatch(/15\/01\/2024/);
  });
});
