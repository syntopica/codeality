import rule from '@/rules/one-primary-unit.js'
import { runRuleTest } from '@tests/rule-testers/runRuleTest.js'

// Reused by every case that is not exercising a path exemption.
const RUNTIME_FILE = '/src/widgets.ts'

runRuleTest('one-primary-unit', rule, {
  valid: [
    // Single exported function — the canonical atomic file.
    {
      code: `export function doThing() {}`,
      filename: '/src/doThing.ts',
    },
    // Single default export.
    {
      code: `export default function Page() { return null }`,
      filename: '/src/app/dashboard/page.tsx',
    },
    // index.ts barrels are exempt (re-export aggregation).
    {
      code: `export { a } from './a'\nexport { b } from './b'`,
      filename: '/src/index.ts',
    },
    // Config files may export multiple units.
    {
      code: `export const a = 1\nexport const b = 2`,
      filename: '/src/eslint.config.ts',
    },
    // Next.js route files may export several reserved HTTP methods.
    {
      code: `export function GET() {}\nexport function POST() {}`,
      filename: '/src/app/api/items/route.ts',
    },
    // The same exemption through a specifier list rather than inline exports.
    {
      code: `function GET() {}\nfunction POST() {}\nexport { GET, POST }`,
      filename: '/src/app/api/items/route.ts',
    },
    // A single unit exported through a specifier list is still one unit.
    {
      code: `function doThing() {}\nexport { doThing }`,
      filename: '/src/doThing.ts',
    },
    // A route file's reserved const exports are exempt too.
    {
      code: `export const dynamic = 'force-dynamic'\nexport function GET() {}`,
      filename: '/src/app/api/items/route.ts',
    },
    // A destructured export that binds one name is still one unit.
    {
      code: `export const { only } = source`,
      filename: RUNTIME_FILE,
    },
    // A schema and the types derived from it are one unit. The type cannot
    // live elsewhere without importing the schema straight back.
    {
      code: `export const fooSchema = z.object({})\nexport type Foo = z.infer<typeof fooSchema>`,
      filename: '/src/schemas/fooSchema.ts',
    },
    {
      code: `export const users = pgTable('users', {})\nexport type User = typeof users.$inferSelect\nexport type NewUser = typeof users.$inferInsert`,
      filename: '/src/schema/users.ts',
    },
    // Destructuring one call's result is one unit: the library returns a
    // single object and the names are how it hands the pieces over. Both of
    // these are verbatim from their official setup guides, and both were
    // flagged in real repos before the exemption.
    {
      code: `export const { handlers, auth, signIn, signOut } = NextAuth(config)`,
      filename: '/src/auth.ts',
    },
    {
      code: `export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)`,
      filename: '/src/i18n/navigation.ts',
    },
    {
      code: `export const [client, dispose] = await connect()`,
      filename: '/src/db/client.ts',
    },
  ],
  invalid: [
    {
      code: `export const { first, second } = source`,
      filename: '/src/state/pair.ts',
      errors: [{ messageId: 'multiplePrimaryUnits' }],
    },
    // Two functions in one runtime file.
    {
      code: `export function a() {}\nexport function b() {}`,
      filename: RUNTIME_FILE,
      errors: [{ messageId: 'multiplePrimaryUnits' }],
    },
    // A component plus an extra exported constant.
    {
      code: `export function Card() {}\nexport const cardVariants = {}`,
      filename: '/src/components/Card.tsx',
      errors: [{ messageId: 'multiplePrimaryUnits' }],
    },
    // Two units exported through a specifier list count the same as two
    // inline exports.
    {
      code: `function a() {}\nfunction b() {}\nexport { a, b }`,
      filename: RUNTIME_FILE,
      errors: [{ messageId: 'multiplePrimaryUnits' }],
    },
    // A destructured export binds one name per property, so one declarator
    // can still exceed the budget.
    {
      code: `export const { first, second } = source`,
      filename: RUNTIME_FILE,
      errors: [{ messageId: 'multiplePrimaryUnits' }],
    },
    {
      code: `export const [head, ...tail] = source`,
      filename: RUNTIME_FILE,
      errors: [{ messageId: 'multiplePrimaryUnits' }],
    },
    // Derived from an imported schema, the type is a unit of its own again.
    {
      code: `import { fooSchema } from './fooSchema'\nexport function parse() {}\nexport type Foo = z.infer<typeof fooSchema>`,
      filename: RUNTIME_FILE,
      errors: [{ messageId: 'multiplePrimaryUnits' }],
    },
  ],
})
