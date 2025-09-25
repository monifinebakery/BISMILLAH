# BISMILLAH Application Master Documentation

## 1. Introduction
- **Project Purpose**: BISMILLAH is a Supabase-backed operational suite for order management, purchasing, warehouse tracking, and financial insights built with React 18, Vite, and TailwindCSS.
- **Audience**: Developers, DevOps engineers, QA analysts, and stakeholders who need a single reference for architecture, workflows, and maintenance procedures.
- **Quick Links**:
  - `README.md` – Lovable project basics.
  - `AGENTS.md` – Development guardrails and coding standards.
  - `RACE_CONDITION_ELIMINATION_GUIDE.md` – Auth/session design deep dive.
  - `PANDUAN_PENGGUNAAN.md` & `TUTORIAL_PENGGUNAAN.md` – Bahasa Indonesia user walkthroughs.

## 2. Architecture Overview
- **Tech Stack** (`package.json`): React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, Supabase, TanStack Query.
- **High-Level Modules**:
  - **Auth** – `src/contexts/AuthContext.tsx`, `src/hooks/auth/`
  - **Routing/Layout** – `src/App.tsx`, `src/routes/`, `src/components/layout/`
  - **Feature Domains** – `src/components/<domain>/`, `src/pages/`
  - **Services & Data** – `src/services/`, `src/integrations/supabase/`
  - **Utilities** – `src/utils/`
- **Runtime Flow**:
  1. `src/App.tsx` bootstraps contexts, initializes auth lifecycle, hooks into periodic refresh.
  2. `src/routes/` defines protected vs public routes, lazy loads feature pages.
  3. Feature components use domain services for Supabase access and hooks for business logic.
  4. UI utilises shadcn/ui primitives with Tailwind for styling.

```mermaid
document
  flowchart TD
    A[Supabase Auth State] -->|refreshSession()| B(AuthContext)
    B --> C(useAuthLifecycle)
    C --> D(AppLayout)
    D --> E(Route Guards)
    E --> F(Feature Pages)
    F --> G(Supabase Services)
```

## 3. Authentication & Session Management
- **Core Files**:
  - `src/hooks/auth/useAuthLifecycle.ts` – Restores last path, manages silent refresh, integrates `periodicSessionRefresh`.
  - `src/utils/auth/periodicSessionRefresh.ts` – User-activity aware refresh scheduler with inactivity detection.
  - `src/utils/auth/refreshSession.ts` – `silentRefreshSession()` and guarded refresh flows.
  - `src/services/auth/core/session.ts` – Mutex-protected session updates.
  - `src/hooks/auth/useAuthState.ts` – Atomic auth state hook.
  - `src/utils/auth/safeStorage.ts` – Thread-safe `localStorage` helpers.
- **Flow Summary**:
  - `useAuthLifecycle()` listens to visibility changes, stores `app:last-path`, refreshes sessions on tab focus, and restores prior routes when sessions recover.
  - `periodicSessionRefresh.getInstance()` starts/stops refresh timers based on user activity, relying on `silentRefreshSession()`.
  - All local storage writes go through `safeStorage*()` to prevent race conditions.
- **Reference Docs**: `AUTH_SECURITY_SUMMARY.md`, `AUTH_GUARD_RACE_CONDITION_FIX.md`, `RACE_CONDITION_ELIMINATION_GUIDE.md`.

## 4. Routing & Layout
- **Entry Point**: `src/App.tsx` wires contexts (auth, payment, layout) and mounts `AppRoutes`.
- **Routes**: `src/routes/AppRoutes.tsx`, `src/routes/ProtectedRoutes.tsx`, feature-specific route files.
- **Layout Shells**: `src/components/layout/AppLayout.tsx` selects mobile/desktop layout, persists last path via `safeStorageSet()` and clears on `/auth`.
- **UI Framework**:
  - `src/components/layout/MobileLayout.tsx` and `DesktopLayout.tsx` deliver responsive shells.
  - `src/hooks/useAppLayout.ts` centralises layout state (sidebars, modals, etc.).

