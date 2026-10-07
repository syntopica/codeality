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
  ],
})
