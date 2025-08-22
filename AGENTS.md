# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React + TypeScript app code (`components/`, `pages/`, `hooks/`, `utils/`, `services/`, `contexts/`, `integrations/`).
- `public/`: Static assets served as-is.
- `supabase/`: Edge Functions and config; shared middleware in `supabase/functions/_shared/`.
- `sql/` and `database_fixes/`: SQL scripts and one-off DB migrations.
- `docs/`: Developer guides and troubleshooting notes.
- `dist/`: Production build output (generated).
- `scripts/`: Local helper scripts.
- `test_price_adjustment.js`: Ad-hoc test utility (Node script).

## Build, Test, and Development Commands
- `npm run dev`: Start Vite dev server on `http://localhost:5173`.
- `npm run build`: Production build to `dist/`.
- `npm run preview`: Preview the built app on `http://localhost:5500`.
- `npm run lint`: Lint the codebase using `eslint.config.js`.
- `node test_price_adjustment.js`: Run the price-adjustment check locally.
- Helpful: `npm run analyze` to build with bundle analyzer; `npm run clean` to remove caches/artifacts.

## Coding Style & Naming Conventions
- TypeScript first (`.ts/.tsx`), 2-space indentation.
- Components: PascalCase files in `src/components/` (e.g., `PriceChart.tsx`).
- Hooks: `useXyz.ts` in `src/hooks/` (e.g., `useProfitTrend.ts`).
- Variables camelCase, constants UPPER_SNAKE_CASE, utility files kebab-case.
- Run `npm run lint` before committing; fix issues inline or with your editor.

## Testing Guidelines
- No formal runner configured; keep focused Node tests alongside utilities (see `test_price_adjustment.js`).
- Prefer function-level tests with clear inputs/outputs; name files `*.test.ts` if adding a runner later (Vitest/Jest).
- Validate DB-facing logic with safe sample datasets in `sql/` where applicable.

## Commit & Pull Request Guidelines
- Follow Conventional Commits-style prefixes: `feat:`, `fix:`, `docs:`, `refactor:`, `enhance:`, `chore:`.
  - Examples: `fix: correct JSX in PriceAdjustmentDebug`, `feat: implement automatic pricing for bahan baku`.
- PRs: include a clear description, linked issues, and UI screenshots for visual changes; list any env/config changes.

## Security & Configuration Tips
- Frontend env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in `.env*` (already present).
- Server/Edge env (do NOT commit): set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your deploy provider (Netlify/Supabase). Missing these triggers “is not defined” in `src/integrations/supabase/serverClient.ts` and `supabase/functions/_shared/middleware.ts`.
- Never expose Service Role keys to the browser; keep them server-side only.