## 5. UI Components & Styling
- **Shared UI Library**: `src/components/ui/` contains reusable inputs, dialogs, tables.
  - Example: `CurrencyInput.tsx` handles prefix detection via `useSafeCurrency()` and debounced number parsing.
- **Design System**:
  - Tailwind config in `tailwind.config.ts` and theme tokens set by shadcn `components.json`.
  - `cn()` helper in `src/lib/utils.ts` merges Tailwind classes.
- **Icons & Visuals**: `lucide-react`, `@radix-ui/react-*` components integrated across UI modules.

## 6. Feature Modules
- **Orders** (`src/components/orders/`, `src/pages/OrdersPage.tsx`): handles order CRUD, linking, analytics. Supabase interactions via `src/services/orders/`.
- **Purchase & Warehouse**: `src/components/purchase/`, `src/components/warehouse/`, `src/pages/PurchasePage.tsx`, `src/pages/WarehousePageRefactored.tsx`.
- **Financial Reports**: `src/components/financial/`, `src/utils/orderFinancialSync.ts` ensures consistency between orders and finances.
- **Promotions & Pricing**: `src/components/promoCalculator/`, `src/components/pricing/`, using helper libraries in `src/components/promoCalculator/utils/`.
- **Settings & Administration**: `src/pages/Settings.tsx`, includes device management, user roles, and environment toggles.

Each domain typically includes:
- **Components** for UI (tables, dialogs).
- **Services** for Supabase operations.
- **Hooks** for stateful logic.
- **Docs** in root `.md` files describing fixes, audits, or tutorials (see Section 10).

## 7. Data & API Layer
- **Supabase Client**: `src/integrations/supabase/client.ts` provides typed client with `createClient()`.
- **API Services**: `src/services/` contains domain-specific modules (orders, finance, reports).
- **Utilities**: `src/utils/orderFinancialSync.ts`, `src/utils/logger.ts`, `src/utils/androidSessionFix.ts` for platform-specific adjustments.
- **SQL & DB Scripts**: `supabase/`, `database/`, `migrations/` directories host SQL schema, RPC checks, and syncing scripts.

## 8. Shared Hooks & Utilities
- **Hooks**: `src/hooks/` includes business hooks (`usePaymentContext`, `useBusinessSettings`, `useIsMobile`).
- **Contexts**: `src/contexts/` hosts global providers for auth, payment, layout, currency.
- **Utility Modules**: `src/utils/` includes logging, formatting, safe storage, Android/iOS fixes, debounce helpers.

## 9. Build, Testing, and Deployment
- **Commands** (`package.json`):
  - `pnpm dev` – Start Vite dev server on port 5174.
  - `pnpm build` – Production build; runs `scripts/generate-version.js` then `vite build`.
  - `pnpm preview` – Serve `dist/` locally.
  - `pnpm analyze` / `analyze:server` – Build with bundle analyzer.
  - `pnpm lint` – ESLint with TypeScript + React rules.
  - `pnpm clean` / `clean:all` – Reset caches and dependencies.
- **Testing**: No formal test runner; use targeted scripts like `browser-test.js`, `bulk-operations-test.js`, `test-order-status.js`, etc., located in repo root.
- **Deployment Notes**:
  - Build artifacts in `dist/` (do not commit).
  - Commit message keyword `[preview]` used for pre-release pushes.
  - `vercel.json`, `vercel-optimized.json` configure Vercel deployments; `netlify.toml` exists for alternative hosting.

