import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import { globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export type SharedConfigOptions = {
  tsconfigRootDir?: string;
};

export const createBaseConfig = (options: SharedConfigOptions = {}) => {
  const tsconfigRootDir = options.tsconfigRootDir ?? process.cwd();

  return [
    globalIgnores([
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.next/**",
      "**/.astro/**",
      "**/out/**",
    ]),
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked.map((config) => ({
      ...config,
      files: ["**/*.{ts,tsx}"],
    })),
    {
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
        parser: tseslint.parser,
        ecmaVersion: 2024,
        sourceType: "module",
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-non-null-assertion": "error",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-misused-promises": "error",
        "@typescript-eslint/consistent-type-imports": [
          "error",
          { prefer: "type-imports", fixStyle: "separate-type-imports" },
        ],
        "@typescript-eslint/switch-exhaustiveness-check": "error",
        "no-unused-vars": "off",
      },
    },
    {
      files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
      plugins: {
        import: importPlugin,
        "unused-imports": unusedImports,
      },
      settings: {
        "import/resolver": { typescript: true },
      },
      rules: {
        "import/first": "error",
        "import/newline-after-import": "error",
        "import/no-duplicates": "error",
        "import/no-self-import": "error",
        "import/no-cycle": ["error", { maxDepth: 1 }],
        "unused-imports/no-unused-imports": "error",
        "@typescript-eslint/no-unused-vars": "off",
        "unused-imports/no-unused-vars": [
          "error",
          {
            args: "after-used",
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            ignoreRestSiblings: true,
          },
        ],
      },
    },
    prettier,
  ];
};

export default createBaseConfig;
