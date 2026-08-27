/* eslint-disable max-lines -- Keep one rule's mutation boundary matrix in its RuleTester suite. */
import rule from '@/rules/one-primary-unit.js'
import { runRuleTest } from '@tests/rule-testers/runRuleTest.js'
import { describe, expect, it } from 'vitest'

describe('one-primary-unit metadata', () => {
  it('declares the exact rule contract', () => {
    expect(rule.name).toBe('one-primary-unit')
    expect(Reflect.get(rule, 'defaultOptions')).toEqual([])
    expect(rule.meta).toEqual({
      type: 'problem',
      docs: {
        description:
          'A file must contain exactly one primary top-level exported unit.',
        url: 'https://github.com/VibraComet/eslint-plugin-code-policy/blob/main/packages/eslint-plugin-code-policy/docs/rules/one-primary-unit.md',
      },
      schema: [],
      messages: {
        multiplePrimaryUnits:
          'File contains multiple primary exported units (found {{count}}). The Atomic File Rule requires exactly one primary exported unit.',
      },
    })
  })
})

// Reused by every case that is not exercising a path exemption.
const RUNTIME_FILE = '/src/widgets.ts'
const ROUTE_FILE = '/src/app/api/items/route.ts'
const multiplePrimaryUnitsError = (line: number, column: number) => ({
  messageId: 'multiplePrimaryUnits' as const,
  data: { count: '2' },
  line,
  column,
})

runRuleTest('one-primary-unit', rule, {
  assertionOptions: {
    requireData: true,
  },
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
      filename: ROUTE_FILE,
    },
    // The same exemption through a specifier list rather than inline exports.
    {
      code: `function GET() {}\nfunction POST() {}\nexport { GET, POST }`,
      filename: ROUTE_FILE,
    },
    // A single unit exported through a specifier list is still one unit.
    {
      code: `function doThing() {}\nexport { doThing }`,
      filename: '/src/doThing.ts',
    },
    // A route file's reserved const exports are exempt too.
    {
      code: `export const dynamic = 'force-dynamic'\nexport function GET() {}`,
      filename: ROUTE_FILE,
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
    // Proxy exemption is a terminal filename suffix, not a prefix match.
    {
      code: `export const first = 1\nexport const second = 2`,
      filename: '/src/server/proxy.ts',
    },
    // A factory destructuring that binds only reserved route names contributes
    // no unit; the default export remains the file's single unit.
    {
      code: `export const { GET, POST } = createHandlers()\nexport default function handler() {}`,
      filename: ROUTE_FILE,
    },
    // Unsupported declaration kinds do not become primary units accidentally.
    {
      code: `export namespace Helpers {}\nexport function helper() {}`,
      filename: RUNTIME_FILE,
    },
  ],
  invalid: [
    {
      code: `export const { first, second } = source`,
      filename: '/src/state/pair.ts',
      errors: [multiplePrimaryUnitsError(1, 14)],
    },
    // Two functions in one runtime file.
    {
      code: `export function a() {}\nexport function b() {}`,
      filename: RUNTIME_FILE,
      errors: [multiplePrimaryUnitsError(2, 8)],
    },
    // A component plus an extra exported constant.
    {
      code: `export function Card() {}\nexport const cardVariants = {}`,
      filename: '/src/components/Card.tsx',
      errors: [multiplePrimaryUnitsError(2, 14)],
    },
    // Two units exported through a specifier list count the same as two
    // inline exports.
    {
      code: `function a() {}\nfunction b() {}\nexport { a, b }`,
      filename: RUNTIME_FILE,
      errors: [multiplePrimaryUnitsError(3, 13)],
    },
    // A destructured export binds one name per property, so one declarator
    // can still exceed the budget.
    {
      code: `export const { first, second } = source`,
      filename: RUNTIME_FILE,
      errors: [multiplePrimaryUnitsError(1, 14)],
    },
    {
      code: `export const [head, ...tail] = source`,
      filename: RUNTIME_FILE,
      errors: [multiplePrimaryUnitsError(1, 14)],
    },
    // Derived from an imported schema, the type is a unit of its own again.
    {
      code: `import { fooSchema } from './fooSchema'\nexport function parse() {}\nexport type Foo = z.infer<typeof fooSchema>`,
      filename: RUNTIME_FILE,
      errors: [multiplePrimaryUnitsError(3, 8)],
    },
    // Router suffixes must terminate the filename.
    {
      code: `export const metadata = {}\nexport default function Page() {}`,
      filename: '/src/app/page.tsx.backup',
      errors: [multiplePrimaryUnitsError(2, 1)],
    },
    {
      code: `export function GET() {}\nexport function POST() {}`,
      filename: '/src/app/api/items/route.ts.backup',
      errors: [multiplePrimaryUnitsError(2, 8)],
    },
    {
      code: `export function GET() {}\nexport function POST() {}`,
      filename: '/src/middleware.ts.backup',
      errors: [multiplePrimaryUnitsError(2, 8)],
    },
    // Each supported named declaration kind contributes its own unit.
    {
      code: `export function first() {}\nexport class Second {}`,
      filename: RUNTIME_FILE,
      errors: [multiplePrimaryUnitsError(2, 8)],
    },
    {
      code: `export function first() {}\nexport type Second = string`,
      filename: RUNTIME_FILE,
      errors: [multiplePrimaryUnitsError(2, 8)],
    },
    {
      code: `export function first() {}\nexport interface Second {}`,
      filename: RUNTIME_FILE,
      errors: [multiplePrimaryUnitsError(2, 8)],
    },
    {
      code: `export function first() {}\nexport enum Second { Value }`,
      filename: RUNTIME_FILE,
      errors: [multiplePrimaryUnitsError(2, 8)],
    },
    // Default exports are counted and reported at their export declaration.
    {
      code: `export function first() {}\nexport default function second() {}`,
      filename: RUNTIME_FILE,
      errors: [multiplePrimaryUnitsError(2, 1)],
    },
    // Reserved names are exempt only in a real router file, for every export
    // syntax the rule accepts.
    {
      code: `export const GET = () => {}\nexport const POST = () => {}`,
      filename: RUNTIME_FILE,
      errors: [multiplePrimaryUnitsError(2, 14)],
    },
    {
      code: `export function GET() {}\nexport function POST() {}`,
      filename: RUNTIME_FILE,
      errors: [multiplePrimaryUnitsError(2, 8)],
    },
    {
      code: `function GET() {}\nfunction POST() {}\nexport { GET, POST }`,
      filename: RUNTIME_FILE,
      errors: [multiplePrimaryUnitsError(3, 15)],
    },
    // Ordinary names inside router files still consume the unit budget.
    {
      code: `export const helper = () => {}\nexport default function handler() {}`,
      filename: ROUTE_FILE,
      errors: [multiplePrimaryUnitsError(2, 1)],
    },
    {
      code: `const helper = () => {}\nexport { helper }\nexport default function handler() {}`,
      filename: ROUTE_FILE,
      errors: [multiplePrimaryUnitsError(3, 1)],
    },
  ],
})
