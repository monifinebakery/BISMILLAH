// 🎯 Entry point untuk Promo Calculator Module
// Barrel exports untuk semua komponen, hooks, services, dan utilities

// === MAIN LAYOUT COMPONENT ===
export { default as PromoCalculatorLayout } from './PromoCalculatorLayout';

// === TAB COMPONENTS ===
export { default as PromoCalculator } from './calculator/PromoCalculator';
export { default as PromoList } from './promoList/PromoList';
export { default as PromoAnalytics } from './analytics/PromoAnalytics';

// === UI COMPONENTS ===
// Export semua komponen reusable dari folder components
export * from './components';

// === HOOKS ===
// Export custom hooks untuk state management dan logic
export * from './hooks';

// === SERVICES ===
// Export API services dan data fetching functions
export * from './services';

// === CONTEXT ===
// Export React context providers dan consumers
export * from './context';

// === CONSTANTS ===
// Export konstanta dan konfigurasi
export * from './constants';

// === UTILITIES ===
// Export helper functions dan utilities
export * from './utils';

// === TYPES ===
// Uncomment jika ada file types khusus
// export * from './types';

// === DEFAULT EXPORT ===
// Export default untuk kemudahan import
export { default } from './PromoCalculatorLayout';

// === NAMED EXPORTS UNTUK CONVENIENCE ===
// Re-export dengan nama yang lebih jelas
export { 
  PromoCalculatorLayout as Layout,
  PromoCalculator as Calculator,
  PromoList as List,
  PromoAnalytics as Analytics 
};