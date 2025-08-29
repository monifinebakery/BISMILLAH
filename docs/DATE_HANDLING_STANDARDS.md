# Date Handling Standards - Purchase Module

## Overview

This document outlines the standardized approach to date handling across the purchase module to ensure consistency, reliability, and user-friendly experiences. All date operations should use the `UserFriendlyDate` utility to prevent "Format tanggal tidak valid" errors.

## Core Principles

1. **Consistency**: All date operations use the same utility functions
2. **Safety**: Robust error handling with graceful fallbacks
3. **User-Friendly**: Support for Indonesian date formats and clear error messages
4. **Timezone-Safe**: Proper handling of timezone conversions
5. **Database Compatibility**: Consistent YYYY-MM-DD format for database storage

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Input    │ -> │  UserFriendlyDate │ -> │   Database      │
│  (Various)      │    │     Utility       │    │  (YYYY-MM-DD)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         |                        |                        |
         v                        v                        v
  15/01/2024              Date Object                2024-01-15
  2024-01-15              Validation                     |
  15 Januari 2024         Formatting                     v
                         Conversion              ┌─────────────────┐
                                                │   UI Display    │
                                                │  (Localized)    │
                                                └─────────────────┘
```

## UserFriendlyDate API

### Core Methods

#### `UserFriendlyDate.parse(input): ParseResult`
Parses various date input formats into a Date object.

**Supported Formats:**
- `DD/MM/YYYY` (Indonesian standard)
- `D/M/YYYY` (Short format)
- `YYYY-MM-DD` (ISO format)
- `DD Bulan YYYY` (Indonesian month names)
- `D Bulan YYYY` (Short Indonesian format)

```typescript
// Examples
const result1 = UserFriendlyDate.parse('15/01/2024');
const result2 = UserFriendlyDate.parse('15 Januari 2024');
const result3 = UserFriendlyDate.parse('2024-01-15');

// Always check success before using
if (result1.success) {
  console.log(result1.date); // Date object
} else {
  console.log(result1.error); // User-friendly error message
}
```

#### `UserFriendlyDate.safeParseToDate(input): Date`
Safe parsing with fallback to current date if parsing fails.

```typescript
// Always returns a valid Date object
const date = UserFriendlyDate.safeParseToDate('15/01/2024');
const fallback = UserFriendlyDate.safeParseToDate('invalid'); // Returns current date
```

#### `UserFriendlyDate.formatToLocalString(date, options?): string`
Formats a date for display in Indonesian locale.

```typescript
const date = new Date('2024-01-15T10:30:00Z');

// Default format: DD/MM/YYYY
const short = UserFriendlyDate.formatToLocalString(date);
// Output: "15/01/2024"

// Custom format
const long = UserFriendlyDate.formatToLocalString(date, {
  day: 'numeric',
  month: 'short', 
  year: 'numeric'
});
// Output: "15 Jan 2024"
```

#### `UserFriendlyDate.toYMD(date): string`
Converts date to YYYY-MM-DD format for database storage.

```typescript
const date = new Date('2024-01-15T10:30:00Z');
const dbFormat = UserFriendlyDate.toYMD(date);
// Output: "2024-01-15"
```

#### `UserFriendlyDate.forCalendar(input): Date | undefined`
Safely converts input for calendar components.

```typescript
// For React calendar components
const calendarDate = UserFriendlyDate.forCalendar(formData.tanggal);
// Returns undefined for invalid inputs, Date object for valid ones
```

## Implementation Guidelines

### 1. Form Input Handling

**✅ DO:**
```typescript
// In form components
import { UserFriendlyDate } from '@/utils/userFriendlyDate';

const handleDateInput = (inputValue: string) => {
  const parseResult = UserFriendlyDate.parse(inputValue);
  
  if (parseResult.success) {
    updateFormField('tanggal', parseResult.date);
  } else {
    setError(`Format tanggal tidak valid: ${parseResult.error}`);
  }
};
```

**❌ DON'T:**
```typescript
// Avoid direct Date constructor
const handleDateInput = (inputValue: string) => {
  const date = new Date(inputValue); // Unpredictable parsing
  if (isNaN(date.getTime())) {
    setError('Format tanggal tidak valid'); // Generic error
  }
};
```

### 2. Database Transformations

**✅ DO:**
```typescript
// In transformers
import { UserFriendlyDate } from '@/utils/userFriendlyDate';

const transformToDatabase = (formData: any) => ({
  ...formData,
  tanggal: UserFriendlyDate.toYMD(formData.tanggal),
});

