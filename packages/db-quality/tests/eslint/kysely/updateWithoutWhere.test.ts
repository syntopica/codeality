import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'

import { updateWithoutWhere } from '@/eslint/kysely/updateWithoutWhere.js'

const tester = new RuleTester({
  languageOptions: { parser: tseslint.parser },
})
const errors = [{ messageId: 'withoutWhere' }]

tester.run('update-without-where', updateWithoutWhere, {
  valid: [
    "await db.updateTable('t').set({ a: 1 }).where('id', '=', 1).execute()",
    "await db.updateTable('t').set({ a: 1 }).whereRef('a', '=', 'b').executeTakeFirst()",
    "await db.updateTable('t').set({ a: 1 }).where((eb) => eb('id', '=', 1)).execute()",
    "await db.updateTable('t').set({ a: 1 }).$if(only, (qb) => qb.where('id', '=', 1)).execute()",
    "await db.updateTable('t').set({ a: 1 }).$call(scoped).execute()",
    "await other.updateTable('t').set({ a: 1 }).execute()",
    "const q = db.updateTable('t').set({ a: 1 })",
    "await db.selectFrom('t').selectAll().execute()",
    "await db.transaction().execute(async (trx) => trx.selectFrom('t').execute())",
    "await repo.updateTable('t').set({ a: 1 }).execute()",
  ],
  invalid: [
    {
      code: "db.updateTable('t').set({ a: 1 }).execute()",
      errors,
    },
    {
      code: "async function f() { await db.updateTable('t').set({ a: 1 }).executeTakeFirstOrThrow() }",
      errors,
    },
    {
      code: "const f = () => { return db.updateTable('t').set({ a: 1 }).returningAll().executeTakeFirst() }",
      errors,
    },
    {
      code: "await db.transaction().execute(async (trx) => { await trx.updateTable('t').set({ a: 1 }).execute() })",
      errors,
    },
    {
      code: "await this.db.updateTable('t').set({ a: 1 }).execute()",
      errors,
    },
    {
      code: "await db.with('x', (qb) => qb.selectFrom('t').where('id', '=', 1)).updateTable('t').set({ a: 1 }).execute()",
      errors,
    },
    {
      code: "await conn.updateTable('t').set({ a: 1 }).execute()",
      options: [{ objectNames: ['conn'] }],
      errors,
    },
    {
      code: "await db!.updateTable('t').set({ a: 1 })!.execute()",
      errors,
    },
  ],
})
