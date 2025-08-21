// src/components/promoCalculator/calculator/index.ts - Optimized Dependencies (5 → 3)
/**
 * PromoCalculator Components - Essential Calculator Components
 * 
 * HANYA export components yang benar-benar diperlukan untuk calculator functionality
 * Dependencies reduced from 5 to 3
 */

import React, { lazy } from 'react'; // ⚠️ HARUS DITAMBAHKAN

// ✅ CORE CALCULATOR COMPONENTS: Always needed
export { default as PromoCalculator } from './PromoCalculator';
export { default as PromoTypeSelector } from './PromoTypeSelector';

// ✅ PREVIEW COMPONENT: Commonly used with calculator
export { default as PromoPreview } from './PromoPreview';

// ❌ REMOVED - Better code splitting:
// - Form components (use lazy loading instead of barrel exports)
// - Internal utilities (import directly if needed)

// ✅ LAZY FORM COMPONENTS: Load on demand for better performance
export const PROMO_CALCULATOR_FORMS = {
  // Individual form loaders
  BogoForm: () => import('./forms/BogoForm').catch(() => ({
    default: () => (
      <div className="p-4 text-center text-red-500">
        Gagal memuat BOGO Form
      </div>
    )
  })),
  
  BundleForm: () => import('./forms/BundleForm').catch(() => ({
    default: () => (
      <div className="p-4 text-center text-red-500">
        Gagal memuat Bundle Form
      </div>
    )
  })),
  
  DiscountForm: () => import('./forms/DiscountForm').catch(() => ({
    default: () => (
      <div className="p-4 text-center text-red-500">
        Gagal memuat Discount Form
      </div>
    )
  })),
  
  // Batch form loader
  all: () => Promise.all([
    import('./forms/BogoForm'),
    import('./forms/BundleForm'),
    import('./forms/DiscountForm')
  ]).then(([bogo, bundle, discount]) => ({
    BogoForm: bogo.default,
    BundleForm: bundle.default,
    DiscountForm: discount.default
  })).catch(() => ({
    BogoForm: () => <div>Error loading forms</div>,
    BundleForm: () => <div>Error loading forms</div>,
    DiscountForm: () => <div>Error loading forms</div>
  }))
} as const;

// ✅ CALCULATOR GROUPS: For batch loading related components
export const PROMO_CALCULATOR_GROUPS = {
  // Core calculator - main functionality
  core: () => Promise.all([
    import('./PromoCalculator'),
    import('./PromoTypeSelector')
  ]).then(([calc, selector]) => ({
    PromoCalculator: calc.default,
    PromoTypeSelector: selector.default
  })),
  
  // Calculator with preview - complete calculator experience
  withPreview: () => Promise.all([
    import('./PromoCalculator'),
    import('./PromoTypeSelector'),
    import('./PromoPreview')
  ]).then(([calc, selector, preview]) => ({
    PromoCalculator: calc.default,
    PromoTypeSelector: selector.default,
    PromoPreview: preview.default
  })),
  
  // Complete calculator with forms - full functionality
  complete: async () => {
    const [core, forms] = await Promise.all([
      PROMO_CALCULATOR_GROUPS.withPreview(),
      PROMO_CALCULATOR_FORMS.all()
    ]);
    
    return {
      ...core,
      ...forms
    };
  }
} as const;

// ✅ FORM UTILITIES: Helper functions for form management
export const PROMO_FORM_UTILS = {
  // Get form component by promo type
  getFormByType: async (promoType: 'bogo' | 'bundle' | 'discount') => {
    const formMap = {
      bogo: PROMO_CALCULATOR_FORMS.BogoForm,
      bundle: PROMO_CALCULATOR_FORMS.BundleForm,
      discount: PROMO_CALCULATOR_FORMS.DiscountForm
    };
    
    const formLoader = formMap[promoType];
    if (!formLoader) {
      throw new Error(`Unknown promo type: ${promoType}`);
    }
    
    const module = await formLoader();
    return module.default;
  },
  
  // Preload specific forms
  preloadForms: (promoTypes: Array<'bogo' | 'bundle' | 'discount'>) => {
    return Promise.all(
      promoTypes.map(type => PROMO_FORM_UTILS.getFormByType(type))
    );
  },
  
  // Get all available form types
  getAvailableFormTypes: () => ['bogo', 'bundle', 'discount'] as const
} as const;

// ✅ CALCULATOR CONSTANTS: Calculator-specific constants
export const CALCULATOR_CONSTANTS = {
  // Promo types
  promoTypes: {
    BOGO: 'bogo',
    BUNDLE: 'bundle', 
    DISCOUNT: 'discount'
  } as const,
  
  // Default values
  defaults: {
    promoType: 'discount' as const,
    calculation: {
      originalPrice: 0,
      discountPercent: 0,
      finalPrice: 0
    }
  },
  
  // Form validation
  validation: {
    minDiscount: 1,
    maxDiscount: 99,
    minPrice: 1,
    maxPrice: 1000000000
  }
} as const;

// ✅ MIGRATION HELPER: For calculator component usage
export const PROMO_CALCULATOR_MIGRATION = {
  instructions: `
    // RECOMMENDED (current pattern - static components):
    import { PromoCalculator, PromoTypeSelector } from '@/components/promoCalculator/calculator';
    
    // FOR FORMS (lazy loading - better performance):
    const BogoForm = React.lazy(() => PROMO_CALCULATOR_FORMS.BogoForm());
    const BundleForm = React.lazy(() => PROMO_CALCULATOR_FORMS.BundleForm());
    
    // OR (group loading - batch imports):
    const { PromoCalculator, PromoTypeSelector, PromoPreview } = await PROMO_CALCULATOR_GROUPS.withPreview();
    const forms = await PROMO_CALCULATOR_FORMS.all();
    
    // DYNAMIC FORM LOADING:
    const FormComponent = await PROMO_FORM_UTILS.getFormByType('bogo');
  `,
  
  // Quick setup for common calculator usage
  getCalculatorSetup: async () => {
    const core = await PROMO_CALCULATOR_GROUPS.withPreview();
    
    return {
      components: core,
      formUtils: PROMO_FORM_UTILS,
      constants: CALCULATOR_CONSTANTS
    };
  }
} as const;