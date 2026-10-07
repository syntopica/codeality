// Run by codeality-db from the consumer's project directory with
// `--no-config-lookup`, so the project's own ESLint setup is neither read nor
// changed. The rules are this package's own (src/eslint/kysely), bundled to
// dist/kyselyEslintPlugin.js; the parser resolves from wherever this file is
// installed, which is why typescript-eslint is a peer dependency.
import tseslint from 'typescript-eslint'

import { kyselyEslintPlugin as kysely } from '../dist/kyselyEslintPlugin.js'

const objectNames = (process.env.CODEALITY_DB_KYSELY_OBJECTS ?? 'db,trx').split(
  ',',
)

export default [
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.js', '**/*.mjs'],
    languageOptions: { parser: tseslint.parser },
    plugins: { kysely },
    rules: {
      'kysely/update-without-where': ['error', { objectNames }],
      'kysely/delete-without-where': ['error', { objectNames }],
      'kysely/dynamic-raw-sql': 'error',
    },
  },
]