## 10. Knowledge Base & Documentation Index
- **Auth & Security**: `AUTH_SECURITY_SUMMARY.md`, `AUTH_GUARD_RACE_CONDITION_FIX.md`, `RACE_CONDITION_ELIMINATION_GUIDE.md`.
- **Performance**: `README_OPTIMASI_PERFORMA.md`, `ULTRA_FAST_PERFORMANCE.md`, `DOKUMENTASI_OPTIMASI_PERFORMA.md`.
- **Feature Reports**: Files prefixed with `WAREHOUSE_`, `PAYMENT_`, `PROFIT_ANALYSIS_`, etc., in repo root detail fixes and audits.
- **Tutorials**: `PANDUAN_PENGGUNAAN.md`, `TUTORIAL_PENGGUNAAN.md`, `README-TUTORIAL.md` (Bahasa Indonesia).
- **Troubleshooting**: `TROUBLESHOOTING.md`, `DEBUG_*` documents, `ERROR-PREVENTION.md`.
- **Checklists & Audit Trails**: `CHECKLIST_APLIKASI.md`, `FINAL_FIX_SUMMARY.md`, `IMPLEMENTATION_REPORT.md`.

Consider creating a table of contents or index referencing these `.md` files for quick navigation.

## 11. Environment & Configuration
- **Environment Files**: `.env.example`, `.env.development`, `.env.preview`, `.env.production`.
- **Secret Handling**: Only `VITE_` prefixed variables are exposed to the browser. See `AGENTS.md` for security requirements.
- **Supabase Keys**: Managed through `.env.*`; never hardcode secrets.
- **PWA & Assets**: `public/` hosts icons, `manifest.json`, service worker scripts.

## 12. Operational Playbooks
- **Monitoring Logs**: `src/utils/logger.ts` integrates `loglevel`; production logging guidelines in `PRODUCTION_LOGGING_GUIDE.md`.
- **Session Diagnostics**: `test-auth-guard-flow.js`, `test-chatbot-with-auth.cjs`, `AUTH_SECURITY_SUMMARY.md`.
- **Financial Consistency**: `FINANCIAL_SYNC_TEST_GUIDE.md`, `debug_financial_vs_profit_analysis.js`.
- **Warehouse Checks**: `warehouse-diagnostic.js`, `WAREHOUSE_*` docs.
- **Recovery Scripts**: `force-clear-sw-cache.js`, `fix-payment-linking.js`, `create-missing-transactions.sql`.

## 13. Scripts Catalog (Highlights)
- **Automation / Maintenance**:
  - `scripts/generate-version.js` – Injects build metadata into `public/version.json`.
  - `cleanup-wac-notifications.cjs`, `cleanup-notifications.js` – Notification housekeeping.
  - `verify-bulk-implementation.js`, `bulk-operations-test.js` – Bulk operations validation.
- **Diagnostic Tools**:
  - `debug-order-completion.cjs`, `diagnose-user-date-issues.js`, `test-order-status.js`.
  - SQL procs under `database/` and `supabase/` for schema verification.
- **Data Importers**: `add-sample-bahan-baku.cjs`, `update_currency_imports.sh`, `bulk_update_currency.py`.

## 14. Contribution Guidelines
- **Coding Standards**: Follow `AGENTS.md`, `eslint.config.js`, and Tailwind conventions (2-space indent, PascalCase components, snake_case in Orders/Recipe data models).
- **Auth Safety Rules**:
  - Use `safeStorage*()` for storage.
  - Invoke `updateAuthState()` for atomic session updates.
  - Route all refresh attempts through `refreshSessionSafely()` utilities.
- **Testing Before PR**: Run `pnpm lint` and `pnpm build` locally; validate critical flows listed in `CHECKLIST_APLIKASI.md`.

## 15. Future Enhancements (Suggested)
- **Documentation Index**: Auto-generate a TOC for all `.md` reports.
- **Diagram Updates**: Expand mermaid diagrams for data flows or multi-tab session scenarios.
- **Testing Automation**: Add Vitest or Playwright suites for primary flows (`login`, `order creation`, `financial sync`).

---

### Revision History
- **2025-09-25**: Initial master documentation drafted to consolidate architecture, workflows, and reference material.
