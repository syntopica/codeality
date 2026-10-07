import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'

import { deleteWithoutWhere } from '@/eslint/kysely/deleteWithoutWhere.js'

const tester = new RuleTester({
  languageOptions: { parser: tseslint.parser },
})
const errors = [{ messageId: 'withoutWhere' }]

tester.run('delete-without-where', deleteWithoutWhere, {
  valid: [
    "await db.deleteFrom('membership').where('id', '=', 1).execute()",
    "await trx.deleteFrom('membership').where('id', 'in', ids).executeTakeFirst()",
    "await db.updateTable('membership').set({ a: 1 }).execute()",
    "db.deleteFrom('membership')",
  ],
  invalid: [
    { code: "db.deleteFrom('membership').execute()", errors },
    {
      code: "async function f() { await db.deleteFrom('membership').executeTakeFirst() }",
      errors,
    },
    {
      code: "const f = () => db.deleteFrom('membership').returningAll().execute()",
      errors,
    },
    {
      code: "await db.transaction().execute(async (trx) => { await trx.deleteFrom('membership').execute() })",
      errors,
    },
    {
      code: "await db?.deleteFrom('membership').execute()",
      errors,
    },
  ],
})
