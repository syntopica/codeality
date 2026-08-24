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

// Root-level config files (eslint.config.ts, knip.config.ts, and any other
// *.config.{ts,mjs,js}) sit outside a template tsconfig's `include: ["src"]`,
// so the project service rejects them with "was not found by the project
// service" the moment lefthook lints a staged file that touches one.
// Reused below for both `allowDefaultProject` (so these globs get linted at
// all) and `disableTypeChecked` (so they get linted with rules that don't
// need real type information - see the comment at that block for why).
const DEFAULT_PROJECT_FILE_GLOBS = [
  '*.config.ts',
  '*.config.mjs',
  '*.config.js',
  'eslint.config.ts',
  'knip.config.ts',
]

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
      '**/.lighthouseci/**',
      '**/out/**',
      // Test fixtures are inputs, not code: a rule that reads the filesystem
      // needs deliberately malformed sample files on disk, and linting them
      // reports the very violations they exist to reproduce.
      '**/tests/fixtures/**',
      '**/__fixtures__/**',
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
          // allowDefaultProject lints DEFAULT_PROJECT_FILE_GLOBS with the
          // default compiler options instead of a real tsconfig project.
          // Entries must not contain `**` and are capped at 8 matched files
          // by typescript-eslint - both satisfied by these root-level globs.
          projectService: {
            allowDefaultProject: DEFAULT_PROJECT_FILE_GLOBS,
          },
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
      // The default compiler options behind allowDefaultProject don't carry
      // the real tsconfig's module resolution and lib settings, so ordinary
      // imports here (even Node builtins like `node:path`) come back as
      // unresolved "error" types rather than their real types. Every rule
      // above that needs real type information (no-floating-promises,
      // no-misused-promises, switch-exhaustiveness-check, prefer-readonly,
      // and the strictTypeChecked rules from the block above this one) would
      // otherwise misfire on every import in these files. disableTypeChecked
      // only turns off rules that require type information; the purely
      // syntactic ones (no-explicit-any, consistent-type-imports, ...) still
      // apply.
      files: DEFAULT_PROJECT_FILE_GLOBS,
      ...tseslint.configs.disableTypeChecked,
    },
    {
      files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
      plugins: {
        import: importPlugin,
        'unused-imports': unusedImports,
      },
      settings: {
        'import/resolver': { typescript: true },
        // eslint-plugin-import defaults to ['.js', '.mjs', '.cjs'] for its
        // own cross-file export-map resolution (separate from the parser
        // ESLint itself uses). Without .ts/.tsx/.jsx listed here, every rule
        // that needs that resolution -- import/no-cycle included -- silently
        // treats every non-JS file as unresolvable and reports nothing.
        // Mirrors the `files` glob on this config block.
        'import/extensions': ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx'],
      },
      rules: {
        'import/first': 'error',
        'import/newline-after-import': 'error',
        'import/no-duplicates': 'error',
        'import/no-self-import': 'error',
        // No maxDepth: shallow caps miss exactly the long cycles that tangle
        // large codebases. `allowUnsafeDynamicCyclicDependency` stays off.
        'import/no-cycle': ['error', { ignoreExternal: true }],
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
