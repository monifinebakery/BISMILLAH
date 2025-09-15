# Quick Editing Rules (TL;DR)

Use this as a quick checklist before you change anything.

- Do not hardcode field names. Use transformers and follow docs/DATA_FIELD_NAMING_GUIDE.md.
- No full reload. Use SPA `navigate()` instead of `window.location.href`.
- After mutations, invalidate React Query keys (lists, categories, stats).
- Guard arrays and nullables: `Array.isArray(x) ? x : []` before spread/map.
- For Supabase errors: no raw error to UI; use toast + logger, and backoff retry for 5xx.
- Keep realtime subscriptions single and cleaned up.
- Recipe form: ensure marginKeuntunganPersen is mapped to `margin_keuntungan_persen` on save.
- Warehouse/Usage:
  - bahan_baku: `harga_satuan` (DB) -> `unit_price` (FE).
  - pemakaian_bahan: `qty_base` (DB) -> alias `quantity` (FE calculators).
- Payment gating:
  - Hide preview when `isPaid || hasAccess || isLoading`.
  - Auto-link unlinked paid orders by email after login (PaymentContext handles it). Don’t duplicate.
- Commit style: `type(scope): summary (pake-ini)`.

If in doubt, check docs/CONTRIBUTING.md.

