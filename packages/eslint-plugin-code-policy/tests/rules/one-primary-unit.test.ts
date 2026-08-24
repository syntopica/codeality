import rule from '@/rules/one-primary-unit.js'
import { runRuleTest } from '@tests/rule-testers/runRuleTest.js'

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
    // Documents current behaviour, not an endorsement: a destructured export
    // is one declarator, so it counts as one unit however many names it
    // binds. See the gap recorded in TODO.md.
    {
      code: `export const { first, second } = source`,
      filename: '/src/widgets.ts',
    },
  ],
  invalid: [
    // Two functions in one runtime file.
    {
      code: `export function a() {}\nexport function b() {}`,
      filename: '/src/widgets.ts',
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
      filename: '/src/widgets.ts',
      errors: [{ messageId: 'multiplePrimaryUnits' }],
    },
  ],
})
