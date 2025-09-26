# 🎯 HeyTrack - Business Management Module

HeyTrack adalah modul manajemen bisnis yang komprehensif untuk aplikasi BISMILLAH. Modul ini menyediakan semua fitur yang diperlukan untuk mengelola operasi bisnis seperti inventory, suppliers, customers, orders, dan financial transactions.

## 📁 Struktur Folder

```
heytrack/
├── components/          # React components khusus untuk HeyTrack
├── database/           # Database migrations dan setup
│   ├── migrations/     # SQL migration files
│   └── README.md       # Database setup guide
├── hooks/              # Custom React hooks
├── services/           # API services dan business logic
│   └── businessApi.ts  # Main API service
├── types/              # TypeScript type definitions
│   ├── business.ts     # Business entity types
│   └── supplier.ts     # Supplier specific types
├── index.ts            # Main module exports
└── README.md           # This file
```

## 🚀 Fitur Utama

### 📦 Inventory Management
- Manajemen stok barang
- Kategori produk (raw materials, packaging, equipment, etc.)
- Alert untuk stok kritis
- Tracking lokasi dan tanggal expired

### 👥 Customer Management
- Database pelanggan (business & individual)
- Tracking order history dan total spent
- Loyalty points system
- Rating system

### 🏪 Supplier Management
- Database supplier dengan kategorisasi
- Rating dan evaluasi supplier
- Payment terms tracking
- Order history

### 📋 Order Management
- Sistem order yang komprehensif
- Status tracking (pending → processing → delivered)
- Payment status tracking
- Order items dengan inventory linking

### 🛒 Purchase Orders
- Purchase order management
- Supplier integration
- Delivery tracking
- Inventory auto-update

### 👨‍🍳 Recipe Management
- Recipe dengan ingredient calculation
- Cost per serving calculation
- Profit margin analysis
- Difficulty levels

### 💰 Financial Transactions
- Income, expense, dan transfer tracking
- Category-based classification
- Reference linking ke orders/purchases
- Receipt management

## 🛠️ Cara Penggunaan

### Import Module
```typescript
// Import semua types dan services
import { 
  Customer, 
  InventoryItem, 
  Order,
  businessApi 
} from '@/heytrack';

// Atau import spesifik
import { businessApi } from '@/heytrack/services/businessApi';
import type { Customer } from '@/heytrack/types/business';
```

### Menggunakan API Service
```typescript
// Get all customers
const customers = await businessApi.customers.getAll();

// Create new inventory item
const newItem = await businessApi.inventory.create({
  name: 'Tepung Terigu',
  category: 'raw_materials',
  unit: 'kg',
  current_stock: 100,
  min_stock: 20,
  max_stock: 500,
  unit_price: 12000
});

// Create order with items
const order = await businessApi.orders.create({
  customer_id: 'customer-uuid',
  items: [
    {
      item_name: 'Kue Coklat',
      quantity: 5,
      unit_price: 25000
    }
  ]
});
```

## 🗄️ Database Schema

HeyTrack menggunakan PostgreSQL dengan Supabase sebagai backend. Schema mencakup:

- `suppliers` - Data supplier
- `customers` - Data pelanggan  
- `inventory` - Inventory/stok barang
- `orders` & `order_items` - Sistem order
- `purchase_orders` & `purchase_order_items` - Purchase orders
- `recipes` & `recipe_ingredients` - Resep dan ingredient
- `financial_transactions` - Transaksi keuangan

Semua tabel menggunakan:
- UUID sebagai primary key
- Row Level Security (RLS)
- Automatic timestamps (created_at, updated_at)
- Proper indexing untuk performance

## 🔧 Setup & Installation

1. **Database Setup**
   ```bash
   # Apply migration ke Supabase
   # Copy content dari heytrack/database/migrations/001_create_business_tables.sql
   # Paste dan execute di Supabase SQL Editor
   ```

2. **Environment Variables**
   Pastikan Supabase environment variables sudah diset:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Import dalam Aplikasi**
   ```typescript
   // Di component atau service yang membutuhkan
   import { businessApi } from '@/heytrack';
   ```

## 📊 API Response Format

Semua API responses menggunakan format yang konsisten:

```typescript
// Success Response
interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Error Response  
interface ApiError {
  message: string;
  details?: any;
  code?: string | number;
}

// Paginated Response
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
```

## 🔍 Search & Filtering

Semua list endpoints mendukung search dan filtering:

```typescript
// Customer search
const customers = await businessApi.customers.search({
  query: 'Bakery',
  type: 'business',
  status: 'active',
  page: 1,
  limit: 10
});

// Inventory search
const inventory = await businessApi.inventory.search({
  category: 'raw_materials',
  status: 'low',
  low_stock_only: true
});
```

## 🚨 Error Handling

```typescript
try {
  const customer = await businessApi.customers.create(customerData);
  console.log('Customer created:', customer);
} catch (error) {
  console.error('Error creating customer:', error.message);
  // Handle error appropriately
}
```

## 🔄 Real-time Updates

HeyTrack siap untuk real-time updates menggunakan Supabase subscriptions:

```typescript
// Subscribe to inventory changes
const subscription = supabase
  .channel('inventory-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'inventory' },
    (payload) => {
      console.log('Inventory updated:', payload);
      // Update UI accordingly
    }
  )
  .subscribe();
```

## 📈 Performance

- Semua queries menggunakan proper indexing
- Lazy loading untuk related data
- Optimistic updates untuk better UX
- Caching dengan React Query (TanStack Query)

## 🤝 Contributing

Saat menambah fitur baru ke HeyTrack:

1. Tambahkan types di `types/business.ts`
2. Update `services/businessApi.ts` dengan endpoint baru
3. Buat migration SQL jika perlu schema changes
4. Update dokumentasi ini
5. Export dari `index.ts`

## 📝 License

Part of BISMILLAH Business Management Application.