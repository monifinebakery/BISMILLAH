# 🗄️ BISMILLAH Database Setup

## Overview
This directory contains SQL migration scripts for setting up the BISMILLAH Business Management System database in Supabase.

## 📋 Database Structure

### Core Tables
- **`suppliers`** - Vendor management
- **`customers`** - Customer relationship management  
- **`inventory`** - Stock and warehouse management
- **`orders`** - Customer order processing
- **`order_items`** - Detailed order line items
- **`purchase_orders`** - Purchase order management
- **`purchase_order_items`** - Purchase order details
- **`recipes`** - Recipe and product formulation
- **`recipe_ingredients`** - Recipe ingredient breakdown
- **`financial_transactions`** - Financial tracking

### 🔐 Security Features
- **Row Level Security (RLS)** enabled on all tables
- **UUID Primary Keys** for security
- **Data validation** with CHECK constraints
- **Automatic timestamps** with triggers
- **Computed columns** for real-time calculations

### 🚀 Advanced Features
- **Auto-calculated status** for inventory (good/low/critical/out_of_stock)
- **Profit margin calculations** for recipes
- **Total value calculations** for inventory and orders
- **Foreign key relationships** with cascade deletion
- **Optimized indexes** for query performance

## 🛠️ Setup Instructions

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project: **kewhzkfvswbimmwtpymw**

### Step 2: Run Database Migration
1. In Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy the contents of `migrations/001_create_business_tables.sql`
4. Paste into the SQL editor
5. Click **"Run"** to execute the migration

### Step 3: Verify Setup
After running the migration, you should see:
- ✅ 10 tables created
- ✅ Sample data inserted
- ✅ RLS policies enabled
- ✅ Indexes created for performance
- ✅ Triggers for automatic timestamps

### Step 4: Check Sample Data
The migration includes sample data for testing:
- 4 sample suppliers
- 4 sample customers  
- 5 sample inventory items

You can verify this in the **Table Editor** section of Supabase.

## 📊 Table Relationships

```
customers ─┐
           │
           ├── orders ── order_items ── inventory
           │
suppliers ─┤
           │
           ├── purchase_orders ── purchase_order_items ── inventory
           │
           └── recipes ── recipe_ingredients ── inventory
                │
                └── financial_transactions
```

## 🔧 Environment Variables

Make sure these are set in your `.env` file:

```env
VITE_SUPABASE_URL=https://kewhzkfvswbimmwtpymw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 🧪 Testing the Setup

After setup, you can test the database connection:

1. **Start the dev server**: `pnpm dev`
2. **Check browser console** for any connection errors
3. **Navigate to modern pages** (Suppliers, Customers, Inventory)
4. **Try CRUD operations** with the real API integration

## 📝 Notes

### Computed Columns
Some columns are automatically calculated:
- `inventory.status` - Based on stock levels
- `inventory.total_value` - current_stock × unit_price
- `recipes.profit_margin` - Calculated from cost vs selling price

### Data Validation
- Email addresses must be unique
- Stock quantities cannot be negative
- Ratings are constrained to 0-5 range
- Status fields use CHECK constraints

### Performance
- Indexes on frequently queried columns
- UUID for security and distributed systems
- Optimized for common business queries

## 🚨 Troubleshooting

### Common Issues:

**"Extension not available"**
```sql
-- Run this first if you get extension errors:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

**"Permission denied"**  
- Ensure you're running as project owner
- Check RLS policies are properly configured

**"Table already exists"**
- The script uses `IF NOT EXISTS` - it's safe to re-run
- Use `DROP TABLE` if you need a clean slate

### Need Help?
1. Check Supabase logs in the dashboard
2. Verify your environment variables
3. Test API connection with simple queries

---

🎉 **Ready to go!** Your database is now set up with a complete business management schema.