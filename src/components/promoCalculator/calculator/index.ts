// 📁 components/promoCalculator/calculator/index.ts (Calculator Components)
export { default as PromoCalculator } from './PromoCalculator';
export { default as PromoPreview } from './PromoPreview';
export { default as PromoTypeSelector } from './PromoTypeSelector';

// Forms - lazy loaded only
const BogoForm = lazy(() => import('./forms/BogoForm'));
const BundleForm = lazy(() => import('./forms/BundleForm'));
// const DiscountForm = lazy(() => import('./forms/DiscountForm'));

// ---
