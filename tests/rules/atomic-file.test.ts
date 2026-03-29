import rule from '@/rules/atomic-file.js'
import { ruleTester } from '@tests/utils/rule-tester.js'

ruleTester.run('atomic-file', rule as any, {
  valid: [
    {
      code: `
      export default function SingleExport() {}
      `,
    },
    {
      code: `
      const x = 1;
      `,
    },
    {
      code: `
      export interface Foo {}
      `,
    },
    {
      code: `
      export const metadata = { title: "Title" };
      export default function Page() { return <div /> }
      `,
      filename: '/app/page.tsx',
    },
    {
      code: `
      import { A } from 'a'
      import { B } from 'b'
      export * from 'c'
      export { A, B }
      `,
      filename: '/index.ts',
    },
  ],
  invalid: [
    {
      code: `
      export function One() {}
      export function Two() {}
      `,
      errors: [{ messageId: 'multipleDeclarations' }],
    },
    {
      code: `
      export interface Props {}
      export default function Component(props: Props) {}
      `,
      errors: [{ messageId: 'multipleDeclarations' }],
    },
    {
      code: `
      export const x = 1, y = 2
      `,
      errors: [{ messageId: 'multipleDeclarations' }],
    },
    {
      code: `
      class User {}
      function util() {}
      `,
      errors: [{ messageId: 'multipleDeclarations' }],
    },
  ],
})
