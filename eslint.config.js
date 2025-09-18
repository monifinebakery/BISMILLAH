import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Relax strictness on explicit any to speed migration; we will tighten over time
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // Enforce snake_case in Orders and Recipe modules for data fields
    files: [
      "src/components/orders/**/*.{ts,tsx}",
      "src/components/recipe/**/*.{ts,tsx}",
      "src/contexts/RecipeContext.tsx",
    ],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        // Allow PascalCase for types and React components
        { "selector": "typeLike", "format": ["PascalCase"] },
        // Prefer snake_case for properties and parameter properties
        { "selector": "property", "format": ["snake_case"], "leadingUnderscore": "allow" },
        { "selector": "parameterProperty", "format": ["snake_case"], "leadingUnderscore": "allow" },
        // Allow constants either SNAKE or UPPER for now
        { "selector": "variable", "modifiers": ["const"], "format": ["snake_case", "UPPER_CASE"], "leadingUnderscore": "allow" },
        // Keep functions flexible (don’t break hooks/components)
        { "selector": "function", "format": ["camelCase", "snake_case", "PascalCase"] }
      ],
    },
  }
);
