import rule from '@/rules/no-hidden-top-level-declarations.js'
import { ruleTester } from '@tests/utils/rule-tester.js'

ruleTester.run('no-hidden-top-level-declarations', rule as any, {
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
  ],
})
