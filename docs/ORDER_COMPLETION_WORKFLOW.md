# 🔄 ORDER COMPLETION WORKFLOW - IMPLEMENTATION GUIDE

## 📋 OVERVIEW

Dokumen ini menjelaskan implementasi lengkap untuk workflow order completion yang terintegrasi dengan warehouse stock reduction, financial transaction recording, dan activity logging.

## 🏗️ ARCHITECTURE

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend UI   │───▶│   Order API      │───▶│  Stored Proc    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                       ┌─────────────────────────────────┼─────────────────────────────────┐
                       ▼                                 ▼                                 ▼
              ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
              │ Stock Validation │              │ Stock Reduction │              │ Financial Record│
              └─────────────────┘              └─────────────────┘              └─────────────────┘
                       │                                 │                                 │
                       ▼                                 ▼                                 ▼
              ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
              │ Recipe Analysis │              │ Warehouse Update│              │ Activity Logging│
              └─────────────────┘              └─────────────────┘              └─────────────────┘
```

## 🚀 IMPLEMENTATION STEPS

### 1. DATABASE SETUP

#### A. Execute SQL Migration
```sql
-- Run the stored procedure creation
-- File: sql/complete_order_workflow.sql
psql -d your_database < sql/complete_order_workflow.sql
```

#### B. Key Functions Created:
- `get_recipe_ingredients_for_order(order_id)` - Extract recipe ingredients
- `complete_order_and_deduct_stock(order_id)` - Main completion function
- `can_complete_order(order_id)` - Stock validation
- `reverse_order_completion(order_id)` - Reversal function

### 2. FRONTEND INTEGRATION

#### A. Update Order Components
```typescript
// Import the new StockValidationDialog
import StockValidationDialog from './StockValidationDialog';

// Add state for dialog
const [showStockValidation, setShowStockValidation] = useState(false);
const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

// Handle order completion with validation
const handleCompleteOrder = (order: Order) => {
  setSelectedOrder(order);
  setShowStockValidation(true);
};

// Confirm completion after validation
const confirmOrderCompletion = async () => {
  if (!selectedOrder) return;
  
  try {
    const result = await orderApi.completeOrder(selectedOrder.id);
    
    if (result.success) {
      toast.success(`Pesanan ${result.orderNumber} berhasil diselesaikan!`);
      // Refresh data
      await refreshOrders();
    } else {
      toast.error(result.error || 'Gagal menyelesaikan pesanan');
    }
  } finally {
    setShowStockValidation(false);
    setSelectedOrder(null);
  }
};
```

#### B. Add Dialog Component
```tsx
<StockValidationDialog
  isOpen={showStockValidation}
  onOpenChange={setShowStockValidation}
  order={selectedOrder}
  onConfirm={confirmOrderCompletion}
  onCancel={() => {
    setShowStockValidation(false);
    setSelectedOrder(null);
  }}
/>
```

### 3. API USAGE EXAMPLES

#### A. Check if Order Can Be Completed
```typescript
const validationResult = await orderApi.canCompleteOrder('order-id');

if (validationResult.canComplete) {
  console.log('✅ Order can be completed');
  console.log(`${validationResult.availableIngredients}/${validationResult.totalIngredients} ingredients available`);
} else {
  console.log('❌ Insufficient stock');
  console.log('Missing items:', validationResult.insufficientStock);
}
```

#### B. Complete Order
```typescript
const result = await orderApi.completeOrder('order-id');

if (result.success) {
  console.log('✅ Order completed successfully');
  console.log(`Order: ${result.orderNumber}`);
  console.log(`Total: ${result.totalAmount}`);
  console.log(`Stock items updated: ${result.stockItemsUpdated}`);
} else {
  console.log('❌ Order completion failed');
  console.log(`Error: ${result.error}`);
  if (result.details) {
    console.log('Details:', result.details);
  }
}
```

#### C. Reverse Order (if needed)
```typescript
const reverseResult = await orderApi.reverseOrderCompletion('order-id');

if (reverseResult.success) {
  console.log('✅ Order completion reversed');
  console.log(`Stock items restored: ${reverseResult.stockItemsRestored}`);
}
```

## 🔍 WORKFLOW DETAILS

### 1. STOCK VALIDATION PROCESS

```sql
-- Example: Get ingredients needed for an order
SELECT * FROM get_recipe_ingredients_for_order('order-id');

