# 📊 Profit Analysis Data Setup Guide

## 🎯 Overview

This guide ensures that profit analysis data appears correctly in the BISMILLAH application. The profit analysis module calculates business profitability by analyzing revenue, costs, and expenses.

## 🚀 Quick Setup (5 Minutes)

### Step 1: Navigate to Profit Analysis
```
Go to: Menu → Laporan & Analisis → Analisis Profit
Or visit: http://localhost:5173/analisis-profit
```

### Step 2: Check for Data
If you see "No data available", you need to add sample data.

### Step 3: Add Sample Data (Automatic)
1. Open browser console (F12)
2. Copy and paste the seeder script:
```javascript
// Copy content from: profit-analysis-seeder.js
seedProfitAnalysisData();
```

### Step 4: Verify Results
After seeding, you should see:
- Revenue: ~Rp 1,880,000
- COGS: ~Rp 405,000
- Net Profit: Positive value
- Charts and breakdowns

## 📁 Documentation Files

| File | Purpose |
|------|---------|
| `PROFIT_ANALYSIS_DATA_TROUBLESHOOTING.md` | Complete troubleshooting guide |
| `PROFIT_ANALYSIS_IMPLEMENTATION_GUIDE.md` | Step-by-step implementation |
| `profit-analysis-diagnostic.js` | System health checker |
| `profit-analysis-seeder.js` | Sample data generator |
| `fix-app-settings-configuration.js` | **Fix PGRST116 & overhead errors** |

## 🚨 Emergency Fix for PGRST116 Error

If you're seeing:
- `"PGRST116": "JSON object requested, multiple (or no) rows returned"`
- `"Error calculating overhead: Pengaturan alokasi belum dikonfigurasi"`

**Quick Fix** (run in browser console):
```javascript
// Copy content from: fix-app-settings-configuration.js
fixAppSettingsConfiguration();
```

This will:
- ✅ Create missing `app_settings` configuration
- ✅ Set up default overhead calculations
- ✅ Initialize allocation settings
- ✅ Resolve PGRST116 errors

## 🔧 Quick Diagnostic

Run this in browser console to check system health:

```javascript
// Copy content from: profit-analysis-diagnostic.js
diagnoseProfitAnalysisSystem();
```

## 📊 Manual Data Entry

If you prefer to add data manually:

### Financial Transactions (Revenue)
```
Navigation: Menu → Laporan Keuangan → Add Transaction
Type: Income
Amount: 500000
Category: Penjualan
Description: Penjualan makanan
```

### Materials (COGS)
```
Navigation: Menu → Gudang Bahan Baku → Add Material
Name: Beras
Price: 12000
Quantity: 25
Unit: kg
```

### Operational Costs (OpEx)
```
Navigation: Menu → Biaya Operasional → Add Cost
Name: Sewa Warung
Amount: 2000000
Type: Tetap
Group: OPERASIONAL
```

## 🐛 Common Issues

### Issue: Empty Dashboard
**Solution**: Add financial data first (income transactions)

### Issue: Wrong Calculations
**Solution**: Ensure WAC (Weighted Average Cost) is enabled

### Issue: Loading Forever
**Solution**: Check browser console for errors, verify authentication

### Issue: Permission Errors
**Solution**: Verify user login and database permissions

## 🎛️ Component Usage

```typescript
import { ProfitDashboard } from '@/components/profitAnalysis';

<ProfitDashboard 
  defaultPeriod="2024-08"
  showAdvancedMetrics={true}
/>
```

## 🔍 System Requirements

- ✅ User authenticated
- ✅ Financial transactions exist
- ✅ Material costs configured
- ✅ Operational costs set up
- ✅ Database permissions correct

## 📞 Support

If issues persist:

1. **Run Diagnostic**: Use `profit-analysis-diagnostic.js`
2. **Check Console**: Look for error messages
3. **Verify Data**: Ensure all required data exists
4. **Test API**: Check network requests in DevTools

## 🎯 Expected Results

After setup, profit analysis should show:

- 📈 **Dashboard**: Revenue, COGS, OpEx, Net Profit cards
- 📊 **Charts**: Breakdown pie chart and trend line chart
- 📋 **Details**: Transaction breakdown by category
- 🔄 **Real-time**: Auto-refresh every 5 minutes
- 📱 **Responsive**: Works on mobile and desktop

---

**Last Updated**: 2024-08-24
**Status**: Ready for use
**Next Steps**: Run diagnostic → Add data → Verify results