const transformFromDatabase = (dbData: any) => ({
  ...dbData,
  tanggal: UserFriendlyDate.safeParseToDate(dbData.tanggal),
});
```

**❌ DON'T:**
```typescript
// Avoid manual date formatting
const transformToDatabase = (formData: any) => ({
  ...formData,
  tanggal: formData.tanggal.toISOString().slice(0, 10), // Unreliable
});
```

### 3. Display Formatting

**✅ DO:**
```typescript
// In UI components
import { UserFriendlyDate } from '@/utils/userFriendlyDate';

const PurchaseTableRow = ({ purchase }) => (
  <td>
    {UserFriendlyDate.formatToLocalString(purchase.tanggal)}
  </td>
);
```

**❌ DON'T:**
```typescript
// Avoid direct toLocaleDateString
const PurchaseTableRow = ({ purchase }) => (
  <td>
    {new Date(purchase.tanggal).toLocaleDateString('id-ID')}
  </td>
);
```

### 4. Validation

**✅ DO:**
```typescript
// In validation functions
import { UserFriendlyDate } from '@/utils/userFriendlyDate';
import { validatePurchaseDate } from '../utils/validation/dateValidation';

const validateForm = (data: any) => {
  const dateValidation = validatePurchaseDate(data.tanggal);
  
  if (!dateValidation.isValid) {
    return { error: dateValidation.error };
  }
  
  if (dateValidation.warning) {
    return { warning: dateValidation.warning };
  }
  
  return { valid: true };
};
```

### 5. Calendar Components

**✅ DO:**
```typescript
// For calendar integration
import { UserFriendlyDate } from '@/utils/userFriendlyDate';

const DatePicker = ({ value, onChange }) => (
  <Calendar
    selected={UserFriendlyDate.forCalendar(value)}
    onSelect={(date) => {
      if (date) {
        const safeDate = UserFriendlyDate.safeParseToDate(date);
        onChange(safeDate);
      }
    }}
  />
);
```

### 6. CSV Import

**✅ DO:**
```typescript
// In import processing
import { UserFriendlyDate } from '@/utils/userFriendlyDate';

