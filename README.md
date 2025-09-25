# BISMILLAH Operational Platform

Welcome to the monorepo powering BISMILLAH’s order, warehouse, finance, and reporting workflows. This README provides a quick entry point; see `MASTER_DOCUMENTATION.md` for the full architecture guide.

## Getting Started

### Prerequisites
- Node.js 18+ (recommend managing via [nvm](https://github.com/nvm-sh/nvm))
- pnpm (workspace uses `pnpm@10.15.0`)
- Supabase project credentials copied into `.env.development`

### Installation
```sh
git clone <REPO_URL>
cd BISMILLAH
pnpm install
```

### Development
```sh
pnpm dev         # Vite dev server on http://localhost:5174
pnpm dev:5173    # Alternate port if needed
```

### Build & Preview
```sh
pnpm build       # Generates dist/ with production assets
pnpm preview     # Serves the production build locally (port 5500)
```

### Linting & Analysis
```sh
pnpm lint        # ESLint (TypeScript, React, hooks rules)
pnpm analyze     # Bundle analyzer build
```

## Tech Stack
- React 18 + Vite + TypeScript
- TailwindCSS + shadcn/ui for design system components
- Supabase (`@supabase/supabase-js`) for authentication and data APIs
- TanStack Query for data fetching/cache management
- Thread-safe auth/session utilities (`src/utils/auth/safeStorage.ts`, `src/utils/auth/refreshSession.ts`)

## Architecture Highlights
- `src/App.tsx` bootstraps contexts and routing.
- `src/contexts/AuthContext.tsx` plus `src/hooks/auth/useAuthLifecycle.ts` manage Supabase sessions with mutex-protected updates.
- `src/components/layout/AppLayout.tsx` preserves last visited routes using `safeStorageSet()` and loads mobile/desktop shells.
- `src/components/ui/` hosts shared components like `CurrencyInput.tsx` (context-aware currency formatting).
- Feature domains live under `src/components/<module>/` and `src/pages/` (orders, purchases, warehouse, finance, settings).

Refer to `MASTER_DOCUMENTATION.md` for a full module map, scripts catalog, and documentation index.

## Documentation Index
- `MASTER_DOCUMENTATION.md` – Single source of truth for architecture, tooling, and references.
- `AGENTS.md` – Coding standards, auth safety rules, naming conventions.
- `RACE_CONDITION_ELIMINATION_GUIDE.md` – Detailed auth/session race-condition strategy.
- `PANDUAN_PENGGUNAAN.md`, `TUTORIAL_PENGGUNAAN.md` – Bahasa Indonesia user guides.

More domain-specific reports (warehouse, finance, payments, etc.) are stored as markdown files in the repository root.

## Operational Notes
- Always use `safeStorage*()` helpers when persisting auth-related data.
- Refresh tokens are mutex-protected via `refreshSessionSafely()` and `periodicSessionRefresh` utilities.
- Run `pnpm lint` and `pnpm build` before pushing changes.
- Use commit prefix `[preview]` for pre-release deployments (auto-notifies staging workflows).

## Issue Tracking & Support
- For Supabase auth issues (`window.supabase` undefined), verify initialization in `src/integrations/supabase/client.ts` and run `test-supabase-connection.cjs`.
- For currency formatting context errors, use the safe hook `useSafeCurrency()` (see memory fix in `src/hooks/useSafeCurrency.ts`).
- Troubleshooting scripts are located in the project root (e.g., `debug-order-completion.cjs`, `warehouse-diagnostic.js`).

---

Latest updates are summarized in commit history and `[preview]` deployments. See `MASTER_DOCUMENTATION.md` for revision logs and detailed change reports.
