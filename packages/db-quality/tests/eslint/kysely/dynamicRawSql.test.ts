import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'

import { dynamicRawSql } from '@/eslint/kysely/dynamicRawSql.js'

const tester = new RuleTester({
  languageOptions: { parser: tseslint.parser },
})
const errorFor = (method: string) => [
  { messageId: 'dynamicRawSql', data: { method } },
]

tester.run('dynamic-raw-sql', dynamicRawSql, {
  valid: [
    "sql.raw('now()')",
    'sql.raw(`now()`)',
    'sql.lit(42)',
    "sql.id('public', 'person')",
    "const COLUMN = 'name'; sql.ref(COLUMN)",
    "const TABLE = 'person' as const; sql.table(TABLE)",
    "const COLUMNS = ['a', 'b'] as const; sql.ref(COLUMNS[index])",
    "const SORT = { asc: 'asc', desc: 'desc' }; sql.raw(SORT[direction])",
    'sql`select * from person where id = ${id}`',
    'other.raw(input)',
    'sql.join(values)',
    "for (const t of ['a', 'b']) sql.table(t)",
    "const TABLES = ['a', 'b']; for (const t of TABLES) sql.table(t)",
    "for await (const t of ['a', 'b'] as const) sql.table(t)",
    "const [FIRST, SECOND] = ['a', 'b'] as const; sql.table(FIRST); sql.ref(SECOND)",
    "const PREFIX = 'app'; sql.raw(`${PREFIX}_person`)",
    "for (const t of ['a', 'b']) sql.raw(`delete from ${t}`)",
    "for (const t of ['a', 'b']) { const name = `${t}_fk`; sql.id(name) }",
  ],
  invalid: [
    { code: 'sql.raw(input)', errors: errorFor('raw') },
    { code: 'sql.raw(`order by ${column}`)', errors: errorFor('raw') },
    { code: 'sql.lit(value)', errors: errorFor('lit') },
    { code: "sql.id('public', table)", errors: errorFor('id') },
    { code: 'let column = "a"; sql.ref(column)', errors: errorFor('ref') },
    { code: 'sql.table(request.params.table)', errors: errorFor('table') },
    { code: 'sql.raw(...parts)', errors: errorFor('raw') },
    {
      code: 'const COLUMNS = [userColumn]; sql.ref(COLUMNS[0])',
      errors: errorFor('ref'),
    },
    {
      code: 'const NAME = String(x); sql.ref(NAME)',
      errors: errorFor('ref'),
    },
    {
      code: 'function f(column: string) { return sql.ref(column) }',
      errors: errorFor('ref'),
    },
    {
      code: "for (let t of ['a', 'b']) sql.table(t)",
      errors: errorFor('table'),
    },
    {
      code: 'for (const t of tables) sql.table(t)',
      errors: errorFor('table'),
    },
    {
      code: "for (const t of ['a', input]) sql.table(t)",
      errors: errorFor('table'),
    },
    {
      code: "const [FIRST = input] = ['a']; sql.table(FIRST)",
      errors: errorFor('table'),
    },
    {
      code: "const [, ...REST] = ['a', 'b']; sql.table(REST)",
      errors: errorFor('table'),
    },
    {
      code: 'const [FIRST] = input; sql.table(FIRST)',
      errors: errorFor('table'),
    },
    {
      code: 'sql.raw(`delete from ${table}`)',
      errors: errorFor('raw'),
    },
    {
      code: 'const name = `${input}_fk`; sql.id(name)',
      errors: errorFor('id'),
    },
    {
      code: 'const looped = `${looped}`; sql.raw(looped)',
      errors: errorFor('raw'),
    },
  ],
})

// With type information (typescript-eslint's projectService), a value typed as
// a literal or a union of literals passes even where the syntax cannot follow
// it; a plain `string` still fires.
// The project service reads the linted file and its imports from disk: TABLES.ts
// is an `as const` array the syntax cannot follow across the import.
const TYPED_ROOT = mkdtempSync(join(tmpdir(), 'dbq-kysely-typed-'))
for (const [path, text] of Object.entries({
  'tsconfig.json':
    '{ "compilerOptions": { "strict": true, "module": "ESNext", "moduleResolution": "Bundler" }, "include": ["*.ts"] }\n',
  'TABLES.ts': "export const TABLES = ['person', 'pet'] as const\n",
  'file.ts': 'export {}\n',
}))
  writeFileSync(join(TYPED_ROOT, path), text)
const typedTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { projectService: true, tsconfigRootDir: TYPED_ROOT },
  },
})
const typed = (code: string) => ({ code, filename: `${TYPED_ROOT}/file.ts` })

typedTester.run('dynamic-raw-sql (typed)', dynamicRawSql, {
  valid: [
    typed(
      "import { TABLES } from './TABLES'; declare const sql: any; for (const t of TABLES) sql.table(t)",
    ),
    typed(
      "import { TABLES } from './TABLES'; declare const sql: any; const [FIRST] = TABLES; sql.table(FIRST)",
    ),
    typed(
      "import { TABLES } from './TABLES'; declare const sql: any; sql.table(TABLES[0])",
    ),
    typed(
      "declare const sql: any; function f(direction: 'asc' | 'desc') { return sql.raw(direction) }",
    ),
    typed(
      'declare const sql: any; const SIZES = [10, 20] as const; for (const n of SIZES) sql.lit(n)',
    ),
    typed(
      "import { TABLES } from './TABLES'; declare const sql: any; for (const t of TABLES) { const name = `${t}_fk`; sql.ref(`${t}.userId`); sql.id(name) }",
    ),
  ],
  invalid: [
    {
      ...typed(
        'declare const sql: any; function f(column: string) { return sql.ref(column) }',
      ),
      errors: errorFor('ref'),
    },
    {
      ...typed(
        "import { TABLES } from './TABLES'; declare const sql: any; declare const i: number; sql.table(`${TABLES[i]}_${String(i)}`)",
      ),
      errors: errorFor('table'),
    },
    {
      ...typed(
        "declare const sql: any; declare const input: any; sql.raw(input as 'asc')",
      ),
      errors: errorFor('raw'),
    },
  ],
})
