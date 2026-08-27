import rule from '@/rules/no-inline-types-in-runtime-files.js'
import { runRuleTest } from '@tests/rule-testers/runRuleTest.js'

const INLINE_RUNTIME_DECLARATIONS = `interface RuntimeProps {}\nexport const runtime = true`
const RUNTIME_PROPS_FILE = '/src/types/RuntimeProps.ts'

runRuleTest('no-inline-types-in-runtime-files', rule, {
  assertionOptions: {
    requireData: true,
  },
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
    // Every supported config extension is exempt independently.
    {
      code: INLINE_RUNTIME_DECLARATIONS,
      filename: '/src/vite.config.ts',
    },
    {
      code: INLINE_RUNTIME_DECLARATIONS,
      filename: '/src/vite.config.js',
    },
    {
      code: INLINE_RUNTIME_DECLARATIONS,
      filename: '/src/vite.config.mjs',
    },
    {
      code: INLINE_RUNTIME_DECLARATIONS,
      filename: '/src/vite.config.cjs',
    },
    // Framework proxy files are exempt by their filename suffix.
    {
      code: INLINE_RUNTIME_DECLARATIONS,
      filename: '/src/server/proxy.ts',
    },
    // These statement kinds do not turn a type-only module into runtime code.
    {
      code: `import type { External } from './External'\ninterface RuntimeProps extends External {}`,
      filename: RUNTIME_PROPS_FILE,
    },
    {
      code: `export * from './External'\ninterface RuntimeProps {}`,
      filename: RUNTIME_PROPS_FILE,
    },
    {
      code: `;\ninterface RuntimeProps {}`,
      filename: RUNTIME_PROPS_FILE,
    },
    {
      code: `import External = require('./External')\ninterface RuntimeProps {}`,
      filename: RUNTIME_PROPS_FILE,
    },
    {
      code: `interface RuntimeProps {}\nexport { type RuntimeProps }`,
      filename: RUNTIME_PROPS_FILE,
    },
  ],
  invalid: [
    // Inline interface sitting next to runtime code.
    {
      code: `interface CardProps { title: string }\nexport function Card() { return null }`,
      filename: '/src/components/Card.tsx',
      errors: [
        {
          messageId: 'inlineTypeInRuntimeFile',
          data: { name: 'Card' },
          line: 1,
          column: 1,
        },
      ],
    },
    // Exported type alias next to an exported runtime value.
    {
      code: `export type Status = 'idle' | 'busy'\nexport const initial = 'idle'`,
      filename: '/src/state/status.ts',
      errors: [
        {
          messageId: 'inlineTypeInRuntimeFile',
          data: { name: 'Status' },
          line: 1,
          column: 8,
        },
      ],
    },
    // The exemption needs the base in THIS file. Derived from an import, the
    // type is an ordinary inline type and the file really does hold two units.
    {
      code: `import { fooSchema } from './fooSchema'\nexport function parse() {}\nexport type Foo = z.infer<typeof fooSchema>`,
      filename: '/src/parsers/parse.ts',
      errors: [
        {
          messageId: 'inlineTypeInRuntimeFile',
          data: { name: 'Foo' },
          line: 3,
          column: 8,
        },
      ],
    },
    // Default-exported interfaces must be unwrapped and reported at the declaration.
    {
      code: `export default interface RuntimeProps {}\nexport const runtime = true`,
      filename: '/src/components/runtime.ts',
      errors: [
        {
          messageId: 'inlineTypeInRuntimeFile',
          data: { name: 'Runtime' },
          line: 1,
          column: 16,
        },
      ],
    },
    // Only a terminal architectural suffix is removed from diagnostic data.
    {
      code: `interface PropsFactoryProps {}\nexport function createPropsFactory() {}`,
      filename: '/src/factories/createPropsFactory.ts',
      errors: [
        {
          messageId: 'inlineTypeInRuntimeFile',
          data: { name: 'PropsFactory' },
          line: 1,
          column: 1,
        },
      ],
    },
  ],
})
