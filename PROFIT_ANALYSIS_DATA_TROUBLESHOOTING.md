# 📊 Profit Analysis Data Troubleshooting Guide

## 🎯 Overview

This guide helps diagnose and fix issues with profit analysis data not appearing in the BISMILLAH application. The profit analysis system is a comprehensive module that calculates business profitability based on financial transactions, material costs, and operational expenses.

---

## 🔍 Quick Diagnosis Checklist

### ✅ **Data Prerequisites**
- [ ] User has financial transactions (income/revenue)
- [ ] User has material/ingredient cost data (bahan baku)
- [ ] User has operational costs configured
- [ ] User is properly authenticated

### ✅ **Navigation Access**
- [ ] Profit Analysis menu item visible in sidebar
- [ ] Route `/analisis-profit` is accessible
- [ ] No console errors when accessing the page

### ✅ **API Functionality**
- [ ] Database connections are working
- [ ] Stored functions are available
- [ ] User permissions are correct

---

## 🏗️ System Architecture

### **Components Flow**
```
User Input Data → API Services → Database → Calculations → UI Display
     ↓              ↓           ↓           ↓           ↓
• Financial      • profitAnalysisApi  • Supabase   • Real-time    • ProfitDashboard
• Warehouse      • financialApi       • Tables     • Calculations • Charts & Cards
• OpCosts        • warehouseApi       • Functions  • WAC Logic    • Breakdowns
```

### **Key Files Structure**
```
src/components/profitAnalysis/
├── components/
│   ├── ProfitDashboard.tsx          # Main dashboard component
│   ├── ProfitSummaryCards.tsx       # Summary metrics cards
│   ├── ProfitBreakdownChart.tsx     # Revenue/cost breakdowns
│   └── ProfitTrendChart.tsx         # Historical trends
├── hooks/
│   ├── useProfitAnalysis.ts         # Main data hook
│   ├── useProfitData.ts             # Data processing
│   └── useProfitCalculation.ts      # Calculations
├── services/
│   └── profitAnalysisApi.ts         # API service layer
├── contexts/
│   └── ProfitAnalysisContext.tsx    # React context
└── types/
    └── profitAnalysis.types.ts      # TypeScript types
```

---

## 🔧 Common Issues & Solutions

### **Issue 1: PGRST116 Error & "Pengaturan alokasi belum dikonfigurasi"**

**Symptoms:**
- Error: "JSON object requested, multiple (or no) rows returned"
- Error: "Pengaturan alokasi belum dikonfigurasi" (Allocation settings not configured)
- Overhead calculations failing

**Root Cause:**
Missing or incomplete `app_settings` table configuration required for overhead calculations.

**Quick Fix:**
```javascript
// Run this in browser console
// Copy content from: fix-app-settings-configuration.js
fixAppSettingsConfiguration();
```

**Manual Fix Steps:**
1. **Initialize App Settings**:
   - Go to Operational Costs → Calculator
   - Set target production (e.g., 1000 pcs/month)
   - Configure cost allocation

2. **Add Operational Costs**:
   - Add at least one HPP cost (e.g., Gas LPG)
   - Add at least one OPERASIONAL cost (e.g., Rent)
   - Ensure `group` column is properly set

3. **Verify Configuration**:
   - Check `app_settings` table has data
   - Confirm `overhead_per_pcs` and `operasional_per_pcs` are calculated

### **Issue 2: Empty Dashboard / No Data**

**Symptoms:**
- Profit dashboard shows empty state
- Loading indicators persist indefinitely
- "No data available" messages

**Diagnosis Steps:**
1. Check browser console for errors
2. Verify user authentication status
3. Check if financial data exists

**Solutions:**
```typescript
// 1. Add some test financial data
// Navigate to Financial Reports and add income transactions

// 2. Check API response in browser DevTools
// Network tab → Look for profit-analysis API calls

// 3. Verify database access
// Check Supabase dashboard for user data
```

### **Issue 2: Calculation Errors**

**Symptoms:**
- Wrong profit calculations
- Negative unexpected values
- Inconsistent COGS data

**Diagnosis Steps:**
1. Check if WAC (Weighted Average Cost) is enabled
2. Verify material cost data accuracy
3. Review operational cost setup

**Solutions:**
```typescript
// Enable WAC calculation
const { 
  currentAnalysis,
  profitMetrics,
  refreshWACData
} = useProfitAnalysis({
  enableWAC: true,           // ✅ Enable WAC
  autoCalculate: true,
  enableRealTime: true
});

// Refresh calculations
await refreshWACData();
```

### **Issue 3: Data Not Updating**

**Symptoms:**
- Stale data displayed
- Changes in other modules not reflected
- Manual refresh doesn't work

**Solutions:**
```typescript
// Force refresh all profit data
const handleForceRefresh = async () => {
  await Promise.all([
    refreshAnalysis(),
    refreshWACData(),
    queryClient.invalidateQueries(['profit-analysis'])
  ]);
};
```

### **Issue 4: Performance Issues**

**Symptoms:**
- Slow loading times
- UI freezes during calculations
- High memory usage

