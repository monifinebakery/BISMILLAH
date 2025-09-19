# Next Refactoring Priorities - File Kompleks di BISMILLAH

## 📊 Ringkasan Analisis

Berdasarkan analisis terhadap 10 file terbesar dalam direktori `src/`, berikut adalah hasil temuan:

| File | Lines | Functions | Complexity Score | Business Impact |
|------|-------|-----------|------------------|-----------------|
| `AutoLinkingPopup.tsx` | 903 | 52 | 🔴 Critical | 🟢 Medium |
| `IngredientsStep.tsx` | 842 | 46 | 🔴 Critical | 🟡 High |
| `OperationalCostContext.tsx` | 792 | 65 | 🔴 Critical | 🟡 High |
| `NetworkOptimizationDemo.tsx` | 811 | 45 | 🟡 High | 🔴 Low |
| `purchaseApi.ts` | 802 | 57 | 🟡 High | 🟡 High |

## 🎯 Prioritas Refactoring (Berdasarkan ROI)

### **PRIORITAS 1 - IngredientsStep.tsx** 
**Impact: HIGH | Effort: MEDIUM | ROI: EXCELLENT**

**Alasan Prioritas:**
- File yang paling sering digunakan dalam recipe management flow
- Sudah ada precedent dengan `EnhancedRecipeFormRefactored.tsx`
- High business impact - digunakan setiap kali membuat/edit resep
- Component form yang bisa dipecah dengan pola yang sudah proven

**Refactoring Opportunities:**
```
src/components/recipe/components/RecipeForm/
├── IngredientsStepRefactored.tsx          # Main orchestrator (200-250 lines)
├── hooks/
│   ├── useIngredientSelection.ts          # Ingredient selection logic
│   ├── useIngredientCalculation.ts        # Cost calculation & conversion
│   └── useIngredientValidation.ts         # Form validation
└── components/
    ├── IngredientSelector.tsx             # Dropdown selection UI
    ├── IngredientTable.tsx                # Table display component  
    ├── ConversionInfoPanel.tsx            # Unit conversion display
    └── IngredientSummary.tsx              # Cost summary component
```

**Estimated Effort:** 1-2 days  
**Expected Line Reduction:** 842 lines → ~600 lines (distributed)

---

### **PRIORITAS 2 - OperationalCostContext.tsx**
**Impact: HIGH | Effort: MEDIUM-HIGH | ROI: VERY GOOD**

**Alasan Prioritas:**
- Context dengan responsibility yang terlalu banyak (65 functions!)
- High business impact - mengatur costing di seluruh aplikasi
- Pola context splitting sudah proven di codebase lain
- Akan improve performance dengan context splitting

**Refactoring Opportunities:**
```
src/components/operational-costs/context/
├── OperationalCostContextRefactored.tsx   # Main provider (200-250 lines)
├── hooks/
│   ├── useOperationalCostQuery.ts         # Query logic (React Query)
│   ├── useOperationalCostMutation.ts      # CRUD operations
│   ├── useOperationalCostFilters.ts       # Filter & search logic
│   └── useAllocationSettings.ts           # Allocation-specific logic
└── contexts/
    ├── OperationalCostDataContext.tsx     # Data management
    └── OperationalCostUIContext.tsx       # UI state management
```

**Estimated Effort:** 2-3 days  
**Expected Line Reduction:** 792 lines → ~700 lines (distributed)

---

### **PRIORITAS 3 - AutoLinkingPopup.tsx**
**Impact: MEDIUM | Effort: HIGH | ROI: GOOD**

**Alasan Prioritas:**
- File terbesar dengan logic yang sangat kompleks
- Medium business impact - payment linking functionality
- Complex state management dengan timers & auto-retry logic
- Bagus untuk performance improvement, tapi tidak critical path

**Refactoring Opportunities:**
```
src/components/popups/
├── AutoLinkingPopupRefactored.tsx         # Main component (300-350 lines)
├── hooks/
│   ├── useAutoRetryLogic.ts               # Timer & auto-retry management
│   ├── usePaymentLinking.ts               # Payment linking operations
│   ├── usePaymentSelection.ts             # Payment selection state
│   └── useUserValidation.ts               # User ID validation logic
└── components/
    ├── PaymentSelectionList.tsx           # Payment selection UI
    ├── LinkingProgressDisplay.tsx         # Linking progress UI
    ├── AutoRetryCountdown.tsx             # Countdown timer UI
    └── LinkingResultsPanel.tsx            # Results display UI
```

**Estimated Effort:** 3-4 days  
**Expected Line Reduction:** 903 lines → ~800 lines (distributed)

---

## 🚀 Refactoring Template & Best Practices

### **Pola Refactoring yang Terbukti:**

1. **Hook Extraction Pattern**
   ```typescript
   // ✅ Extract complex logic into custom hooks
   const useComplexLogic = (dependencies) => {
     // Complex logic here
     return { 
       data, 
       actions: { create, update, delete },
       state: { loading, error }
     };
   };
   ```

2. **Component Decomposition Pattern**
   ```typescript
   // ✅ Break large components into focused sub-components
   const LargeComponent = () => {
     const logic = useComplexLogic();
     
     return (
       <div>
         <HeaderSection {...logic.headerData} />
         <MainSection {...logic.mainData} />
         <FooterSection {...logic.footerData} />
       </div>
     );
   };
   ```

3. **Context Splitting Pattern**
   ```typescript
   // ✅ Split large contexts by responsibility
   const DataProvider = ({ children }) => {
     // Data management only
   };
   
   const UIProvider = ({ children }) => {
     // UI state management only
   };
   ```

### **Quality Checklist:**
- ✅ TypeScript compilation success
- ✅ ESLint validation passed
- ✅ Build process successful
- ✅ Import resolution working
- ✅ Backward compatibility maintained
- ✅ Performance improvement measured

## 📅 Timeline Recommendation

**Sprint 1 (Week 1-2):** IngredientsStep.tsx refactoring  
**Sprint 2 (Week 3-4):** OperationalCostContext.tsx refactoring  
**Sprint 3 (Week 5-6):** AutoLinkingPopup.tsx refactoring  

## 🎯 Success Metrics

**Target Improvements:**
- 40-60% line reduction in main files
- 3-5 reusable hooks per refactored file
- 2-4 focused components per main component
- Zero breaking changes
- Improved bundle splitting opportunities

## ⚠️ Considerations

**Before Starting:**
- Ensure comprehensive testing of current functionality
- Document current behavior thoroughly
- Create feature flags for gradual rollout
- Plan rollback strategy

**During Refactoring:**
- Maintain 100% backward compatibility
- Follow existing naming conventions
- Keep interfaces consistent
- Test each extracted component independently

**After Completion:**
- Update documentation
- Remove old files after verification
- Update team guidelines with new patterns
- Measure performance improvements

---

**Prepared by:** Refactoring Analysis  
**Date:** Current Analysis  
**Based on:** EnhancedRecipeForm & WarehousePage refactoring success