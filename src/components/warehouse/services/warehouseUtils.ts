// src/components/warehouse/services/warehouseUtils.ts (Updated for new schema)
/**

Warehouse Utility Functions (Updated for exact Supabase schema)
Simple helper functions with database field mapping
*/
import type { BahanBakuFrontend, FilterState, SortConfig, ValidationResult } from '../types';

export const warehouseUtils = {
// Data filtering (updated for new field names)
filterItems: (items: BahanBakuFrontend[], searchTerm: string, filters: FilterState): BahanBakuFrontend[] => {
let filtered = [...items];

// Search filter
if (searchTerm) {
const term = searchTerm.toLowerCase();
filtered = filtered.filter(item =>
item.nama.toLowerCase().includes(term) ||
item.kategori?.toLowerCase().includes(term) ||
item.supplier?.toLowerCase().includes(term)
);
}

// Category filter
if (filters.category) {
filtered = filtered.filter(item => item.kategori === filters.category);
}

// Supplier filter
if (filters.supplier) {
filtered = filtered.filter(item => item.supplier === filters.supplier);
}

// Stock level filter
if (filters.stockLevel === 'low') {
filtered = filtered.filter(item => item.stok <= item.minimum);
} else if (filters.stockLevel === 'out') {
filtered = filtered.filter(item => item.stok === 0);
}

// Expiry filter (using tanggal_kadaluwarsa -> expiry)
if (filters.expiry === 'expiring') {
const threshold = new Date();
threshold.setDate(threshold.getDate() + 30);
filtered = filtered.filter(item => {
if (!item.expiry) return false;
const expiryDate = new Date(item.expiry);
return expiryDate <= threshold && expiryDate > new Date();
});
} else if (filters.expiry === 'expired') {
filtered = filtered.filter(item => {
if (!item.expiry) return false;
return new Date(item.expiry) < new Date();
});
}

return filtered;
},

// Data sorting (updated for new field names)
sortItems: (items: BahanBakuFrontend[], sortConfig: SortConfig): BahanBakuFrontend[] => {
return [...items].sort((a, b) => {
const aValue = a[sortConfig.key];
const bValue = b[sortConfig.key];

if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
return 0;
});
},

// Extract unique values for filters
getUniqueCategories: (items: BahanBakuFrontend[]): string[] => {
const categories = new Set(items.map(item => item.kategori).filter(Boolean));
return Array.from(categories).sort();
},

getUniqueSuppliers: (items: BahanBakuFrontend[]): string[] => {
const suppliers = new Set(items.map(item => item.supplier).filter(Boolean));
return Array.from(suppliers).sort();
},

// Analysis functions (updated for new field names)
getLowStockItems: (items: BahanBakuFrontend[]): BahanBakuFrontend[] => {
return items.filter(item => item.stok <= item.minimum);
},

getOutOfStockItems: (items: BahanBakuFrontend[]): BahanBakuFrontend[] => {
return items.filter(item => item.stok === 0);
},

getExpiringItems: (items: BahanBakuFrontend[], days: number = 30): BahanBakuFrontend[] => {
const threshold = new Date();
threshold.setDate(threshold.getDate() + days);

return items.filter(item => {
if (!item.expiry) return false;
const expiryDate = new Date(item.expiry);
return expiryDate <= threshold && expiryDate > new Date();
});
},

// Validation (updated for new field names)
validateBahanBaku: (data: Partial<BahanBakuFrontend>): ValidationResult => {
const errors: string[] = [];

if (!data.nama?.trim()) {
errors.push('Nama bahan baku harus diisi');
}

if (!data.kategori?.trim()) {
errors.push('Kategori harus diisi');
}

if (!data.supplier?.trim()) {
errors.push('Supplier harus diisi');
}

if (typeof data.stok !== 'number' || data.stok < 0) {
errors.push('Stok harus berupa angka positif');
}

if (typeof data.minimum !== 'number' || data.minimum < 0) {
errors.push('Minimum stok harus berupa angka positif');
}

if (!data.satuan?.trim()) {
errors.push('Satuan harus diisi');
}

if (typeof data.harga !== 'number' || data.harga < 0) {
errors.push('Harga satuan harus berupa angka positif');
}

// Validate expiry date if provided
if (data.expiry && data.expiry.trim()) {
const expiryDate = new Date(data.expiry);
if (isNaN(expiryDate.getTime())) {
errors.push('Format tanggal kadaluarsa tidak valid');
}
}

// Validate packaging fields if provided
if (data.jumlahBeliKemasan !== undefined && data.jumlahBeliKemasan < 0) {
errors.push('Jumlah beli kemasan harus berupa angka positif');
}

if (data.isiPerKemasan !== undefined && data.isiPerKemasan <= 0) {
errors.push('Isi per kemasan harus lebih dari 0');
}

if (data.hargaTotalBeliKemasan !== undefined && data.hargaTotalBeliKemasan < 0) {
errors.push('Harga total beli kemasan harus berupa angka positif');
}

// Validate unit consistency
if (data.satuan && data.unitIsi) {
const massUnits = ['gram', 'kg', 'ton'];
const volumeUnits = ['ml', 'liter', 'm³'];

const isBaseMass = massUnits.includes(data.satuan);
const isBaseVolume = volumeUnits.includes(data.satuan);
const isContentMass = massUnits.includes(data.unitIsi);
const isContentVolume = volumeUnits.includes(data.unitIsi);

if ((isBaseMass && !isContentMass) || (isBaseVolume && !isContentVolume)) {
errors.push('Satuan dasar dan satuan isi harus dari kategori yang sama (massa atau volume)');
}
}

return {
isValid: errors.length === 0,
errors
};
},

// Formatting helpers (updated for new field names)
formatCurrency: (amount: number): string => {
return new Intl.NumberFormat('id-ID', {
style: 'currency',
currency: 'IDR',
minimumFractionDigits: 0,
}).format(amount);
},

formatDate: (date: string | Date): string => {
const dateObj = typeof date === 'string' ? new Date(date) : date;
return new Intl.DateTimeFormat('id-ID', {
year: 'numeric',
month: 'short',
day: 'numeric',
}).format(dateObj);
},

formatStockLevel: (current: number, minimum: number): {
level: 'high' | 'medium' | 'low' | 'out';
percentage: number;
color: string;
} => {
if (current === 0) {
return { level: 'out', percentage: 0, color: 'red' };
}

const percentage = (current / (minimum * 2)) * 100;

if (current <= minimum) {
return { level: 'low', percentage, color: 'red' };
} else if (current <= minimum * 1.5) {
return { level: 'medium', percentage, color: 'yellow' };
} else {
return { level: 'high', percentage, color: 'green' };
}
},

// Export helpers (updated for new field names)
prepareExportData: (items: BahanBakuFrontend[]) => {
return items.map(item => ({
'Nama': item.nama,
'Kategori': item.kategori,
'Supplier': item.supplier,
'Stok': item.stok,
'Minimum': item.minimum,
'Satuan': item.satuan,
'Harga Satuan': warehouseUtils.formatCurrency(item.harga),
'Tanggal Kadaluarsa': item.expiry ? warehouseUtils.formatDate(item.expiry) : '-',
'Jumlah Beli Kemasan': item.jumlahBeliKemasan || '-',
'Isi Per Kemasan': item.isiPerKemasan || '-',
'Satuan Isi': item.unitIsi || '-',
'Satuan Kemasan': item.satuanKemasan || '-',
'Harga Total Beli Kemasan': item.hargaTotalBeliKemasan ? warehouseUtils.formatCurrency(item.hargaTotalBeliKemasan) : '-',
'Dibuat': warehouseUtils.formatDate(item.createdAt),
'Diupdate': warehouseUtils.formatDate(item.updatedAt),
}));
},

// Pagination helpers
paginateItems: <T>(items: T[], page: number, itemsPerPage: number) => {
const startIndex = (page - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;

return {
items: items.slice(startIndex, endIndex),
totalPages: Math.ceil(items.length / itemsPerPage),
startIndex,
endIndex: Math.min(endIndex, items.length),
currentPage: page,
totalItems: items.length,
};
},

// Performance helpers
debounce: <T extends (...args: any[]) => any>(
func: T,
delay: number
): ((...args: Parameters<T>) => void) => {
let timeoutId: NodeJS.Timeout;

return (...args: Parameters<T>) => {
clearTimeout(timeoutId);
timeoutId = setTimeout(() => func(...args), delay);
};
},

throttle: <T extends (...args: any[]) => any>(
func: T,
delay: number
): ((...args: Parameters<T>) => void) => {
let lastExecTime = 0;

return (...args: Parameters<T>) => {
const currentTime = Date.now();

if (currentTime - lastExecTime >= delay) {
func(...args);
lastExecTime = currentTime;
}
};
},

// Calculate packaging metrics
calculatePackagingMetrics: (item: BahanBakuFrontend) => {
const metrics = {
unitCostFromPackage: 0,
packagingEfficiency: 0,
totalValue: item.stok * item.harga,
totalContent: 0,
};

// Calculate unit cost from packaging if data is available
if (item.jumlahBeliKemasan && item.isiPerKemasan && item.hargaTotalBeliKemasan &&
item.jumlahBeliKemasan > 0 && item.isiPerKemasan > 0) {
metrics.totalContent = item.jumlahBeliKemasan * item.isiPerKemasan;
metrics.unitCostFromPackage = item.hargaTotalBeliKemasan / metrics.totalContent;

// Calculate efficiency (lower is better)
if (item.harga > 0) {
metrics.packagingEfficiency = (metrics.unitCostFromPackage / item.harga) * 100;
}
}

return metrics;
},

// Stock management helpers
suggestReorderQuantity: (item: BahanBakuFrontend, avgUsagePerDay: number = 1): number => {
// Simple reorder calculation: enough for 30 days + safety stock
const safetyStock = item.minimum;
const thirtyDaysStock = avgUsagePerDay * 30;
const currentShortfall = Math.max(0, item.minimum - item.stok);

return Math.ceil(thirtyDaysStock + safetyStock + currentShortfall);
},

// Generate stock report data
generateStockReport: (items: BahanBakuFrontend[]) => {
const totalItems = items.length;
const lowStockItems = warehouseUtils.getLowStockItems(items);
const outOfStockItems = warehouseUtils.getOutOfStockItems(items);
const expiringItems = warehouseUtils.getExpiringItems(items, 30);

const totalValue = items.reduce((sum, item) => sum + (item.stok * item.harga), 0);
const averageStockLevel = items.reduce((sum, item) => sum + item.stok, 0) / totalItems;

const categoryBreakdown = items.reduce((acc, item) => {
acc[item.kategori] = (acc[item.kategori] || 0) + 1;
return acc;
}, {} as Record<string, number>);

return {
summary: {
totalItems,
lowStockCount: lowStockItems.length,
outOfStockCount: outOfStockItems.length,
expiringCount: expiringItems.length,
totalValue,
averageStockLevel: Math.round(averageStockLevel),
},
categories: categoryBreakdown,
alerts: {
lowStock: lowStockItems,
outOfStock: outOfStockItems,
expiring: expiringItems,
}
};
},

// Unit conversion helpers
convertUnit: (value: number, fromUnit: string, toUnit: string): number => {
const conversionFactors: Record<string, number> = {
// Mass conversions
'kg': 1000, // kg to gram
'ton': 1000000, // ton to gram

// Volume conversions
'liter': 1000, // liter to ml
'm³': 1000000, // m³ to ml
};

if (fromUnit === toUnit) return value;

// Convert to base unit first
const baseValue = fromUnit in conversionFactors ?
value * conversionFactors[fromUnit] : value;

// Convert from base unit to target unit
const targetFactor = conversionFactors[toUnit];
if (targetFactor) {
return baseValue / targetFactor;
}

// If no conversion factor found, return original value
return value;
},

// Validate unit compatibility
areUnitsCompatible: (unit1: string, unit2: string): boolean => {
const massUnits = ['gram', 'kg', 'ton'];
const volumeUnits = ['ml', 'liter', 'm³'];

const isMass1 = massUnits.includes(unit1);
const isMass2 = massUnits.includes(unit2);
const isVolume1 = volumeUnits.includes(unit1);
const isVolume2 = volumeUnits.includes(unit2);

return (isMass1 && isMass2) || (isVolume1 && isVolume2);
},
};

export default warehouseUtils;