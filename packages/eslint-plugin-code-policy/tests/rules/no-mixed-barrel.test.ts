import rule from '@/rules/no-mixed-barrel.js'
import { ruleTester } from '@tests/utils/rule-tester.js'

ruleTester.run('no-mixed-barrel', rule as any, {
  valid: [
    // Pure barrel — only re-exports from other modules
    {
      code: `
        export type { UseDiagnosticsViewReturn } from './UseDiagnosticsViewReturn'
        export type { DiagnosticStats } from './DiagnosticStats'
      `,
      filename: '/src/diagnostics/index.ts',
    },
    // Pure barrel — export * from
    {
      code: `
        export * from './foo'
        export * from './bar'
      `,
      filename: '/src/features/index.ts',
    },
    // Pure declaration file named index.ts — no re-exports from other modules
    {
      code: `
        export type DiagnosticStats = {
          totalEvents: number
          failedEvents: number
        }
      `,
      filename: '/src/diagnostics/index.ts',
    },
    // Non-index file — rule does not apply
    {
      code: `
        export type { Foo } from './Foo'
        export type Bar = { value: string }
      `,
      filename: '/src/diagnostics/types.ts',
    },
    // Barrel with local specifier re-export only (no source) — not a remote re-export
    {
      code: `
        const x = 1
        export { x }
      `,
      filename: '/src/index.ts',
    },
  ],

  invalid: [
    // Mixed: remote re-export + inline type declaration
    {
      code: `
        export type { UseDiagnosticsViewReturn } from './UseDiagnosticsViewReturn'
        export type DiagnosticStats = {
          totalEvents: number
          failedEvents: number
        }
      `,
      filename: '/src/diagnostics/index.ts',
      errors: [{ messageId: 'mixedBarrel' }],
    },
    // Mixed: export * + inline type
    {
      code: `
        export * from './foo'
        export type MyThing = { id: string }
      `,
      filename: '/src/features/index.ts',
      errors: [{ messageId: 'mixedBarrel' }],
    },
    // Mixed: remote re-export + inline interface
    {
      code: `
        export { SomeComponent } from './SomeComponent'
        export interface SomeProps { value: string }
      `,
      filename: '/src/components/index.ts',
      errors: [{ messageId: 'mixedBarrel' }],
    },
    // Mixed: remote re-export + multiple inline declarations — one error per declaration
    {
      code: `
        export type { UseDiagnosticsViewReturn } from './UseDiagnosticsViewReturn'
        export type DiagnosticStats = { totalEvents: number }
        export type DkimRecord = { selector: string }
      `,
      filename: '/src/diagnostics/index.ts',
      errors: [{ messageId: 'mixedBarrel' }, { messageId: 'mixedBarrel' }],
    },
    // Mixed: remote re-export + inline value export
    {
      code: `
        export { foo } from './foo'
        export const DEFAULT_TIMEOUT = 3000
      `,
      filename: '/src/index.ts',
      errors: [{ messageId: 'mixedBarrel' }],
    },
  ],
})
