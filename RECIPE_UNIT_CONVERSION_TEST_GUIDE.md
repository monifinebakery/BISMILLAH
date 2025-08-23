# 🔄 Recipe Unit Conversion Feature Test Guide

## ✨ **New Feature: Automatic Unit Conversion**

The recipe ingredient input now automatically converts warehouse units to smaller, recipe-friendly units for easier measurement and seamless user experience.

---

## 🎯 **How It Works**

### **Automatic Conversions Applied:**
- **kg** → **gram** (with proportional price adjustment)
- **liter** → **ml** (with proportional price adjustment)
- **Piece units** (pcs, buah, etc.) → **No conversion** (kept as-is)

### **Price Adjustment:**
- If flour costs **Rp 12,000/kg**, it will auto-convert to **Rp 12/gram**
- If oil costs **Rp 25,000/liter**, it will auto-convert to **Rp 25/ml**

---

## 🧪 **Test Scenarios**

### **Test 1: Create Recipe with Warehouse Items**

1. **Go to Recipe Management** (`/recipe`)
2. **Click "Tambah Resep"** (Add Recipe)
3. **Fill basic info** and proceed to "Bahan-bahan" step
4. **Select a warehouse item** that has large units (kg, liter)
5. **Observe the automatic conversion:**
   - ✅ Unit should change from "kg" to "gram"
   - ✅ Price should adjust proportionally (e.g., 12000/kg → 12/gram)
   - ✅ Toast notification should appear explaining the conversion
   - ✅ Blue conversion info card should appear below the form

### **Test 2: Conversion Display**

**Check these visual indicators:**
- **Dropdown**: Items with conversions show:
  - ~~kg~~ → 🆕 gram
  - Price comparison: "Rp 12/gram (dari Rp 12,000/kg)"
  - Blue conversion badge: "🆕 Auto-convert ke satuan lebih kecil"
- **Conversion Info Card**: Shows detailed conversion information
- **Updated Tips**: Include conversion feature information

### **Test 3: Existing Ingredient Updates**

1. **Add an ingredient** using warehouse selection (that gets converted)
2. **In the ingredients table**, try changing the warehouse item for existing ingredients
3. **Verify**: Conversion also applies to existing ingredient updates

### **Test 4: Manual Input**

1. **Type ingredient name manually** (not selecting from warehouse)
2. **Verify**: No conversion applied, works as before
3. **Unit dropdown**: Should still show all available units

---

## 🔍 **Expected Results**

### **✅ Success Indicators**
- [x] **kg converts to gram** with 1000x price division
- [x] **liter converts to ml** with 1000x price division  
- [x] **Piece units stay unchanged** (pcs, buah, etc.)
- [x] **Toast notifications** show conversion info
- [x] **Conversion card** displays detailed conversion
- [x] **Dropdown shows conversion preview** before selection
- [x] **Prices calculate correctly** after conversion
- [x] **Existing ingredients** also get converted when updated

### **Console Logs to Watch For**
```javascript
// Successful conversion
🆕 Unit conversion applied: {
  from: "kg",
  to: "gram", 
  priceFrom: 12000,
  priceTo: 12,
  isConverted: true,
  displayText: "Dikonversi dari kg ke gram (1 kg = 1000 gram)"
}

// Updating existing ingredient
🆕 Updating existing ingredient with conversion: {
  index: 0,
  from: "liter",
  to: "ml",
  priceFrom: 25000,
  priceTo: 25,
  isConverted: true
}
```

---

## 🎬 **Step-by-Step Demo**

### **Demo Scenario: Flour Recipe**

1. **Create New Recipe**: "Roti Tawar"
2. **Add Flour**: 
   - Select "Tepung Terigu" from warehouse (stored as kg)
   - **Expected**: Auto-converts to gram with adjusted price
   - **Input**: 500 gram (instead of 0.5 kg)
   - **Result**: Much easier to measure!

3. **Add Oil**:
   - Select "Minyak Goreng" from warehouse (stored as liter)  
   - **Expected**: Auto-converts to ml with adjusted price
   - **Input**: 50 ml (instead of 0.05 liter)
   - **Result**: Much easier to measure!

4. **Add Sugar**:
   - Select "Gula Pasir" from warehouse (stored as pcs/bungkus)
   - **Expected**: No conversion needed
   - **Input**: Works as before

---

## 🚀 **User Benefits**

### **Before (Problems)**
- Had to calculate: "If flour is 12,000/kg, how much is 500g?"
- Confusing decimals: "0.5 kg" vs "500 gram"
- Mental math required for every ingredient

### **After (Solution)**
- ✅ **No mental math**: Prices auto-adjusted
- ✅ **Easier measurements**: Use grams instead of kg fractions
- ✅ **More precise**: Better for recipe calculations
- ✅ **Seamless**: Happens automatically, no extra steps

---

## 🔧 **Technical Implementation**

### **Files Modified:**
- `/src/utils/unitConversion.ts` - Core conversion logic
- `/src/components/recipe/components/RecipeForm/IngredientsStep.tsx` - UI integration

### **Key Functions:**
- `convertIngredientUnit()` - Main conversion logic
- `findBestConversion()` - Determines if conversion needed
- `formatConvertedPrice()` - Display formatting

---

## 💡 **Future Enhancements**

Potential improvements for future versions:
- **More unit conversions** (ton → kg, gallon → liter)
- **Custom conversion rates** for specialty ingredients  
- **Conversion preferences** (disable for specific items)
- **Recipe scaling** with automatic unit optimization

---

## 🎉 **Success Confirmation**

**Feature works correctly when:**
1. ✅ Large units auto-convert to smaller units
2. ✅ Prices adjust proportionally and correctly
3. ✅ Visual indicators show conversion clearly
4. ✅ User experience is seamless and intuitive
5. ✅ Calculations remain accurate throughout

**This makes recipe creation much more user-friendly! 🚀**