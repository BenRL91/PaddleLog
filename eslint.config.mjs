import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Baseline debt imported with the sanitized v97 snapshot. Keep these rules
    // visible as warnings while new CI blocks every other lint error.
    // Remove these overrides as the listed files are typed/refactored.
    files: [
      "app/api/backups/route.ts",
      "app/api/library-health/route.ts",
      "app/api/state/route.ts",
      "lib/server/health.ts",
      "lib/server/library.ts",
      "lib/server/recovery.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    // Legacy vanilla auth controller intentionally aliases `this` throughout.
    // Track as baseline debt rather than rewriting authentication in a CI-only PR.
    files: ["public/leeway-auth.js"],
    rules: {
      "@typescript-eslint/no-this-alias": "warn",
    },
  },
  {
    files: ["components/ui/**/*.{ts,tsx}", "hooks/use-mobile.ts"],
    rules: {
      // These files are vendored verbatim from shadcn@4.17.0. Keep the
      // registry source intact while applying the stricter rules to Site code.
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
