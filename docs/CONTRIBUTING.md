# Contributing and Editing Guide

This document defines guardrails and best practices for editing the codebase so changes remain safe, consistent, and easy to review.

Use this as your primary reference before modifying files. For field naming conventions, see docs/DATA_FIELD_NAMING_GUIDE.md.

## Principles

- Source of truth: database schema (snake_case). Frontend uses camelCase. Always transform at boundaries.
- No full page reload in SPA: never use `window.location.href` for navigation; use React Router `navigate()`.
- Prefer composition over duplication. Reuse services and helpers; avoid reimplementing similar logic.
- Keep side-effects centralized: auth, payment access, and realtime subscriptions live in their providers/hooks.
- Keep queries resilient: handle 5xx with retry/backoff; avoid spamming subscriptions.

## Project Structure (high-level)

- `src/contexts/` — global providers (Auth, Payment, Recipe, etc.)
- `src/components/` — UI components and feature modules
- `src/components/recipe/` — recipe module (forms, list, services)
- `src/components/warehouse/` — warehouse/inventory
- `src/components/profitAnalysis/` — profit analysis + WAC
- `src/components/purchase/` — purchase management
- `src/services/` — cross-cutting services (auth, payments, http utils)
- `src/utils/` — helpers (date, math, type converters)
- `docs/` — documentation (this file, naming guide, etc.)

## Data Naming (MUST)

- Always follow docs/DATA_FIELD_NAMING_GUIDE.md.
- DB: snake_case (e.g., `margin_keuntungan_persen`).
- FE: camelCase (e.g., `marginKeuntunganPersen`).
- Transformation rules live in module services (e.g., `recipeApi.transformToDB/transformFromDB`). Do not bypass them.

## Editing Rules by Module

### Auth

- File: `src/contexts/AuthContext.tsx`
- Use SPA navigation after OTP: prefer `navigate('/', { replace: true })` not `window.location.href`.
- Keep `isReady` accurate; set it when auth init completes to avoid long loaders.
- Avoid duplicate `onAuthStateChange` listeners outside providers.

### Payment / Access

- Files: `src/contexts/PaymentContext.tsx`, `src/hooks/usePaymentStatus.ts`, `src/hooks/useUnlinkedPayments.ts`
- Access is granted when a linked payment exists (`user_payments.user_id` set, `is_paid=true`, `payment_status='settled'`).
- We accept unlinked-but-paid as "paid" but do not grant access until linked. Auto-link by email runs after login — keep it idempotent.
- UI gating:
  - `MandatoryUpgradeModal` must early-return for `isPaid || hasAccess || isLoading` to avoid false banners.
- Do not block app with sync linking operations; always run them asynchronously.

### Recipe

- Files: `src/components/recipe/services/recipeApi.ts`, `types.ts`, `services/recipeUtils.ts`, forms
- DO: map camelCase form fields → snake_case in `transformToDB`.
- DO: read snake_case from DB → camelCase in `transformFromDB`.
- Stats read `margin_keuntungan_persen`; ensure the form persists margin via `transformToDB`.
- Avoid recalculation loops: respect `isEnhancedHppActive` guards; debounce expensive calcs.

### Warehouse / Pemakaian

- Files: `src/components/warehouse/services/warehouseApi.ts`, `profitAnalysis/services/warehouseHelpers.ts`
- Schema:
  - bahan_baku: use `harga_satuan` in DB; map to standardized `unit_price` in services.
  - pemakaian_bahan: use `qty_base` in DB; expose alias `quantity` for calculators.
- Queries should filter by `user_id` and avoid n+1 patterns.

### Profit Analysis

- Files: `src/components/profitAnalysis/…`
- Prefer WAC (`harga_rata_rata`) with fallback to `unit_price`.
- Use materialized views when present; backoff retries for REST 5xx.
- Normalize dates via `unifiedDateHandler` utilities.

### Purchases

- Files: `src/components/purchase/…`
- Use standardized fields: `quantity`, `unit_price` (DB) mapped from `quantity`, `unitPrice` (FE).
- Respect calculation method flags; avoid writing inconsistent totals.

## React Query and Realtime

- Cache keys: keep centralized (e.g., `RECIPE_QUERY_KEYS`, `warehouseQueryKeys`).
- Invalidate keys after mutations (add/update/delete) and in realtime handlers.
- Retry policy: 5xx can retry with exponential backoff; do not retry 4xx.
- Never open multiple real-time subscriptions for the same table+filter. Always clean up.

## Error Handling

- Surface user-friendly toasts; log details via `logger`.
- Do not throw raw Supabase errors to UI.
- Guard array operations (`Array.isArray`) to avoid "not iterable" crashes.

## Performance

- Debounce expensive computations (HPP, stats) when driven by keystrokes.
- Avoid repeated `getSession` calls; use provider state.
- Use pagination or projection in large selects.

## Commit Messages

- Format: `type(scope): summary (pake-ini)`
  - Examples:
    - `fix(recipe): map camelCase to snake_case for margin (pake-ini)`
    - `feat(payment): auto-link paid orders by email (pake-ini)`

## Branching

- `main`: stable; deploy from here.
- `pake-ini`: synced with `main` for quick testing. Keep in sync.
- Feature branches: `feature/<short-desc>`

## Schema Changes

- Document changes in `docs/` and add transformer updates.
- Never change column names in code without updating mapping services and the naming guide.

## Review Checklist (Before Commit)

- [ ] Field names follow the naming guide.
- [ ] Transformations updated for new/changed fields.
- [ ] Queries scoped to current user where required.
- [ ] React Query keys invalidated after mutations.
- [ ] No full page reloads introduced.
- [ ] Error handling is user-friendly; logs detailed via logger.
- [ ] Added/updated docs as necessary.

