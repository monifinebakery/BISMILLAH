# Orders Module – snake_case Migration

This document summarizes the refactor to standardize field names in the Orders module to snake_case and how to use the updated APIs and hooks.

## Field Naming

- Use snake_case for all data fields passed between UI ↔ services ↔ database.
- React components, types, and file names remain unchanged.

### Common Fields

- nomor_pesanan (was: nomorPesanan/orderNumber)
- nama_pelanggan (was: namaPelanggan/customerName)
- telepon_pelanggan (was: teleponPelanggan/customerPhone)
- email_pelanggan (was: emailPelanggan/customerEmail)
- alamat_pengiriman (was: alamatPengiriman)
- total_pesanan (was: totalPesanan/totalAmount)
- created_at / updated_at (was: createdAt/updatedAt)
- tanggal_selesai (was: tanggalSelesai)

## Adapters and Helpers

- Adapters: `src/components/orders/naming.ts`
  - `to_snake_order(obj)` and `from_snake_order(obj)` convert between camel and snake.
  - Use these for interop with legacy structures while migrating.

- DB Transformers: `src/components/orders/utils.ts`
  - `transform_order_from_db_snake` and `transform_order_to_db_snake` map to/from DB payloads using snake_case fields.

## Hooks and Services

- Hooks (snake variants): `src/components/orders/hooks/useOrderData.ts`
  - `useOrderDataSnake()` – fetches Orders using snake_case fields.
  - `useOrderOperationsSnake()` – mutations (add/update/status/delete) using snake_case payloads.

- Services (snake wrappers): `src/components/orders/services/orderService.ts`
  - `fetchOrdersSnake`, `addOrderSnake`, `updateOrderSnake`, `updateOrderStatusSnake`, `deleteOrderSnake`.

## Validation Limits (snake_case)

In `src/components/orders/constants.ts`:

- customer_name, phone, email, address, notes
- order_value, items_per_order

Update any references to the new keys accordingly.

## Component Updates

Key screens and dialogs now prefer snake_case fields with camel fallback during migration:

- Tables and pages: `OrderTable.tsx`, `VirtualOrderTable.tsx`, `OrdersPage.tsx`.
- Dialogs: `OrderDetailDialog.tsx`, `OrderForm.tsx` (submission path converts to snake_case), `BulkDeleteDialog.tsx`, `BulkEditDialog.tsx`, `BulkOperationsDialog.tsx`, `StockValidationDialog.tsx`.
- Hooks/Provider: `useOrderUI.ts`, `useOrderStats.ts`, `OrderProvider.tsx`, `useOrderFollowUp.ts`.

## How to Migrate Screens

1) Read data via `useOrderDataSnake()` (or adapt legacy data with `to_snake_order`).
2) Submit via `useOrderOperationsSnake()` using snake_case payloads (or call adapters before submit).
3) In component render, access snake fields first (e.g., `order.nomor_pesanan`) with camel fallback when needed.

## Notes

- The snake_case path coexists with legacy camel during transition, minimizing breakage.
- Once all components use snake_case, legacy camel mappings can be removed.

