# Architecture Overview

This document explains how the app is structured, how data flows, and where to make changes safely. Pair this with:

- docs/DATA_FIELD_NAMING_GUIDE.md (snake_case ↔ camelCase mapping)
- docs/CONTRIBUTING.md (module rules, practices)
- docs/EDITING_RULES.md (TL;DR checklist)

## Tech Stack

- React + TypeScript (Vite)
- React Router
- TanStack Query (data fetching/caching)
- Supabase (Auth, PostgREST, Realtime)
- Tailwind UI components

## High-Level Architecture

- UI (components) → Feature Providers (contexts) → Services (API + transformers) → Supabase
- Providers own side-effects (auth, payment gating, realtime) and expose plain interfaces to components.
- All DB access is funneled through services that map snake_case ↔ camelCase.

## Core Providers (mount order)

Defined in `src/contexts/AppProviders.tsx`:

1) AuthProvider

- Initializes session, listens to `onAuthStateChange`.
- SPA navigation after OTP (no full reload).
- Exposes `{ user, session, isLoading, isReady, refreshUser, triggerRedirectCheck }`.

2) PaymentProvider

- Determines `isPaid`, `hasAccess`, and manages preview gating.
- Auto-links unlinked, settled payments by email after login to set `user_id`.
- Exposes `{ isPaid, hasAccess, isLoading, showMandatoryUpgrade, previewTimeLeft, refetchPayment }`.

3) Others (in order): Notification, UserSettings, Activity, Financial, Warehouse (dynamic), Supplier, Recipe, Purchase, Orders, OperationalCost, Promo, FollowUpTemplate, Device, ProfitAnalysis.

Key rule: Providers handle subscriptions, invalidations, and retries. Components stay declarative.

## Routing

- Routes are declared in `src/config/routes.tsx`.
- `/auth`: Email + OTP page (uses Turnstile-disabled flow by default).
- Protected routes are wrapped by AuthGuard and PaymentGuard.

## Data Naming and Transformation

- DB uses snake_case (source of truth), FE uses camelCase for state/UI.
- Mapping lives in services (e.g., `recipeApi.transformToDB/transformFromDB`).
- Never write UI objects directly to DB without mapping.
- See docs/DATA_FIELD_NAMING_GUIDE.md for field-by-field mapping per module.

## Auth Flow (OTP)

1) OTP verified via Supabase `verifyOtp`.
2) AuthContext receives session → set `user`, `session`, `isReady`.
3) SPA navigate to `/` (no `window.location.href` reload).

Common pitfalls avoided:

- Long loader: removed full reload after OTP.
- Race: UI waits for `isReady` before redirecting.

## Payment & Access Gating

Tables: `user_payments` (columns: `user_id`, `email`, `is_paid`, `payment_status`, `pg_reference_id`, timestamps).

- Access requires a linked payment (`user_id` set, `is_paid=true`, `payment_status='settled'`).
- `usePaymentStatus` detects both linked and unlinked payments; `PaymentProvider` determines access.
- Auto-link: After login, unlinked-but-paid records with matching email are updated to set `user_id`.
- UI gating:

  - `MandatoryUpgradeModal` is hidden when `isPaid || hasAccess || isLoading`.
  - A non-blocking timer shows only when preview is actually active.

## Recipe Module

- Types: `src/components/recipe/types.ts` (snake_case interfaces for DB, camelCase for FE data flow).
- Service: `src/components/recipe/services/recipeApi.ts`
  - `transformFromDB`: snake_case → FE shape.
  - `transformToDB`: maps camelCase inputs from form to snake_case (e.g., `marginKeuntunganPersen → margin_keuntungan_persen`).
  - This ensures Recipe Stats read synced fields from DB.
- HPP calculations: `services/recipeUtils.ts` (legacy) + Enhanced HPP in operational costs.
- Forms: multi-step with Ingredients + Costs; guard debounced calculations and enhanced mode flag.

## Warehouse & Usage

- bahan_baku (DB): use `harga_satuan`; service maps to standardized `unit_price` for analytics.
- pemakaian_bahan (DB): use `qty_base`; service exposes alias `quantity` for calculators.
- Services: `warehouseApi.ts` (CRUD), `profitAnalysis/services/warehouseHelpers.ts` (maps and fetches).
- Realtime: WarehouseProvider subscribes and invalidates relevant caches.

## Profit Analysis

- Prefers WAC (`harga_rata_rata`), falls back to `unit_price`.
- Daily aggregates: tries materialized view `pemakaian_bahan_daily_mv`, falls back to per-row.
- Date normalization via `unifiedDateHandler`.
- Retry/backoff on 5xx (e.g., 503) to improve resilience.

## Purchases

- FE `PurchaseItem` uses camelCase; DB payload uses `PurchaseItemDB` with snake_case.
- Services/transformers map shapes; do not mix.
- Respect calculation methods; ensure totals are consistent.

## Orders

- Uses recipes for item pricing. Sorts recipes safely with name fallback: `namaResep → nama_resep → nama`.
- Avoid `undefined.localeCompare` by always coalescing to string.

## Realtime & Caching Patterns

- React Query keys are centralized (e.g., `RECIPE_QUERY_KEYS`, `warehouseQueryKeys`).
- After mutations, invalidate: lists, stats, and categories.
- Realtime subscriptions must be single, cleaned up on unmount; never spawn duplicates.

## Error Handling & Logging

- Use `toast` for user messages; `logger` for details (context, success, warn, error).
- Guard all arrays and nullables to prevent runtime crashes.

## Network Resilience

- Do not retry 4xx.
- Retry 5xx with exponential backoff and capped delay.
- For Supabase outages (503), show friendly messages and auto-retry.

## Directory Layout (partial)

- `src/components/…` — Feature components
- `src/contexts/…` — Providers
- `src/services/…` — API + transformers + auth/payments utilities
- `src/utils/…` — Date, math, type converters, logger
- `docs/…` — Docs (architecture, contributing, naming guide, editing rules)

## Adding a New Feature (Template)

1) Define DB schema (snake_case). Add to Supabase.
2) Add FE types (camelCase) and a service to map to/from DB.
3) If global state is needed, add a Provider; keep side-effects inside it.
4) Build UI components using provider/service APIs.
5) Add React Query keys; invalidate on mutations and in realtime handlers.
6) Add docs: update naming guide and contributing if new fields or patterns are introduced.

## Testing & Verification (Manual)

- OTP login: ensure SPA redirect, `isReady` toggles correctly.
- Paid user login: auto-link runs once; `hasAccess` becomes true; no preview banner.
- Recipe save: margin saved to `margin_keuntungan_persen`; stats reflect immediately.
- Warehouse fetch: `harga_satuan` read as `unit_price`; usage uses `qty_base`.
- Profit analysis: resilient under 5xx, correct date range.

---

If you’re unsure where to put a change, check this file and docs/CONTRIBUTING.md first. When in doubt, centralize logic in services/providers, not in leaf components.
