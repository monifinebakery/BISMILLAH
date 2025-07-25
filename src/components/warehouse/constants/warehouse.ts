export const UNIT_CONVERSION_MAP: { [baseUnit: string]: { [purchaseUnit: string]: number } } = {
  'gram': { 'kg': 1000, 'gram': 1, 'pon': 453.592, 'ons': 28.3495 },
  'ml': { 'liter': 1000, 'ml': 1, 'galon': 3785.41 },
  'pcs': { 'pcs': 1, 'lusin': 12, 'gross': 144, 'box': 1, 'bungkus': 1 },
  'butir': { 'butir': 1, 'tray': 30, 'lusin': 12 },
  'kg': { 'gram': 0.001, 'kg': 1, 'pon': 0.453592 },
  'liter': { 'ml': 0.001, 'liter': 1 },
};

export const AVAILABLE_UNITS = [
  'kg', 'liter', 'pcs', 'bungkus', 'karung', 'box', 
  'tray', 'lusin', 'butir', 'gram', 'ml', 'pon', 'ons', 'galon'
];

export const DEFAULT_ITEMS_PER_PAGE = 10;
export const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];