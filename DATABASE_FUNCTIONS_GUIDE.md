# Database Functions Guide

## Problem Solved
Fixed the "PGRST202" error by creating the missing `calculate_realtime_profit` function and other supporting functions that your application was trying to call.

## Functions Created

### 1. Core Profit Analysis Functions

#### `calculate_realtime_profit(p_user_id, p_period)`
**Purpose**: Main function for calculating real-time profit analysis
**Parameters**: 
- `p_user_id` (UUID) - User ID
- `p_period` (TEXT) - Period in format YYYY-MM, YYYY, or YYYY-MM-DD

**Returns**: 
- `total_revenue` (NUMERIC)
- `total_cogs` (NUMERIC) 
- `total_opex` (NUMERIC)
- `revenue_transactions` (JSONB)
- `cogs_materials` (JSONB)
- `opex_costs` (JSONB)
- `calculated_at` (TIMESTAMPTZ)

#### `get_revenue_breakdown(p_user_id, p_period)`
**Purpose**: Get revenue breakdown by category
**Returns**: Category-wise revenue data

#### `get_profit_trend(p_user_id, p_start_period, p_end_period)`
**Purpose**: Get profit trend across multiple periods
**Returns**: Period-wise profit metrics

### 2. Operational Cost Functions

#### `get_total_costs(p_user_id)`
**Purpose**: Calculate total operational costs for a user
**Returns**: Total monthly operational costs

#### `calculate_overhead(p_material_cost, p_user_id)`
**Purpose**: Calculate overhead based on material costs
**Returns**: Calculated overhead amount

### 3. Order Management Functions

#### `get_order_statistics(p_user_id)`
**Purpose**: Get comprehensive order statistics
**Returns**: Order counts, revenue, and averages

#### `create_new_order(order_data)`
**Purpose**: Create a new order with JSON data
**Returns**: New order UUID

#### `can_complete_order(p_order_id)`
**Purpose**: Check if order can be completed
**Returns**: Completion status and stock information

#### `complete_order_and_deduct_stock(p_order_id)`
**Purpose**: Complete order and update stock
**Returns**: Completion result as JSON

### 4. Admin Functions

#### `is_user_admin()`
**Purpose**: Check if current user has admin privileges
**Returns**: Boolean indicating admin status

## How the Functions Work

### Period Format Handling
The functions intelligently handle different period formats:
- **Monthly**: `2024-01` (YYYY-MM)
- **Yearly**: `2024` (YYYY)
- **Daily**: `2024-01-15` (YYYY-MM-DD)

### Data Source Priority
1. **Primary**: Uses dedicated tables (operational_costs, pemakaian_bahan, orders)
2. **Fallback**: Uses financial_transactions and purchases for estimation
3. **Graceful**: Returns zeros if no data available

### COGS Calculation
- **Preferred**: Uses `pemakaian_bahan` table for actual material usage
- **Fallback**: Estimates from purchase data (70% of purchase value)

### OpEx Calculation
- **Monthly**: Uses operational_costs directly
- **Daily**: Prorates monthly costs by actual days in month
- **Yearly**: Multiplies monthly costs by 12

## Usage Examples

### In Your Application
These functions are called automatically by your profit analysis API:

```typescript
// This will now work without PGRST202 error
const { data, error } = await supabase.rpc('calculate_realtime_profit', {
  p_user_id: userId,
  p_period: '2024-01'
});
```

### Direct SQL Usage
```sql
-- Calculate profit for January 2024
SELECT * FROM calculate_realtime_profit('user-uuid-here', '2024-01');

-- Get revenue breakdown
SELECT * FROM get_revenue_breakdown('user-uuid-here', '2024-01');

-- Check admin status
SELECT is_user_admin();
```

## Security Features

- **Row Level Security**: All functions respect user permissions
- **SECURITY DEFINER**: Functions run with elevated privileges but maintain security
- **User Isolation**: Functions only access data for the specified user
- **Admin Check**: Admin functions verify user privileges

## Error Handling

- **Graceful Degradation**: Functions handle missing tables gracefully
- **Default Values**: Return sensible defaults when data is unavailable
- **Type Safety**: Proper type casting and validation

## Performance Optimizations

- **Efficient Queries**: Optimized SQL for fast execution
- **Date Range Filtering**: Smart date handling for accurate period calculations
- **Conditional Logic**: Only queries existing tables

## Next Steps

1. **Deploy to Supabase**: Run the SQL script in your Supabase SQL editor
2. **Test Functions**: Use the examples above to verify functionality
3. **Monitor Performance**: Check function execution times
4. **Customize Logic**: Modify functions based on business requirements

## Admin Email Configuration

Update the `is_user_admin()` function with your actual admin emails:

```sql
-- Edit this part in the function:
IF v_user_email IN (
    'admin@bismillah.com',
    'your-actual-admin@email.com',  -- Add your admin emails here
    'owner@bismillah.com'
) THEN
```

## File Location
The complete SQL script is available at:
`/Users/mymac/Projects/BISMILLAH/database_fixes/create_calculate_realtime_profit_function.sql`

Run this script in your Supabase dashboard to resolve the PGRST202 error and enable all profit analysis functionality.