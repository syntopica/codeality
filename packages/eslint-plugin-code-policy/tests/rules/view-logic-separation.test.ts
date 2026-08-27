import rule from '@/rules/view-logic-separation.js'
import { runRuleTest } from '@tests/rule-testers/runRuleTest.js'
import { describe, expect, it } from 'vitest'

const FORM_FILE = '/src/components/Form.tsx'

describe('view-logic-separation metadata', () => {
  it('declares the exact rule contract', () => {
    expect(rule.name).toBe('view-logic-separation')
    expect(Reflect.get(rule, 'defaultOptions')).toEqual([])
    expect(rule.meta).toEqual({
      type: 'problem',
      docs: {
        description:
          'Enforces strict separation of logic from views. React views (.tsx) must not contain state, lifecycle effects, or inline handler declarations. Move logic to a custom hook.',
        url: 'https://github.com/VibraComet/eslint-plugin-code-policy/blob/main/packages/eslint-plugin-code-policy/docs/rules/view-logic-separation.md',
      },
      schema: [],
      messages: {
        noReactHooks:
          'Strict View Separation: The hook "{{name}}" is forbidden in a view component. Extract your state/effects to a separate use{{componentName}} hook.',
        noInlineHandlers:
          'Strict View Separation: Inline function or handler declaration ({{name}}) inside a view component is forbidden. Return it from your custom hook instead.',
      },
    })
  })
})

/**
 * view-logic-separation:
 * - Only fires on .tsx files
 * - Reports named inline functions/handlers inside top-level components
 * - Reports specific React hooks (useState, useEffect, etc.) inside components
 * - Does NOT fire on .ts files or bare arrow expressions in JSX props
 */

runRuleTest('view-logic-separation', rule, {
  assertionOptions: {
    requireData: true,
  },
  valid: [
    // Hooks in a .ts file (custom hook) — ignored
    {
      code: `
        import { useState } from 'react'
        export function useCounter() {
          const [count, setCount] = useState(0)
          return { count, setCount }
        }
      `,
      filename: '/src/hooks/useCounter.ts',
    },
    // Pure render component with no hooks or named inline functions — OK
    {
      code: `
        export default function Badge({ label }: { label: string }) {
          return <span>{label}</span>
        }
      `,
      filename: '/src/components/Badge.tsx',
    },
    // useCustomHook (not in the allowlist) — not flagged
    {
      code: `
        export default function Widget() {
          useMyCustomHook()
          return <div />
        }
      `,
      filename: '/src/components/Widget.tsx',
    },
    // Built-in-looking names must match the complete identifier. Inline JSX
    // callbacks are expressions rather than named handlers.
    {
      code: `
        export default function Widget() {
          abuseState()
          useStateful()
          return <button onClick={() => null} />
        }
      `,
      filename: '/src/components/Widget.tsx',
    },
    // A hook call with no enclosing component remains outside the rule's scope.
    {
      code: `useState()`,
      filename: '/src/helpers/helper.tsx',
    },
  ],

  invalid: [
    // useState inside component — flagged
    {
      code: `
        import { useState } from 'react'
        export default function Counter() {
          const [count, setCount] = useState(0)
          return <div>{count}</div>
        }
      `,
      filename: '/src/components/Counter.tsx',
      errors: [
        {
          messageId: 'noReactHooks',
          data: { name: 'useState', componentName: 'Counter' },
          line: 4,
          column: 37,
        },
      ],
    },
    // useEffect inside component — flagged
    {
      code: `
        import { useEffect } from 'react'
        export default function Tracker() {
          useEffect(() => { console.log('mounted') }, [])
          return <div />
        }
      `,
      filename: '/src/components/Tracker.tsx',
      errors: [
        {
          messageId: 'noReactHooks',
          data: { name: 'useEffect', componentName: 'Tracker' },
          line: 4,
          column: 11,
        },
      ],
    },
    // Named inline handler inside component — flagged
    {
      code: `
        export default function Form() {
          const handleSubmit = () => { console.log('submit') }
          return <button onClick={handleSubmit}>Go</button>
        }
      `,
      filename: FORM_FILE,
      errors: [
        {
          messageId: 'noInlineHandlers',
          data: { name: 'handleSubmit' },
          line: 3,
          column: 32,
        },
      ],
    },
    // Function declarations exercise their own name and report-node branch.
    {
      code: `export default function Form() {
  function handleSubmit() {}
  return <button onClick={handleSubmit}>Go</button>
}`,
      filename: FORM_FILE,
      errors: [
        {
          messageId: 'noInlineHandlers',
          data: { name: 'handleSubmit' },
          line: 2,
          column: 3,
        },
      ],
    },
    // Function expressions use the variable declarator for the handler name.
    {
      code: `export default function Form() {
  const handleSubmit = function () {}
  return <button onClick={handleSubmit}>Go</button>
}`,
      filename: FORM_FILE,
      errors: [
        {
          messageId: 'noInlineHandlers',
          data: { name: 'handleSubmit' },
          line: 2,
          column: 24,
        },
      ],
    },
    // Non-identifier bindings preserve the explicit anonymous fallback.
    {
      code: `export default function Form() {
  const { handler } = function () {}
  return <button onClick={handler}>Go</button>
}`,
      filename: FORM_FILE,
      errors: [
        {
          messageId: 'noInlineHandlers',
          data: { name: 'anonymous function' },
          line: 2,
          column: 23,
        },
      ],
    },
  ],
})
