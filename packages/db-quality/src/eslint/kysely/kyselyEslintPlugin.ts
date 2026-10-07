import type { ESLint } from 'eslint'

import { deleteWithoutWhere } from '@/eslint/kysely/deleteWithoutWhere.js'
import { dynamicRawSql } from '@/eslint/kysely/dynamicRawSql.js'
import { updateWithoutWhere } from '@/eslint/kysely/updateWithoutWhere.js'

// Bundled to dist/kyselyEslintPlugin.js and loaded by
// assets/kysely-eslint.config.mjs; nothing else imports it.
export const kyselyEslintPlugin: ESLint.Plugin = {
  meta: { name: 'codeality-db-kysely' },
  rules: {
    'update-without-where': updateWithoutWhere,
    'delete-without-where': deleteWithoutWhere,
    'dynamic-raw-sql': dynamicRawSql,
  },
}
