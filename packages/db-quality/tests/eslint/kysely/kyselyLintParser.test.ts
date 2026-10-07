import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

import { kyselyEslintPlugin } from '@/eslint/kysely/kyselyEslintPlugin.js'
import { kyselyLintParser } from '@/eslint/kysely/kyselyLintParser.js'

const LOOP =
  "import { TABLES } from './TABLES'\ndeclare const sql: any\nfor (const t of TABLES) sql.table(t)\n"

const project = (tsconfig: string | undefined): string => {
  const root = mkdtempSync(join(tmpdir(), 'dbq-kysely-lint-'))
  const files: Record<string, string> = {
    'TABLES.ts': "export const TABLES = ['person', 'pet'] as const\n",
    'typed.ts': LOOP,
    'loose.ts': LOOP,
  }
  if (tsconfig !== undefined) files['tsconfig.json'] = tsconfig
  for (const [path, text] of Object.entries(files))
    writeFileSync(join(root, path), text)
  return root
}

const lint = async (root: string): Promise<Record<string, string[]>> => {
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.ts'],
        languageOptions: { parser: kyselyLintParser(root) },
        plugins: { kysely: kyselyEslintPlugin },
        rules: { 'kysely/dynamic-raw-sql': 'error' },
      },
    ],
  })
  const results = await eslint.lintFiles(['typed.ts', 'loose.ts'])
  return Object.fromEntries(
    results.map((result) => [
      result.filePath.slice(root.length + 1),
      result.messages.map((message) => message.ruleId ?? 'parse-error'),
    ]),
  )
}

describe('kyselyLintParser', () => {
  it('types the files the tsconfig includes and parses the rest untyped', async () => {
    const root = project('{ "include": ["typed.ts", "TABLES.ts"] }\n')
    expect(await lint(root)).toEqual({
      'typed.ts': [],
      'loose.ts': ['kysely/dynamic-raw-sql'],
    })
  })
  it('parses every file untyped without a tsconfig.json', async () => {
    expect(await lint(project(undefined))).toEqual({
      'typed.ts': ['kysely/dynamic-raw-sql'],
      'loose.ts': ['kysely/dynamic-raw-sql'],
    })
  })
})
