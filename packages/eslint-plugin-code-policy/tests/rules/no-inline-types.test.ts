import rule from '@/rules/no-inline-types.js'
import { ruleTester } from '@tests/utils/rule-tester.js'

/**
 * no-inline-types: enforces one top-level declaration per file
 * (analogous to atomic-file but focused on types/interfaces/classes/enums)
 * Exemptions: .d.ts files; route.ts HTTP methods; Next.js reserved exports
 */

ruleTester.run('no-inline-types', rule as any, {
  valid: [
    // single function — OK
    {
      code: `export default function Page() { return null }`,
      filename: '/src/app/page.tsx',
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
      filename: '/src/app/api/users/route.ts',
    },
    // Next.js page-level metadata + default export — OK
    {
      code: `
        export const metadata = { title: 'Title' }
        export default function Page() { return null }
      `,
      filename: '/src/app/page.tsx',
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
      errors: [{ messageId: 'singleDeclaration', data: { name: 'Two' } }],
    },
    // interface + function together — interface reported
    {
      code: `
        export interface Props {}
        export default function Component(props: Props) { return null }
      `,
      filename: '/src/components/Component.tsx',
      errors: [{ messageId: 'singleDeclaration', data: { name: 'Component' } }],
    },
    // enum + type — second reported
    {
      code: `
        export enum Direction { Up, Down }
        export type Point = { x: number; y: number }
      `,
      filename: '/src/models/geo.ts',
      errors: [{ messageId: 'singleDeclaration', data: { name: 'Point' } }],
    },
  ],
})
