import rule from '@/rules/atomic-file.js'
import { runRuleTest } from '@tests/rule-testers/runRuleTest.js'
import { describe, expect, it } from 'vitest'

describe('atomic-file metadata', () => {
  it('declares the exact deprecation contract', () => {
    expect(rule.name).toBe('atomic-file')
    expect(Reflect.get(rule, 'defaultOptions')).toEqual([])
    expect(rule.meta).toEqual({
      type: 'problem',
      docs: {
        description:
          'Enforce atomic file structure (exactly one top-level unit per file)',
        url: 'https://github.com/VibraComet/eslint-plugin-code-policy/blob/main/packages/eslint-plugin-code-policy/docs/rules/atomic-file.md',
      },
      deprecated: true,
      replacedBy: [
        'code-policy/one-primary-unit',
        'code-policy/no-hidden-top-level-declarations',
      ],
      schema: [],
      messages: {
        multipleDeclarations:
          'File contains multiple top-level declarations (found {{count}}). Extract them into separate files to enforce atomic file structure.',
      },
    })
  })
})

runRuleTest('atomic-file', rule, {
  valid: [
    {
      code: 'export default function SingleExport() {}',
    },
    {
      code: 'const x = 1;',
    },
    {
      code: 'export interface Foo {}',
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
    {
      code: ';\nexport default function SingleExport() {}',
    },
    {
      code: 'export function One() {}\nexport function Two() {}',
      filename: '/src/index.ts',
    },
    {
      code: `
      import { A } from 'a'
      export * from 'b'
      export { A }
      ;
      import Legacy = require('legacy')
      export default function SingleExport() {}
      `,
      filename: '/src/SingleExport.ts',
    },
    {
      code: `
      export async function GET() {}
      export async function POST() {}
      export default function Handler() {}
      `,
      filename: '/app/route.ts',
    },
    {
      code: "'use client'\nexport default function Widget() {}",
      filename: '/components/Widget.tsx',
    },
    {
      code: "const value = 1\n'still a string'",
      filename: '/src/value.ts',
    },
    {
      code: 'function Component() {}\nexport default Component',
      filename: '/components/Reference.tsx',
    },
    {
      code: 'function Component() {}\nexport default memo(Component)',
      filename: '/components/Memoized.tsx',
    },
  ],
  invalid: [
    {
      code: `
      export function One() {}
      export function Two() {}
      `,
      errors: [{ messageId: 'multipleDeclarations', line: 3, column: 7 }],
    },
    {
      code: `
      export interface Props {}
      export default function Component(props: Props) {}
      `,
      errors: [{ messageId: 'multipleDeclarations', line: 3, column: 7 }],
    },
    {
      code: `
      export const x = 1, y = 2
      `,
      errors: [{ messageId: 'multipleDeclarations', line: 2, column: 7 }],
    },
    {
      code: 'const x = 1, y = 2',
      errors: [{ messageId: 'multipleDeclarations', line: 1, column: 1 }],
    },
    {
      code: `
      class User {}
      function util() {}
      `,
      errors: [{ messageId: 'multipleDeclarations', line: 3, column: 7 }],
    },
    {
      code: 'export const metadata = {}\nexport default function Page() {}',
      filename: '/app/page.tsx.backup',
      errors: [{ messageId: 'multipleDeclarations', line: 2, column: 1 }],
    },
    {
      code: 'export const metadata = {}\nexport default function Handler() {}',
      filename: '/app/route.ts.backup',
      errors: [{ messageId: 'multipleDeclarations', line: 2, column: 1 }],
    },
    {
      code: 'export const metadata = {}\nexport default function Middleware() {}',
      filename: '/middleware.ts.backup',
      errors: [{ messageId: 'multipleDeclarations', line: 2, column: 1 }],
    },
    {
      code: 'export const metadata = {}\nexport default function Proxy() {}',
      filename: '/proxy.ts.backup',
      errors: [{ messageId: 'multipleDeclarations', line: 2, column: 1 }],
    },
    {
      code: 'export function helper() {}\nexport default function Handler() {}',
      filename: '/app/route.ts',
      errors: [{ messageId: 'multipleDeclarations', line: 2, column: 1 }],
    },
    {
      code: 'function Handler() {}\nexport default function GET() {}',
      filename: '/app/route.ts',
      errors: [{ messageId: 'multipleDeclarations', line: 2, column: 1 }],
    },
    {
      code: 'export const metadata = {}, helper = 1\nexport default function Page() {}',
      filename: '/app/page.tsx',
      errors: [
        { messageId: 'multipleDeclarations', line: 1, column: 1 },
        { messageId: 'multipleDeclarations', line: 2, column: 1 },
      ],
    },
    {
      code: 'export const { metadata } = source\nexport default function Page() {}',
      filename: '/app/page.tsx',
      errors: [{ messageId: 'multipleDeclarations', line: 2, column: 1 }],
    },
    {
      code: 'export const metadata = {}\nexport default function Feature() {}',
      filename: '/src/feature.ts',
      errors: [{ messageId: 'multipleDeclarations', line: 2, column: 1 }],
    },
    {
      code: 'const value = 1\n42',
      filename: '/src/value.ts',
      errors: [{ messageId: 'multipleDeclarations', line: 2, column: 1 }],
    },
    {
      code: 'function Component() {}\nexport default memo()',
      filename: '/components/NoArguments.tsx',
      errors: [{ messageId: 'multipleDeclarations', line: 2, column: 1 }],
    },
    {
      code: 'function Component() {}\nexport default memo(Component, compare)',
      filename: '/components/TwoArguments.tsx',
      errors: [{ messageId: 'multipleDeclarations', line: 2, column: 1 }],
    },
    {
      code: 'function Component() {}\nexport default memo(() => null)',
      filename: '/components/ExpressionArgument.tsx',
      errors: [{ messageId: 'multipleDeclarations', line: 2, column: 1 }],
    },
  ],
})