-- Result example:
-- warehouse_item_id | bahan_nama | total_required | satuan | current_stock
-- ------------------|------------|----------------|--------|---------------
-- abc-123-def      | Tepung     | 2.5           | kg     | 5.0
-- def-456-ghi      | Gula       | 1.0           | kg     | 0.5  <- INSUFFICIENT!
```

### 2. ORDER COMPLETION FLOW

1. **Validation Phase**
   - Parse order items to find recipe-based items
   - Calculate total ingredient requirements
   - Check current warehouse stock
   - Return validation result

2. **Execution Phase** (if validation passes)
   - Update warehouse stock (reduce quantities)
   - Create financial transaction (income)
   - Update order status to 'completed'  
   - Log activities

3. **Error Handling**
   - Automatic rollback on any failure
   - Detailed error messages
   - Preserve data integrity

### 3. FINANCIAL INTEGRATION

```sql
-- Financial transaction automatically created:
INSERT INTO financial_transactions (
  type: 'income',
  category: 'Penjualan Produk', 
  amount: order.total_pesanan,
  description: 'Penjualan dari pesanan #ORD-12345',
  related_id: order_id
);
```

### 4. ACTIVITY LOGGING

```sql
-- Multiple activities logged automatically:
-- 1. Stock reduction for each ingredient
-- 2. Order completion
-- 3. Financial transaction creation
```

## ⚠️ IMPORTANT CONSIDERATIONS

### 1. RECIPE REQUIREMENTS

Untuk workflow ini bekerja dengan baik, pastikan:
- ✅ Recipe ingredients memiliki `warehouseId` yang valid
- ✅ Satuan (unit) konsisten antara recipe dan warehouse
- ✅ Recipe data struktur sesuai dengan `hpp_recipes.bahan_resep` format

### 2. ORDER STRUCTURE 

Order items harus memiliki:
```typescript
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  recipeId?: string;        // ✅ Required for recipe items
  isFromRecipe?: boolean;   // ✅ Required flag
  // ... other fields
}
```

### 3. ERROR SCENARIOS

| Scenario | Behavior | Recovery |
|----------|----------|-----------|
| Insufficient stock | Return error with details | User can purchase more stock |
| Recipe not found | Skip ingredient calculation | Manual adjustment needed |
| Database error | Complete rollback | Retry after fixing issue |
| Order already completed | Return false | No action needed |

### 4. PERFORMANCE CONSIDERATIONS

- **Indexes**: Added for orders.status, financial_transactions.related_id
- **Transactions**: All operations in single DB transaction
- **Validation**: Can be called multiple times safely
- **Caching**: Consider caching recipe data for frequently used recipes

## 🧪 TESTING

### 1. Unit Tests Needed
```typescript
describe('Order Completion Workflow', () => {
  test('should validate stock correctly')
  test('should complete order with sufficient stock')  
  test('should fail with insufficient stock')
  test('should reverse completion correctly')
  test('should create financial transaction')
  test('should log activities')
})
```

### 2. Integration Tests
```typescript
describe('End-to-End Order Flow', () => {
  test('complete order flow with recipe items')
  test('mixed order with recipe and custom items')
  test('order with multiple recipes')
  test('concurrent order completion')
})
```

### 3. Manual Testing Scenarios

1. **Happy Path**
   - Create order with recipe items
   - Ensure sufficient stock
   - Complete order
   - Verify stock reduction, financial record, activities

2. **Insufficient Stock**
   - Create order requiring more stock than available
   - Attempt completion
   - Verify error message and stock details

3. **Mixed Orders** 
   - Order with both recipe and custom items
   - Only recipe items should affect stock

4. **Reversal**
   - Complete an order
   - Reverse completion
   - Verify stock restoration

## 📊 MONITORING & ANALYTICS

### 1. Key Metrics to Track
- Order completion success rate
- Stock shortage incidents  
- Average ingredients per order
- Financial transaction accuracy

### 2. Database Queries for Monitoring
```sql
-- Orders completed today
SELECT COUNT(*) FROM orders 
WHERE status = 'completed' 
AND DATE(updated_at) = CURRENT_DATE;

-- Stock shortage incidents
SELECT COUNT(*) FROM activities
WHERE title = 'Stock Shortage'
AND DATE(created_at) = CURRENT_DATE;

-- Financial transactions from orders
SELECT SUM(amount) FROM financial_transactions
WHERE type = 'income' 
AND related_id IS NOT NULL
AND DATE(created_at) = CURRENT_DATE;
```

## 🔄 MAINTENANCE

### 1. Regular Tasks
- Monitor stock levels vs minimum thresholds
- Review failed order completions
- Validate financial transaction accuracy
- Clean up old activity logs

### 2. Database Maintenance
```sql
-- Weekly: Analyze table statistics
ANALYZE orders, financial_transactions, activities, bahan_baku;

-- Monthly: Check for orphaned records
SELECT COUNT(*) FROM financial_transactions ft
LEFT JOIN orders o ON ft.related_id = o.id
WHERE ft.related_id IS NOT NULL AND o.id IS NULL;
```

## 🚨 TROUBLESHOOTING

### Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| Function not found | `complete_order_and_deduct_stock` does not exist | Run SQL migration |
| Permission denied | Cannot execute function | Grant permissions to authenticated users |
| Invalid JSON | Parse error in stored proc | Check order.items JSON structure |
| Recipe not found | Ingredients not calculated | Verify recipe exists in hpp_recipes |
| Stock calculation wrong | Incorrect quantities | Check recipe ingredient units |

### Debug Queries

```sql
-- Debug order items structure
SELECT items FROM orders WHERE id = 'order-id';

-- Debug recipe ingredients
SELECT bahan_resep FROM hpp_recipes WHERE id = 'recipe-id';

-- Debug stock levels
SELECT nama, stok, minimum FROM bahan_baku WHERE stok <= minimum;
```

---

## 🎯 NEXT STEPS

1. **Implement Database Migration** - Run SQL file
2. **Update Frontend Components** - Add StockValidationDialog
3. **Test Integration** - Verify end-to-end flow
4. **Monitor Performance** - Set up logging and metrics
5. **User Training** - Document new validation process

---

**✅ COMPLETION CHECKLIST**

- [ ] Database stored procedures created
- [ ] Frontend API updated  
- [ ] StockValidationDialog implemented
- [ ] Order components updated
- [ ] Testing completed
- [ ] Documentation updated
- [ ] User training provided
- [ ] Monitoring setup

---

*Last updated: 2025-08-17*
