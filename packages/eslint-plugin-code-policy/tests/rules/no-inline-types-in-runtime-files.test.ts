import rule from '@/rules/no-inline-types-in-runtime-files.js'
import { ruleTester } from '@tests/utils/rule-tester.js'

ruleTester.run('no-inline-types-in-runtime-files', rule as any, {
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
  ],
})