**Solutions:**
```typescript
// Optimize query with smaller date ranges
const { currentAnalysis } = useProfitAnalysis({
  mode: 'monthly',          // Instead of 'daily' for better performance
  autoCalculate: true,
  enableRealTime: false     // Disable for large datasets
});
```

---

## 🛠️ Debugging Tools

### **Console Debugging**
```javascript
// In browser console, check profit analysis state
console.log('Profit Analysis Debug:', {
  user: window.__APP_USER__,
  profitData: window.__PROFIT_DATA__,
  apiResponses: window.__API_RESPONSES__
});
```

### **API Testing**
```typescript
// Test API directly
import { profitAnalysisApi } from '@/components/profitAnalysis';

// Test current month calculation
const result = await profitAnalysisApi.getCurrentMonthProfit();
console.log('API Result:', result);
```

### **Data Validation**
```typescript
// Check data quality
import { validateFinancialData } from '@/utils/profitValidation';

const quality = validateFinancialData({
  revenue: 1000000,
  cogs: 300000,
  opex: 200000
});
console.log('Data Quality:', quality);
```

---

## 📊 Required Data Structure

### **Minimum Data Requirements**

**Financial Transactions:**
```sql
-- At least one income transaction
INSERT INTO financial_transactions (user_id, type, amount, category, description)
VALUES ('user_id', 'income', 500000, 'Penjualan', 'Penjualan hari ini');
```

**Material Costs (Bahan Baku):**
```sql
-- At least one material with cost
INSERT INTO bahan_baku (user_id, nama_bahan, harga_satuan, qty)
VALUES ('user_id', 'Tepung', 15000, 10);
```

**Operational Costs:**
```sql
-- At least one operational cost
INSERT INTO operational_costs (user_id, nama_biaya, jumlah_per_bulan, jenis)
VALUES ('user_id', 'Sewa Kios', 2000000, 'tetap');
```

### **Data Flow Validation**
```typescript
// Check if all required data exists
const dataValidation = {
  hasFinancialData: transactions.length > 0,
  hasMaterialData: materials.length > 0,
  hasOperationalData: costs.length > 0,
  hasCurrentPeriodData: currentPeriod && currentPeriod.length > 0
};

console.log('Data Validation:', dataValidation);
```

---

## 🚀 Quick Setup Guide

### **Step 1: Ensure Navigation Access**
```typescript
// Check if menu item exists in AppSidebar.tsx
{
  title: "Analisis Profit",
  url: "/analisis-profit", 
  icon: BarChart3
}
```

### **Step 2: Verify Route Configuration**
```typescript
// Check routes.tsx for profit analysis route
<Route 
  path="analisis-profit" 
  element={
    <RouteWrapper title="Memuat Analisis Profit">
      <ProfitAnalysisPage />
    </RouteWrapper>
  } 
/>
```

### **Step 3: Add Test Data**
```javascript
// Add sample data via browser console or Supabase dashboard
const sampleData = {
  income: { amount: 1000000, category: 'Penjualan' },
  material: { name: 'Bahan Utama', cost: 300000 },
  opex: { name: 'Biaya Rutin', amount: 200000 }
};
```

### **Step 4: Initialize Component**
```typescript
// Use ProfitDashboard component
import { ProfitDashboard } from '@/components/profitAnalysis';

<ProfitDashboard 
  defaultPeriod="2024-08"
  showAdvancedMetrics={true}
/>
```

---

## 🎛️ Configuration Options

### **Hook Configuration**
```typescript
const {
  currentAnalysis,
  profitHistory,
  loading,
  error,
  refreshAnalysis
} = useProfitAnalysis({
  autoCalculate: true,       // Auto-calculate on mount
  defaultPeriod: '2024-08',  // Current period
  enableRealTime: true,      // Real-time updates
  enableWAC: true,           // Weighted Average Cost
  mode: 'monthly'            // monthly | daily | yearly
});
```

### **API Configuration**
```typescript
// Service configuration
const apiConfig = {
  retryAttempts: 3,
  timeout: 30000,
  enableStoredFunctions: true,
  enableWACCalculation: true
};
```

---

## 📱 User Experience

### **Loading States**
The system provides proper loading indicators:
- Dashboard skeleton loading
- Chart loading animations
- Progressive data loading

### **Error Handling**
Comprehensive error messages:
- Network connectivity issues
- Data validation errors
- Calculation failures
- User-friendly Indonesian messages

### **Real-time Updates**
- Automatic refresh every 5 minutes
- Manual refresh capability
- Cross-module data synchronization

---

## 🔗 Related Documentation

- **Financial Module**: `/components/financial/README.md`
- **Warehouse Module**: `/components/warehouse/README.md`
- **Operational Costs**: `/components/operational-costs/README.md`
- **API Documentation**: `PROFIT_ANALYSIS_API.md`

---

## 🆘 Support

If data still doesn't appear after following this guide:

1. **Check Console Logs**: Look for specific error messages
2. **Verify Database**: Ensure Supabase connection is working
3. **Test with Sample Data**: Use the provided test data structure
4. **Contact Support**: Provide console logs and current data state

---

**Last Updated**: 2024-08-24
**Version**: 1.0.0
**Author**: System Documentation