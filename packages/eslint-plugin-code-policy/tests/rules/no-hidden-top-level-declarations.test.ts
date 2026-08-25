import rule from '@/rules/no-hidden-top-level-declarations.js'
import { runRuleTest } from '@tests/rule-testers/runRuleTest.js'

runRuleTest('no-hidden-top-level-declarations', rule, {
  valid: [
    // Exported declarations are allowed.
    {
      code: `export const value = 1`,
    },
    {
      code: `export function fn() {}`,
    },
    // Config/typing files are exempt.
    {
      code: `const internal = 1`,
      filename: '/app/vite.config.ts',
    },
    {
      code: `type Internal = { a: number }`,
      filename: '/types/foo.d.ts',
    },
    // Vue SFCs: `<script setup>` bindings are reactive state, never exported.
    {
      code: `
        const props = defineProps()
        const emit = defineEmits()
        const selected = ref(null)
        function handleClick() {}
      `,
      filename: '/components/FilterButton.vue',
    },
    // Declared first, exported through a specifier list further down.
    {
      code: `
        function helper() {}
        export { helper }
      `,
    },
    // Declared first, then sent out as the default export.
    {
      code: `
        function Component() {}
        export default Component
      `,
    },
    // The same, wrapped in a HOC - the identifier is still what is exported.
    {
      code: `
        function Component() {}
        export default memo(Component)
      `,
    },
    // Nested wrappers unwrap all the way down to the identifier.
    {
      code: `
        function Component() {}
        export default memo(forwardRef(Component))
      `,
    },
    // dependency-cruiser loads CommonJS config only and the shared factory is
    // TypeScript, so every adopting repo reaches it through a jiti
    // destructuring at module scope. The file's shape is the tool's, not the
    // author's.
    {
      code: `const { createJiti } = require('jiti')\nconst jiti = createJiti(__filename)\nmodule.exports = jiti('x')`,
      filename: '/repo/.dependency-cruiser.cjs',
    },
  ],
  invalid: [
    {
      code: `const hidden = 1`,
      errors: [{ messageId: 'hiddenDeclaration' }],
    },
    {
      code: `function helper() {}`,
      errors: [{ messageId: 'hiddenDeclaration' }],
    },
    {
      code: `interface Internal {}`,
      errors: [{ messageId: 'hiddenDeclaration' }],
    },
    // Destructuring hides names just as effectively as a plain identifier.
    {
      code: `const { a, b } = source`,
      errors: [
        { messageId: 'hiddenDeclaration' },
        { messageId: 'hiddenDeclaration' },
      ],
    },
    {
      code: `const { a, ...rest } = source`,
      errors: [
        { messageId: 'hiddenDeclaration' },
        { messageId: 'hiddenDeclaration' },
      ],
    },
    {
      code: `const [first, ...others] = source`,
      errors: [
        { messageId: 'hiddenDeclaration' },
        { messageId: 'hiddenDeclaration' },
      ],
    },
    // A wrapper call that does not resolve to a single identifier exports
    // nothing by name, so the declaration above it is still hidden.
    {
      code: `
        function Component() {}
        export default memo(Component, areEqual)
      `,
      errors: [{ messageId: 'hiddenDeclaration' }],
    },
  ],
})
