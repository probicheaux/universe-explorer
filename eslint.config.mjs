import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/no-empty-interface": "warn",
      "@typescript-eslint/no-inferrable-types": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-var-requires": "warn",
      "@typescript-eslint/prefer-as-const": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/unified-signatures": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",
      "no-duplicate-imports": "error",
      "no-unused-vars": "off", // Turned off in favor of @typescript-eslint/no-unused-vars
    },
  },
];

export default eslintConfig;
