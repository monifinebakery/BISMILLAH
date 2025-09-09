# RPC Functions Audit Report

## RPC Functions yang digunakan di codebase:

### Order Management:
1. `create_new_order` - (orderService.ts, orderApi.ts)
2. `can_complete_order` - (orderApi.ts)  
3. `complete_order_and_deduct_stock` - (orderApi.ts)
4. `reverse_order_completion` - (orderApi.ts)
5. `get_order_statistics` - (orderApi.ts)

### Financial Management:
6. `refresh_dashboard_views` - (financialApi.ts)

### Profit Analysis:
7. `calculate_realtime_profit` - (profitAnalysisApi.ts)

### Operational Costs:
8. `get_total_costs` - (operationalCostApi.ts)
9. `calculate_overhead` - (operationalCostApi.ts)

### Others (from test/diagnostic files):
10. Various diagnostic RPC calls in test files

## Status Check:
- ✅ Order completion functions: PUSHED (20250909161034_complete_order_workflow.sql)
- ❓ Other functions: Need verification

## Files to check for missing migrations:
- Financial functions (refresh_dashboard_views)
- Profit analysis functions (calculate_realtime_profit) 
- Operational cost functions (get_total_costs, calculate_overhead)
- Order statistics (get_order_statistics)
- Order creation (create_new_order)
