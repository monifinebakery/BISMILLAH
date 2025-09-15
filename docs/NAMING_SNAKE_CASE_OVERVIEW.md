# Snake Case Naming – Project Overview

This project standardizes data field naming to snake_case across modules for consistency with the database and APIs.

Status
- Orders: snake_case-first (complete).
- Recipes: snake_case API available; UI migration to follow.

Why snake_case
- Consistent with Postgres and Supabase conventions.
- Easier cross-language interop and JSON serialization.
- Reduces ambiguity (single canonical form for data fields).

Conventions
- Data fields, API payloads, DB columns: snake_case.
- React components, hooks, and types: keep PascalCase/camelCase per ecosystem norms.
- For transitions, adapters map camel ⇄ snake.

Orders module
- Hooks: `useOrderDataSnake`, `useOrderOperationsSnake` return/accept snake_case data.
- Services: `fetchOrdersSnake`, `addOrderSnake`, `updateOrderSnake`, `updateOrderStatusSnake`, `deleteOrderSnake`.
- Adapters: `to_snake_order`, `from_snake_order` for safe interop during migration.
- UI: Tables, dialogs, and analytics render snake fields first with camel fallback.

Recipes module
- Transformers: `recipeTransformers.ts` (`to_snake_recipe`, `from_snake_recipe`).
- API: `recipeApi.getRecipesSnake()`, `getRecipeSnake()`, `createRecipeSnake()`, `updateRecipeSnake()`.
- UI screens can progressively opt in by converting to snake fields at boundaries.

Validation keys (orders)
- `customer_name`, `order_value`, `items_per_order`, with supporting keys `phone`, `email`, `address`, `notes`.

Recommended usage
- New screens: use snake hooks/services directly.
- Existing screens: convert incoming camel to snake at boundaries, then render snake fields.
- Remove camel fallbacks once all screens no longer rely on camel.

See also
- `docs/ORDERS_SNAKE_CASE_MIGRATION.md` – detailed guide for Orders.
- `SNAKE_CASE_NAMING_GUIDE.md` – general naming rules.
