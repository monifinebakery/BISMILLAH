# 🚀 Profit Analysis Data Implementation Guide

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Data Setup](#data-setup)
3. [Component Integration](#component-integration)
4. [Testing & Validation](#testing--validation)
5. [Common Fixes](#common-fixes)

---

## 🚀 Quick Start

### **1. Verify Navigation Setup**

Check that the profit analysis page is accessible via the menu:

```typescript
// File: src/components/AppSidebar.tsx
// Look for this menu item in the "Laporan & Analisis" section:
{
  title: "Analisis Profit",
  url: "/analisis-profit", 
  icon: BarChart3
}
```

### **2. Access the Page**

Navigate to: `http://localhost:5173/analisis-profit`

Expected behavior:
- ✅ Page loads without errors
- ✅ Shows "Untung Rugi Warung" header
- ✅ Displays loading state initially
- ⚠️ May show "No data" if user hasn't entered financial data yet

---

## 📊 Data Setup

### **Step 1: Add Financial Transactions**

The profit analysis requires income data to calculate revenue:

```sql
-- Example: Add income transaction via Supabase dashboard
INSERT INTO financial_transactions (
  user_id, 
  type, 
  amount, 
  category, 
  description, 
  transaction_date
) VALUES (
  'your-user-id', 
  'income', 
  500000, 
  'Penjualan', 
  'Penjualan makanan hari ini',
  '2024-08-24'
);
```

**Via UI**: Go to Financial Reports → Add Income Transaction

### **Step 2: Add Material Costs (Bahan Baku)**

Add ingredient/material costs for COGS calculation:

```sql
-- Example: Add material cost
INSERT INTO bahan_baku (
  user_id,
  nama_bahan,
  harga_satuan,
  qty,
  satuan
) VALUES (
  'your-user-id',
  'Tepung Terigu',
  15000,
  10,
  'kg'
);
```

**Via UI**: Go to Warehouse → Add Materials

### **Step 3: Add Operational Costs**

Add fixed monthly costs for OpEx calculation:

```sql
-- Example: Add operational cost
INSERT INTO operational_costs (
  user_id,
  nama_biaya,
  jumlah_per_bulan,
  jenis,
  'group'
) VALUES (
  'your-user-id',
  'Sewa Kios',
  2000000,
  'tetap',
  'OPERASIONAL'
);
```

**Via UI**: Go to Operational Costs → Add Cost

---

## 🛠️ Component Integration

### **Using the Main Dashboard Component**

```typescript
// File: src/pages/ProfitAnalysisPage.tsx
import React from 'react';
import { ProfitDashboard } from '@/components/profitAnalysis';

const ProfitAnalysisPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <ProfitDashboard 
        defaultPeriod="2024-08"
        showAdvancedMetrics={true}
        className="container mx-auto"
      />
    </div>
  );
};

export default ProfitAnalysisPage;
```

### **Using the Hook for Custom Components**

```typescript
// Example: Custom profit summary component
import React from 'react';
import { useProfitAnalysis } from '@/components/profitAnalysis/hooks/useProfitAnalysis';

const ProfitSummary = () => {
  const {
    currentAnalysis,
    loading,
    error,
    profitMetrics,
    refreshAnalysis
  } = useProfitAnalysis({
    autoCalculate: true,
    enableWAC: true,
    enableRealTime: true
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!currentAnalysis) return <div>No data available</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Profit Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-600">Revenue</p>
          <p className="text-2xl font-bold text-green-600">
            Rp {currentAnalysis.revenue_data.total.toLocaleString('id-ID')}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600">COGS</p>
          <p className="text-2xl font-bold text-orange-600">
            Rp {(profitMetrics?.cogs || currentAnalysis.cogs_data.total).toLocaleString('id-ID')}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600">Net Profit</p>
          <p className="text-2xl font-bold text-blue-600">
            Rp {(currentAnalysis.revenue_data.total - (profitMetrics?.cogs || currentAnalysis.cogs_data.total) - currentAnalysis.opex_data.total).toLocaleString('id-ID')}
          </p>
        </div>
      </div>
      
      <button 
        onClick={refreshAnalysis}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Refresh Data
      </button>
    </div>
  );
};

export default ProfitSummary;
```

### **Context Provider Setup**

Ensure the context provider is properly configured:

```typescript
// File: src/App.tsx or main layout
import { ProfitAnalysisProvider } from '@/components/profitAnalysis/contexts/ProfitAnalysisContext';

<ProfitAnalysisProvider autoRefresh={true} refreshInterval={300000}>
  {/* Your app components */}
  <Routes>
    <Route path="/analisis-profit" element={<ProfitAnalysisPage />} />
  </Routes>
</ProfitAnalysisProvider>
```

---

## 🧪 Testing & Validation

### **1. API Testing**

Test the API directly in browser console:

```javascript
// Open browser console on profit analysis page
// Test current month profit calculation
fetch('/api/profit-analysis/current', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('sb-token')
  }
})
.then(response => response.json())
.then(data => console.log('API Response:', data));
```

### **2. Component State Testing**

Check component state in React DevTools:

```javascript
// Look for these components in React DevTools:
// - ProfitAnalysisProvider
// - ProfitDashboard
// - useProfitAnalysis hook

// Check state values:
// - currentAnalysis: should have revenue_data, cogs_data, opex_data
// - loading: should be false when data loaded
// - error: should be null if no errors
```

### **3. Data Validation**

```typescript
// Add this to your component for debugging
useEffect(() => {
  console.log('Profit Analysis Debug:', {
    currentAnalysis,
    profitMetrics,
    loading,
    error,
    hasData: !!currentAnalysis?.revenue_data?.total
  });
}, [currentAnalysis, profitMetrics, loading, error]);
```

### **4. Network Testing**

Check network requests in browser DevTools:

- Look for requests to `/api/profit-analysis/*`
- Check request/response payloads
- Verify authentication headers
- Look for any 4xx/5xx errors

---

## 🔧 Common Fixes

### **Fix 1: Empty Data State**

**Problem**: Dashboard shows "No data available"

**Solution**:
```typescript
// 1. Check if user has any financial transactions
const hasTransactions = await supabase
  .from('financial_transactions')
  .select('count')
  .eq('user_id', user.id)
  .eq('type', 'income');

// 2. If no transactions, add sample data
if (hasTransactions.count === 0) {
  await supabase
    .from('financial_transactions')
    .insert({
      user_id: user.id,
      type: 'income',
      amount: 500000,
      category: 'Penjualan',
      description: 'Test transaction'
    });
}

// 3. Refresh the analysis
await refreshAnalysis();
```

### **Fix 2: Calculation Errors**

**Problem**: Wrong profit calculations or negative values

**Solution**:
```typescript
// Enable WAC (Weighted Average Cost) for more accurate COGS
const { currentAnalysis } = useProfitAnalysis({
  enableWAC: true,
  autoCalculate: true
});

// Or manually recalculate with validation
import { safeCalculateMargins } from '@/utils/profitValidation';

const margins = safeCalculateMargins(
  revenue,
  cogs,
  opex
);
```

### **Fix 3: Loading State Issues**

**Problem**: Infinite loading or stuck loading states

**Solution**:
```typescript
// Add timeout and error handling
const {
  currentAnalysis,
  loading,
  error
} = useProfitAnalysis({
  autoCalculate: true,
  enableRealTime: false // Disable for debugging
});

// Add manual timeout
useEffect(() => {
  const timeout = setTimeout(() => {
    if (loading) {
      console.warn('Profit analysis loading timeout');
      // Force refresh or show error
    }
  }, 30000); // 30 second timeout

  return () => clearTimeout(timeout);
}, [loading]);
```

### **Fix 4: Permission Issues**

**Problem**: 403/401 errors when fetching data

**Solution**:
```typescript
// Check user authentication
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  // Redirect to login
  window.location.href = '/auth';
  return;
}

// Check database policies in Supabase dashboard
// Ensure user can access their own data in:
// - financial_transactions
// - bahan_baku
// - operational_costs
```

### **Fix 5: Date Range Issues**

**Problem**: Data appears for wrong periods

**Solution**:
```typescript
// Use consistent date formatting
import { getCurrentPeriod } from '@/components/profitAnalysis/utils/profitTransformers';

const currentPeriod = getCurrentPeriod(); // Returns YYYY-MM format
console.log('Current period:', currentPeriod);

// Filter data by current period
const { currentAnalysis } = useProfitAnalysis({
  defaultPeriod: currentPeriod,
  mode: 'monthly'
});
```

---

## 🎯 Expected Results

After following this guide, you should see:

### **Dashboard View**
- ✅ Header: "Untung Rugi Warung"
- ✅ Quick status: Profit/loss amount and COGS percentage
- ✅ Summary cards: Revenue, COGS, OpEx, Net Profit
- ✅ Charts: Breakdown chart and trend chart
- ✅ Tabs: Overview, Trends, Detailed breakdown

### **Data Flow**
- ✅ Real-time calculations based on actual transactions
- ✅ WAC-based COGS calculations for accuracy
- ✅ Proper date filtering by period
- ✅ Cross-module data synchronization

### **User Experience**
- ✅ Responsive design on mobile/desktop
- ✅ Loading states during calculations
- ✅ Error messages in Indonesian
- ✅ Tooltips explaining metrics
- ✅ Refresh functionality

---

## 📞 Support

If you still experience issues:

1. **Console Logs**: Copy all error messages from browser console
2. **Network Tab**: Check API requests and responses
3. **Database Check**: Verify data exists in Supabase tables
4. **User State**: Confirm user authentication and permissions

---

**Implementation Checklist**:
- [ ] Navigation menu includes profit analysis link
- [ ] Route is properly configured
- [ ] User has financial transaction data
- [ ] User has material cost data  
- [ ] User has operational cost data
- [ ] Component loads without console errors
- [ ] Data displays correctly in dashboard
- [ ] Calculations are accurate
- [ ] Refresh functionality works

---

**Last Updated**: 2024-08-24
**Version**: 1.0.0