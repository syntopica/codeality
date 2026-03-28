import rule from '../../src/rules/view-logic-separation.js'
import { ruleTester } from '../utils/ruleTester.js'

/**
 * view-logic-separation:
 * - Only fires on .tsx files
 * - Reports named inline functions/handlers inside top-level components
 * - Reports specific React hooks (useState, useEffect, etc.) inside components
 * - Does NOT fire on .ts files or bare arrow expressions in JSX props
 */

ruleTester.run('view-logic-separation', rule as any, {
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
      errors: [{ messageId: 'noReactHooks', data: { name: 'useState', componentName: 'Counter' } }],
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
        { messageId: 'noReactHooks', data: { name: 'useEffect', componentName: 'Tracker' } },
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
      filename: '/src/components/Form.tsx',
      errors: [{ messageId: 'noInlineHandlers', data: { name: 'handleSubmit' } }],
    },
  ],
})
