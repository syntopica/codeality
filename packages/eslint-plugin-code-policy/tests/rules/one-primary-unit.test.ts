import rule from '@/rules/one-primary-unit.js'
import { ruleTester } from '@tests/utils/rule-tester.js'

ruleTester.run('one-primary-unit', rule, {
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
  ],
})
