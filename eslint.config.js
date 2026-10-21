// ESLint "flat config". ESLint finds bad patterns that still compile fine
// (unused variables, `any`, floating promises...). Run: npm run lint
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Never lint build output or dependencies
  { ignores: ["dist/**", "node_modules/**"] },

  // TypeScript-aware recommended rules
  ...tseslint.configs.recommended,

  {
    rules: {
      // `any` switches off type checking. We use `unknown` + narrowing instead.
      "@typescript-eslint/no-explicit-any": "error",
      // Allow unused parameters that start with _ (e.g. `_req` in Express handlers)
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
);
