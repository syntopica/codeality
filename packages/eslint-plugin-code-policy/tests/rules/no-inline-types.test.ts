import rule from '@/rules/no-inline-types.js'
import { runRuleTest } from '@tests/rule-testers/runRuleTest.js'

const APP_PAGE = '/src/app/page.tsx'
const USERS_ROUTE = '/src/app/api/users/route.ts'

/**
 * no-inline-types: enforces one top-level declaration per file
 * (analogous to atomic-file but focused on types/interfaces/classes/enums)
 * Exemptions: .d.ts files; route.ts HTTP methods; Next.js reserved exports
 */

runRuleTest('no-inline-types', rule, {
  assertionOptions: {
    requireData: true,
  },
  valid: [
    // single function — OK
    {
      code: `export default function Page() { return null }`,
      filename: APP_PAGE,
    },
    // single interface only — OK
    {
      code: `export interface Foo { name: string }`,
      filename: '/src/types/Foo.ts',
    },
    // .d.ts is always exempt
    {
      code: `
        export interface A {}
        export interface B {}
      `,
      filename: '/src/global.d.ts',
    },
    // Next.js reserved exports on route.ts are exempt
    {
      code: `
        export async function GET() {}
        export async function POST() {}
      `,
      filename: USERS_ROUTE,
    },
    // Next.js page-level metadata + default export — OK
    {
      code: `
        export const metadata = { title: 'Title' }
        export default function Page() { return null }
      `,
      filename: APP_PAGE,
    },
    // The JavaScript route suffix has the same HTTP-method exemption.
    {
      code: `export function GET() {}\nexport function POST() {}`,
      filename: '/src/app/api/users/route.js',
    },
    // Route handlers may also be exported variables.
    {
      code: `export const GET = () => {}\nexport const POST = () => {}`,
      filename: USERS_ROUTE,
    },
    // Re-exports have no declaration and therefore are not primary units.
    {
      code: `export * from './User'`,
      filename: '/src/models/index.ts',
    },
  ],

  invalid: [
    // two functions in the same file — second is reported
    {
      code: `
        export function One() {}
        export function Two() {}
      `,
      filename: '/src/components/Stuff.ts',
      errors: [
        {
          messageId: 'singleDeclaration',
          data: { name: 'Two' },
          line: 3,
          column: 16,
        },
      ],
    },
    // interface + function together — interface reported
    {
      code: `
        export interface Props {}
        export default function Component(props: Props) { return null }
      `,
      filename: '/src/components/Component.tsx',
      errors: [
        {
          messageId: 'singleDeclaration',
          data: { name: 'Component' },
          line: 3,
          column: 24,
        },
      ],
    },
    // enum + type — second reported
    {
      code: `
        export enum Direction { Up, Down }
        export type Point = { x: number; y: number }
      `,
      filename: '/src/models/geo.ts',
      errors: [
        {
          messageId: 'singleDeclaration',
          data: { name: 'Point' },
          line: 3,
          column: 16,
        },
      ],
    },
    // A non-exported reserved name remains a primary unit.
    {
      code: `const metadata = {}\nfunction Page() {}`,
      filename: APP_PAGE,
      errors: [
        {
          messageId: 'singleDeclaration',
          data: { name: 'Page' },
          line: 2,
          column: 1,
        },
      ],
    },
    // Route methods are exempt only when they are exported.
    {
      code: `function GET() {}\nexport function helper() {}`,
      filename: USERS_ROUTE,
      errors: [
        {
          messageId: 'singleDeclaration',
          data: { name: 'helper' },
          line: 2,
          column: 8,
        },
      ],
    },
    // The function-only route exemption must not consume classes with method names.
    {
      code: `export class GET {}\nexport class Handler {}`,
      filename: USERS_ROUTE,
      errors: [
        {
          messageId: 'singleDeclaration',
          data: { name: 'Handler' },
          line: 2,
          column: 8,
        },
      ],
    },
    // HTTP method names outside route files remain ordinary declarations.
    {
      code: `export function GET() {}\nexport function helper() {}`,
      filename: '/src/http/handlers.ts',
      errors: [
        {
          messageId: 'singleDeclaration',
          data: { name: 'helper' },
          line: 2,
          column: 8,
        },
      ],
    },
    // Every variable declaration is a primary unit.
    {
      code: `const first = 1\nconst second = 2`,
      filename: '/src/constants.ts',
      errors: [
        {
          messageId: 'singleDeclaration',
          data: { name: 'second' },
          line: 2,
          column: 1,
        },
      ],
    },
    // Destructured declarations use the explicit fallback diagnostic name.
    {
      code: `const first = 1\nconst { value } = source`,
      filename: '/src/constants.ts',
      errors: [
        {
          messageId: 'singleDeclaration',
          data: { name: 'unknown' },
          line: 2,
          column: 1,
        },
      ],
    },
    // Exported variables are skipped only when their name is reserved.
    {
      code: `export const widget = 1\nexport function Page() {}`,
      filename: APP_PAGE,
      errors: [
        {
          messageId: 'singleDeclaration',
          data: { name: 'Page' },
          line: 2,
          column: 8,
        },
      ],
    },
    // Anonymous default declarations exercise the explicit fallback name.
    {
      code: `export function One() {}\nexport default function () {}`,
      filename: '/src/components/anonymous.ts',
      errors: [
        {
          messageId: 'singleDeclaration',
          data: { name: 'default' },
          line: 2,
          column: 16,
        },
      ],
    },
  ],
})
