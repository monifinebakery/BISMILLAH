# 🔍 Debug Guide: Purchase → Profit Analysis Sync Issue

## ⚡ **Quick Debug Steps**

### **Step 1: Test Purchase Completion**
1. **Open Browser Console** (F12)
2. **Go to Purchase page** (`/pembelian`)
3. **Find a pending purchase** (or create a new one)
4. **Set status to 'completed'**
5. **Watch console logs** - you should see:

```
🔍 Purchase status comparison: {
  previousStatus: "pending",
  newStatus: "completed", 
  willCreateTransaction: true
}
💰 Creating financial transaction for completed purchase: {
  purchaseId: "abc123",
  amount: 150000,
  supplier: "Supplier Name",
  category: "Pembelian Bahan Baku",
  transactionData: { ... }
}
💰 Adding financial transaction: { ... }
💾 Database data to insert: { ... }
✅ Financial transaction created successfully: { ... }
📈 Invalidating profit analysis cache after purchase completion
💰 Invalidating financial transaction cache after purchase completion
```

### **Step 2: Check Financial Reports**
1. **Go to Financial page** (`/financial`)
2. **Look for the new transaction** in the table
3. **Verify it shows**:
   - Category: "Pembelian Bahan Baku"
   - Type: "Pengeluaran" 
   - Amount: Same as purchase total
   - Time: Should show actual time (not 00:00)

### **Step 3: Check Profit Analysis**
1. **Go to Profit Analysis page** (`/profit-analysis`)
2. **Watch console logs** - you should see:
```
🔍 COGS Calculation Debug: {
  period: "2024-01",
  totalTransactions: 10,
  periodTransactions: 8,
  cogsTransactions: 2,
  cogsTransactionDetails: [
    {
      id: "...",
      type: "expense",
      category: "Pembelian Bahan Baku",
      amount: 150000,
      description: "Pembelian dari ...",
      date: "2024-01-15T10:30:00Z"
    }
  ]
}
```

3. **Check if your purchase appears** in `cogsTransactionDetails`
4. **Look at the "Modal Bahan Baku" card** - should include your purchase amount

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: Transaction Not Created**
**Symptoms**: No financial transaction logs in console
**Solution**: Check if purchase completion is actually working
```javascript
// Look for this log:
willCreateTransaction: false // ❌ This means transaction won't be created
```

### **Issue 2: Transaction Created but Not in COGS**
**Symptoms**: Transaction appears in financial reports but not in profit analysis
**Check**:
1. **Category**: Must be exactly `"Pembelian Bahan Baku"`
2. **Type**: Must be `"expense"`
3. **Period**: Make sure profit analysis is looking at the right time period

### **Issue 3: Wrong Time Period**
**Symptoms**: Transaction exists but profit analysis shows different month
**Solution**: 
1. Check the date of your transaction
2. Make sure profit analysis is set to the same month
3. Try switching to "All time" or current month in profit analysis

### **Issue 4: Date Filtering Problem**
**Symptoms**: Inconsistent data between financial reports and profit analysis
**Check console for**:
```javascript
🔍 Profit Analysis Transaction Debug: {
  period: "2024-01",
  totalTransactions: 10,
  cogsTransactionCount: 0, // ❌ Should be > 0 if you have purchases
  allTransactionCategories: ["Lainnya", "Operasional"] // ❌ Missing "Pembelian Bahan Baku"
}
```

---

## 🎯 **Expected Results**

After completing a purchase, you should see:

✅ **Console logs** showing transaction creation  
✅ **Financial reports** showing the expense immediately  
✅ **Profit analysis** showing higher COGS in "Modal Bahan Baku"  
✅ **No manual refresh** needed for updates  

---

## 🔧 **Quick Fixes**

### **Force Refresh Everything**
If data seems stuck:
1. Clear browser cache (Ctrl+Shift+R)
2. Refresh the page
3. Try switching between different months in profit analysis

### **Check Database Directly** (Advanced)
If you have database access:
```sql
-- Check recent transactions
SELECT * FROM financial_transactions 
WHERE category = 'Pembelian Bahan Baku' 
ORDER BY created_at DESC 
LIMIT 5;

-- Check recent completed purchases
SELECT id, status, total_nilai, created_at 
FROM purchases 
WHERE status = 'completed' 
ORDER BY updated_at DESC 
LIMIT 5;
```

---

## 📞 **Report Findings**

When reporting the issue, please include:
1. **Console logs** from purchase completion
2. **Screenshot** of financial table showing the transaction
3. **Screenshot** of profit analysis not showing the expense
4. **Current month/period** you're viewing in profit analysis

This will help pinpoint exactly where the synchronization is breaking! 🕵️‍♀️