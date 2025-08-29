// src/components/purchase/hooks/__tests__/useSupplierAutoSave.test.ts

import { renderHook, act } from '@testing-library/react-hooks';
import { useSupplierAutoSave } from '../useSupplierAutoSave';
import { useSupplier } from '@/contexts/SupplierContext';

// Mock dependencies
jest.mock('@/contexts/SupplierContext', () => ({
  useSupplier: jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('useSupplierAutoSave', () => {
  const mockSuppliers = [
    {
      id: 'supplier-1',
      nama: 'Supplier Test 1',
      kontak: 'Contact 1',
      email: 'test1@example.com',
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'supplier-2',
      nama: 'Supplier Test 2',
      kontak: 'Contact 2',
      email: 'test2@example.com',
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Mock setup
  const mockAddSupplier = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock implementation
    (useSupplier as jest.Mock).mockReturnValue({
      suppliers: mockSuppliers,
      addSupplier: mockAddSupplier,
    });
  });

  test('findSupplierByName should find existing supplier case-insensitive', () => {
    const { result } = renderHook(() => useSupplierAutoSave());
    
    // Test exact match
    expect(result.current.findSupplierByName('Supplier Test 1')).toEqual(mockSuppliers[0]);
    
    // Test case-insensitive match
    expect(result.current.findSupplierByName('supplier test 1')).toEqual(mockSuppliers[0]);
    
    // Test non-existent supplier
    expect(result.current.findSupplierByName('Non-existent Supplier')).toBeNull();
    
    // Test empty input
    expect(result.current.findSupplierByName('')).toBeNull();
  });

  test('autoSaveSupplier should not create duplicate for existing supplier', async () => {
    mockAddSupplier.mockResolvedValue({ ...mockSuppliers[0] });
    
    const { result } = renderHook(() => useSupplierAutoSave());
    
    // Should find existing supplier and return its ID
    let savedId;
    await act(async () => {
      savedId = await result.current.autoSaveSupplier('Supplier Test 1');
    });
    
    expect(savedId).toBe('supplier-1');
    expect(mockAddSupplier).not.toHaveBeenCalled();
  });

  test('autoSaveSupplier should create new supplier if it does not exist', async () => {
    const newSupplier = {
      id: 'new-supplier-id',
      nama: 'New Supplier',
      kontak: '',
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockAddSupplier.mockResolvedValue(newSupplier);
    
    const { result } = renderHook(() => useSupplierAutoSave());
    
    let savedId;
    await act(async () => {
      savedId = await result.current.autoSaveSupplier('New Supplier');
    });
    
    expect(savedId).toBe('new-supplier-id');
    expect(mockAddSupplier).toHaveBeenCalledWith({
      nama: 'New Supplier',
      kontak: '',
      email: undefined,
      telepon: undefined,
      alamat: undefined,
      catatan: 'Auto-created from purchase',
    });
  });

  test('getOrCreateSupplierId should return existing ID or create new supplier', async () => {
    const newSupplier = {
      id: 'another-new-id',
      nama: 'Another New Supplier',
      kontak: '',
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockAddSupplier.mockResolvedValue(newSupplier);
    
    const { result } = renderHook(() => useSupplierAutoSave());
    
    // Should find existing supplier
    let existingId;
    await act(async () => {
      existingId = await result.current.getOrCreateSupplierId('Supplier Test 2');
    });
    expect(existingId).toBe('supplier-2');
    expect(mockAddSupplier).not.toHaveBeenCalled();
    
    // Should create new supplier
    let newId;
    await act(async () => {
      newId = await result.current.getOrCreateSupplierId('Another New Supplier');
    });
    expect(newId).toBe('another-new-id');
    expect(mockAddSupplier).toHaveBeenCalledTimes(1);
  });

  test('autoSaveSupplier should handle error cases', async () => {
    // Test when addSupplier fails
    mockAddSupplier.mockRejectedValue(new Error('Failed to add supplier'));
    
    const { result } = renderHook(() => useSupplierAutoSave());
    
    let savedId;
    await act(async () => {
      savedId = await result.current.autoSaveSupplier('Failed Supplier');
    });
    
    expect(savedId).toBeNull();
    expect(mockAddSupplier).toHaveBeenCalled();
  });
});
