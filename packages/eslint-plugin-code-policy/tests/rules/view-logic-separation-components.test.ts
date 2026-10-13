import rule from '@/rules/view-logic-separation.js'
import { runRuleTest } from '@tests/rule-testers/runRuleTest.js'

// Which functions count as views: custom hooks are not, and components wrapped
// in memo or forwardRef are.
const COUNTER_FILE = '/src/components/Counter.tsx'
const THING_FILE = '/src/components/Thing.tsx'

runRuleTest('view-logic-separation component detection', rule, {
  assertionOptions: {
    requireData: true,
  },
  valid: [
    {
      code: `
        export function useThing() {
          const [value, setValue] = useState(0)
          const reset = () => setValue(0)
          return { value, reset }
        }
      `,
      filename: THING_FILE,
    },
    {
      code: `export const useThing = () => React.useState(0)`,
      filename: THING_FILE,
    },
  ],
  invalid: [
    {
      code: `export function Counter() {
  const [count] = React.useState(0)
  return <div>{count}</div>
}`,
      filename: COUNTER_FILE,
      errors: [
        {
          messageId: 'noReactHooks',
          data: { name: 'useState', componentName: 'Counter' },
          line: 2,
          column: 19,
        },
      ],
    },
    {
      code: `export const Counter = memo(() => {
  const [count] = useState(0)
  return <div>{count}</div>
})`,
      filename: COUNTER_FILE,
      errors: [
        {
          messageId: 'noReactHooks',
          data: { name: 'useState', componentName: 'Counter' },
          line: 2,
          column: 19,
        },
      ],
    },
    {
      code: `export default React.forwardRef(function Input(props, ref) {
  useEffect(() => {}, [])
  return <input ref={ref} />
})`,
      filename: '/src/components/Input.tsx',
      errors: [
        {
          messageId: 'noReactHooks',
          data: { name: 'useEffect', componentName: 'Input' },
          line: 2,
          column: 3,
        },
      ],
    },
  ],
})
