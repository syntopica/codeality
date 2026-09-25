// Run by codeality-db from the consumer's project directory with
// `--no-config-lookup`, so the project's own ESLint setup is neither read nor
// changed. The plugin and the parser resolve from wherever this file is
// installed, which is why both are peer dependencies of the package.
import drizzle from 'eslint-plugin-drizzle'
import tseslint from 'typescript-eslint'

const drizzleObjectName = (
  process.env.CODEALITY_DB_DRIZZLE_OBJECTS ?? 'db,tx'
).split(',')

export default [
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.js', '**/*.mjs'],
    languageOptions: { parser: tseslint.parser },
    plugins: { drizzle },
    rules: {
      'drizzle/enforce-delete-with-where': ['error', { drizzleObjectName }],
      'drizzle/enforce-update-with-where': ['error', { drizzleObjectName }],
    },
  },
]
