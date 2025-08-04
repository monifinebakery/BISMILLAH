// 📁 components/promoCalculator/index.ts (MAIN - Simplified)
// 🎯 Entry point - hanya re-export modules
export { default as PromoCalculatorLayout } from './PromoCalculatorLayout';
export { default } from './PromoCalculatorLayout';

// Re-export organized modules (tidak import individual components)
export * from './calculator';
export * from './promoList';
export * from './analytics';
export * from './components';
export * from './hooks';
export * from './services';
export * from './utils';
export * from './constants';
export * from './context';

// Named exports for convenience
export { 
  PromoCalculatorLayout as Layout
};