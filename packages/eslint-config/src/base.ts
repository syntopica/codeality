import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import unusedImports from 'eslint-plugin-unused-imports'
import { globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const promisePlugin = require('eslint-plugin-promise') as Record<
  string,
  unknown
>
// eslint-disable-next-line @typescript-eslint/no-require-imports
const security = require('eslint-plugin-security') as {
  configs: {
    recommended: {
      plugins: Record<string, unknown>
      rules: Record<string, unknown>
    }
  }
}

export type SharedConfigOptions = {
  tsconfigRootDir?: string
}

export const createBaseConfig = (options: SharedConfigOptions = {}) => {
  const tsconfigRootDir = options.tsconfigRootDir ?? process.cwd()

  return [
    globalIgnores([
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.next/**',
      '**/.astro/**',
      '**/out/**',
    ]),
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked.map((config) => ({
      ...config,
      files: ['**/*.{ts,tsx}'],
    })),
    {
      files: ['**/*.{ts,tsx}'],
      languageOptions: {
        parser: tseslint.parser,
        ecmaVersion: 2024,
        sourceType: 'module',
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
        ],
        '@typescript-eslint/switch-exhaustiveness-check': 'error',
        // Prefer `type` over `interface` — consistent with the types-in-own-file convention
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
        // Class properties that are never reassigned should be readonly
        '@typescript-eslint/prefer-readonly': 'error',
        'no-unused-vars': 'off',
      },
    },
    {
      files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
      plugins: {
        import: importPlugin,
        'unused-imports': unusedImports,
      },
      settings: {
        'import/resolver': { typescript: true },
      },
      rules: {
        'import/first': 'error',
        'import/newline-after-import': 'error',
        'import/no-duplicates': 'error',
        'import/no-self-import': 'error',
        'import/no-cycle': ['error', { maxDepth: 1 }],
        'unused-imports/no-unused-imports': 'error',
        '@typescript-eslint/no-unused-vars': 'off',
        'unused-imports/no-unused-vars': [
          'error',
          {
            args: 'after-used',
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            ignoreRestSiblings: true,
          },
        ],
      },
    },
    // ── Promise best practices ──────────────────────────────────────────────
    // (no-floating-promises in TS block already covers unhandled Promises)
    {
      files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
      plugins: { promise: promisePlugin },
      rules: {
        // prefer async/await over .then() chaining
        'promise/prefer-await-to-then': 'warn',
        // prefer async/await over callback patterns
        'promise/prefer-await-to-callbacks': 'warn',
        // no Promise inside .then() / .catch() (Promise hell)
        'promise/no-nesting': 'error',
        // no return Promise.resolve(x) inside .then() — redundant
        'promise/no-return-wrap': 'error',
        // resolve/reject param naming convention
        'promise/param-names': 'error',
      },
    },
    // ── Security best practices ─────────────────────────────────────────────
    {
      files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
      plugins: { security: security.configs.recommended.plugins['security'] },
      rules: {
        // eval() with a variable — always dangerous
        'security/detect-eval-with-expression': 'error',
        // non-literal RegExp — potential ReDoS
        'security/detect-non-literal-regexp': 'warn',
        // fs calls with non-literal paths — potential path traversal
        'security/detect-non-literal-fs-filename': 'warn',
        // timing-attack-prone equality checks (passwords, tokens)
        'security/detect-possible-timing-attacks': 'warn',
        // Math.random() for security purposes
        'security/detect-pseudoRandomBytes': 'error',
        // detect-object-injection intentionally OFF — too many false positives
        // with normal bracket-notation array/object access
      },
    },
    prettier,
  ]
}

export default createBaseConfig
