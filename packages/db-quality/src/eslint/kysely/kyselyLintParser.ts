import { join, resolve } from 'node:path'

import type { Linter } from 'eslint'
import tseslint from 'typescript-eslint'

import { typedLintFiles } from '@/eslint/kysely/typedLintFiles.js'

// Bundled to dist/kyselyLintParser.js and used by
// assets/kysely-eslint.config.mjs. A file the project's tsconfig.json
// includes is parsed with type information, so dynamic-raw-sql can accept a
// value typed as a literal union (an imported `as const` array, say); any
// other file is parsed without it, as before, rather than failing to parse
// and dropping out of the report. Measured on a 2,300-file Next.js project:
// 2.0 s untyped, 4.7 s typed.
/** typescript-eslint's parser, typed for the files the project's tsconfig.json includes. */
export const kyselyLintParser = (root: string): Linter.Parser => {
  const tsconfig = join(root, 'tsconfig.json')
  const typed = typedLintFiles(root, tsconfig)
  // Its compatibility typings omit the options argument the parser reads.
  const parse = tseslint.parser.parseForESLint.bind(tseslint.parser) as (
    code: string,
    options?: Record<string, unknown>,
  ) => Linter.ESLintParseResult
  return {
    meta: { name: 'codeality-db-kysely-parser' },
    parseForESLint: (code: string, options?: Record<string, unknown>) => {
      const filePath = options?.['filePath']
      return parse(
        code,
        typeof filePath === 'string' && typed.has(resolve(filePath))
          ? { ...options, project: tsconfig, tsconfigRootDir: root }
          : options,
      )
    },
  }
}