const validateImportRow = (row: any) => {
  const dateResult = UserFriendlyDate.parse(row.tanggal);
  
  if (!dateResult.success) {
    return {
      valid: false,
      error: `Baris ${rowNumber}: Format tanggal tidak valid - ${dateResult.error}`
    };
  }
  
  return { valid: true, date: dateResult.date };
};
```

## Error Handling Patterns

### 1. User Input Validation

```typescript
const validateUserInput = (input: string) => {
  const result = UserFriendlyDate.parse(input);
  
  if (!result.success) {
    return {
      isValid: false,
      error: `Format tanggal tidak valid: ${result.error}. Gunakan format DD/MM/YYYY`
    };
  }
  
  return { isValid: true, date: result.date };
};
```

### 2. Graceful Fallbacks

```typescript
const safeDisplayDate = (dateInput: any) => {
  try {
    return UserFriendlyDate.formatToLocalString(dateInput);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Tanggal tidak valid';
  }
};
```

### 3. Database Error Recovery

```typescript
const transformFromDB = (dbRow: any) => {
  try {
    return {
      ...dbRow,
      tanggal: UserFriendlyDate.safeParseToDate(dbRow.tanggal),
      createdAt: UserFriendlyDate.safeParseToDate(dbRow.created_at),
      updatedAt: UserFriendlyDate.safeParseToDate(dbRow.updated_at),
    };
  } catch (error) {
    logger.error('Database date transformation error:', error);
    // Return with fallback dates
    return {
      ...dbRow,
      tanggal: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
};
```

## Testing Guidelines

### 1. Test Coverage Areas

- **Input Parsing**: Various format combinations
- **Edge Cases**: Invalid dates, leap years, timezone changes
- **Database Round-trips**: Store and retrieve consistency
- **Display Formatting**: Locale-specific output
- **Error Scenarios**: Graceful degradation

### 2. Test Examples

```typescript
describe('Date Handling', () => {
  test('should parse Indonesian date formats', () => {
    const inputs = ['15/01/2024', '1/1/2024', '15 Januari 2024'];
    
    inputs.forEach(input => {
      const result = UserFriendlyDate.parse(input);
      expect(result.success).toBe(true);
      expect(result.date).toBeInstanceOf(Date);
    });
  });
  
  test('should handle invalid dates gracefully', () => {
    const invalid = ['32/01/2024', 'invalid', null, undefined];
    
    invalid.forEach(input => {
      const result = UserFriendlyDate.parse(input);
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });
  
  test('should maintain consistency through full workflow', () => {
    const userInput = '15/01/2024';
    
    // Parse
    const parsed = UserFriendlyDate.parse(userInput);
    expect(parsed.success).toBe(true);
    
    // Transform for DB
    const dbFormat = UserFriendlyDate.toYMD(parsed.date!);
    expect(dbFormat).toBe('2024-01-15');
    
    // Transform back from DB
    const retrieved = UserFriendlyDate.safeParseToDate(dbFormat);
    
    // Display
    const displayed = UserFriendlyDate.formatToLocalString(retrieved);
    expect(displayed).toMatch(/15\/01\/2024/);
  });
});
```

## Migration Checklist

When updating existing code to use standardized date handling:

- [ ] Replace `new Date(string)` with `UserFriendlyDate.safeParseToDate()`
- [ ] Replace `toLocaleDateString()` with `UserFriendlyDate.formatToLocalString()`
- [ ] Replace manual YYYY-MM-DD formatting with `UserFriendlyDate.toYMD()`
- [ ] Update validation to use `validatePurchaseDate()`
- [ ] Add error handling with user-friendly messages
- [ ] Update tests to cover new date handling patterns
- [ ] Verify calendar component integration
- [ ] Test CSV import/export functionality

## Common Pitfalls to Avoid

### 1. Direct Date Constructor Usage
```typescript
// ❌ Problematic
const date = new Date('15/01/2024'); // May parse as MM/DD/YYYY in some locales

// ✅ Correct
const result = UserFriendlyDate.parse('15/01/2024');
const date = result.success ? result.date : new Date();
```

### 2. Timezone Assumptions
```typescript
// ❌ Problematic
const dbDate = date.toISOString().slice(0, 10); // May shift date due to timezone

// ✅ Correct
const dbDate = UserFriendlyDate.toYMD(date); // Timezone-safe formatting
```

### 3. Generic Error Messages
```typescript
// ❌ Not helpful
if (isNaN(date.getTime())) {
  throw new Error('Invalid date');
}

// ✅ User-friendly
const result = UserFriendlyDate.parse(input);
if (!result.success) {
  throw new Error(`Format tanggal tidak valid: ${result.error}. Gunakan format DD/MM/YYYY`);
}
```

### 4. Missing Validation
```typescript
// ❌ No validation
const transformForDB = (data) => ({
  ...data,
  tanggal: UserFriendlyDate.toYMD(data.tanggal)
});

// ✅ With validation
const transformForDB = (data) => {
  const validation = validatePurchaseDate(data.tanggal);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  
  return {
    ...data,
    tanggal: UserFriendlyDate.toYMD(data.tanggal)
  };
};
```

## Performance Considerations

1. **Caching**: The `UserFriendlyDate` utility includes internal caching for repeated operations
2. **Lazy Evaluation**: Parse dates only when needed, not preemptively
3. **Batch Processing**: For large datasets, process dates in batches to avoid memory issues
4. **Memoization**: Cache formatted strings for repeated display operations

## Monitoring and Debugging

### 1. Error Tracking
```typescript
// Log date parsing failures for monitoring
const parseWithLogging = (input: any, context: string) => {
  const result = UserFriendlyDate.parse(input);
  
  if (!result.success) {
    logger.warn('Date parsing failed', {
      context,
      input: String(input),
      error: result.error,
      timestamp: new Date().toISOString()
    });
  }
  
  return result;
};
```

### 2. Debug Helpers
```typescript
// Development-only debugging
if (process.env.NODE_ENV === 'development') {
  window.debugDateHandling = {
    parse: UserFriendlyDate.parse,
    format: UserFriendlyDate.formatToLocalString,
    toYMD: UserFriendlyDate.toYMD,
    testInput: (input: any) => {
      console.log('Input:', input);
      const parsed = UserFriendlyDate.parse(input);
      console.log('Parsed:', parsed);
      if (parsed.success) {
        console.log('Formatted:', UserFriendlyDate.formatToLocalString(parsed.date));
        console.log('Database:', UserFriendlyDate.toYMD(parsed.date));
      }
    }
  };
}
```

## Conclusion

By following these standards, the purchase module ensures:

1. **Consistent user experience** with Indonesian date formats
2. **Reliable data processing** with robust error handling
3. **Database integrity** with standardized storage formats
4. **Maintainable code** with centralized date operations
5. **Better testing** with comprehensive edge case coverage

All developers working on the purchase module should refer to this document and use the `UserFriendlyDate` utility for any date-related operations.
