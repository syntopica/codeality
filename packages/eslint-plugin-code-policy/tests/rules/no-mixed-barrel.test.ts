import rule from '@/rules/no-mixed-barrel.js'
import { runRuleTest } from '@tests/rule-testers/runRuleTest.js'

// Reused by four cases that all describe the same barrel under test.
const DIAGNOSTICS_BARREL = '/src/diagnostics/index.ts'

runRuleTest('no-mixed-barrel', rule, {
  assertionOptions: {
    requireData: true,
  },
  valid: [
    // Pure barrel — only re-exports from other modules
    {
      code: `
        export type { UseDiagnosticsViewReturn } from './UseDiagnosticsViewReturn'
        export type { DiagnosticStats } from './DiagnosticStats'
      `,
      filename: DIAGNOSTICS_BARREL,
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
      filename: DIAGNOSTICS_BARREL,
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
      filename: DIAGNOSTICS_BARREL,
      errors: [
        {
          messageId: 'mixedBarrel',
          data: { kind: 'type' },
          line: 3,
          column: 9,
        },
      ],
    },
    // Mixed: export * + inline type
    {
      code: `
        export * from './foo'
        export type MyThing = { id: string }
      `,
      filename: '/src/features/index.ts',
      errors: [
        {
          messageId: 'mixedBarrel',
          data: { kind: 'type' },
          line: 3,
          column: 9,
        },
      ],
    },
    // Mixed: remote re-export + inline interface
    {
      code: `
        export { SomeComponent } from './SomeComponent'
        export interface SomeProps { value: string }
      `,
      filename: '/src/components/index.ts',
      errors: [
        {
          messageId: 'mixedBarrel',
          data: { kind: 'type' },
          line: 3,
          column: 9,
        },
      ],
    },
    // Mixed: remote re-export + multiple inline declarations — one error per declaration
    {
      code: `
        export type { UseDiagnosticsViewReturn } from './UseDiagnosticsViewReturn'
        export type DiagnosticStats = { totalEvents: number }
        export type DkimRecord = { selector: string }
      `,
      filename: DIAGNOSTICS_BARREL,
      errors: [
        {
          messageId: 'mixedBarrel',
          data: { kind: 'type' },
          line: 3,
          column: 9,
        },
        {
          messageId: 'mixedBarrel',
          data: { kind: 'type' },
          line: 4,
          column: 9,
        },
      ],
    },
    // Mixed: remote re-export + inline value export
    {
      code: `
        export { foo } from './foo'
        export const DEFAULT_TIMEOUT = 3000
      `,
      filename: '/src/index.ts',
      errors: [
        {
          messageId: 'mixedBarrel',
          data: { kind: 'value' },
          line: 3,
          column: 9,
        },
      ],
    },
    // index.tsx is a barrel suffix and default exports preserve their kind.
    {
      code: `export { Widget } from './Widget'\nexport default function Widget() { return null }`,
      filename: '/src/components/index.tsx',
      errors: [
        {
          messageId: 'mixedBarrel',
          data: { kind: 'default' },
          line: 2,
          column: 1,
        },
      ],
    },
    // index.js is also a barrel suffix and functions have a distinct kind.
    {
      code: `export * from './widget.js'\nexport function createWidget() {}`,
      filename: '/src/components/index.js',
      errors: [
        {
          messageId: 'mixedBarrel',
          data: { kind: 'function' },
          line: 2,
          column: 1,
        },
      ],
    },
    // Classes exercise the final named-declaration kind branch.
    {
      code: `export { Widget } from './Widget'\nexport class WidgetRegistry {}`,
      filename: '/src/components/index.ts',
      errors: [
        {
          messageId: 'mixedBarrel',
          data: { kind: 'class' },
          line: 2,
          column: 1,
        },
      ],
    },
  ],
})
