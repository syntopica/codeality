import rule from '@/rules/no-inline-types-in-runtime-files.js'
import { runRuleTest } from '@tests/rule-testers/runRuleTest.js'

runRuleTest('no-inline-types-in-runtime-files', rule, {
  valid: [
    // Types-only file: the type is the primary unit, so it is allowed.
    {
      code: `export interface CardProps { title: string }`,
      filename: '/src/types/CardProps.ts',
    },
    {
      code: `export type Status = 'idle' | 'busy'`,
      filename: '/src/types/Status.ts',
    },
    // Runtime-only file with no inline types.
    {
      code: `export function Card() { return null }`,
      filename: '/src/components/Card.tsx',
    },
    // .d.ts declaration files are exempt.
    {
      code: `interface Globals {}\nexport const x = 1`,
      filename: '/src/globals.d.ts',
    },
    // A type derived from a schema declared in the same file is that schema's
    // signature, not a second unit: extracting it would import the schema back.
    {
      code: `export const fooSchema = z.object({})\nexport type Foo = z.infer<typeof fooSchema>`,
      filename: '/src/schemas/fooSchema.ts',
    },
    // The pre- and post-transform shapes count the same way.
    {
      code: `export const fooSchema = z.object({})\nexport type FooInput = z.input<typeof fooSchema>\nexport type Foo = z.output<typeof fooSchema>`,
      filename: '/src/schemas/fooSchema.ts',
    },
    // Same shape in drizzle: a table and the rows derived from it.
    {
      code: `export const users = pgTable('users', {})\nexport type User = typeof users.$inferSelect\nexport type NewUser = typeof users.$inferInsert`,
      filename: '/src/schema/users.ts',
    },
  ],
  invalid: [
    // Inline interface sitting next to runtime code.
    {
      code: `interface CardProps { title: string }\nexport function Card() { return null }`,
      filename: '/src/components/Card.tsx',
      errors: [{ messageId: 'inlineTypeInRuntimeFile' }],
    },
    // Exported type alias next to an exported runtime value.
    {
      code: `export type Status = 'idle' | 'busy'\nexport const initial = 'idle'`,
      filename: '/src/state/status.ts',
      errors: [{ messageId: 'inlineTypeInRuntimeFile' }],
    },
    // The exemption needs the base in THIS file. Derived from an import, the
    // type is an ordinary inline type and the file really does hold two units.
    {
      code: `import { fooSchema } from './fooSchema'\nexport function parse() {}\nexport type Foo = z.infer<typeof fooSchema>`,
      filename: '/src/parsers/parse.ts',
      errors: [{ messageId: 'inlineTypeInRuntimeFile' }],
    },
  ],
})
