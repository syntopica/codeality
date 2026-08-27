import rule from '@/rules/no-hidden-top-level-declarations.js'
import { runRuleTest } from '@tests/rule-testers/runRuleTest.js'
import { describe, expect, it } from 'vitest'

describe('no-hidden-top-level-declarations metadata', () => {
  it('declares the exact rule contract', () => {
    expect(rule.name).toBe('no-hidden-top-level-declarations')
    expect(Reflect.get(rule, 'defaultOptions')).toEqual([])
    expect(rule.meta).toEqual({
      type: 'problem',
      docs: {
        description:
          'Disallow non-exported top-level functions, classes, constants, interfaces, and type aliases.',
        url: 'https://github.com/VibraComet/eslint-plugin-code-policy/blob/main/packages/eslint-plugin-code-policy/docs/rules/no-hidden-top-level-declarations.md',
      },
      schema: [],
      messages: {
        hiddenDeclaration:
          'Top-level declaration "{{name}}" is not exported. The Primary Unit Rule forbids hidden internal helpers or types at the module scope.',
      },
    })
  })
})

const hiddenDeclarationError = (
  name: string,
  line: number,
  column: number,
) => ({
  messageId: 'hiddenDeclaration' as const,
  data: { name },
  line,
  column,
})

runRuleTest('no-hidden-top-level-declarations', rule, {
  assertionOptions: {
    requireData: true,
  },
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
    {
      code: `const internal = 1`,
      filename: '/app/vite.config.js',
    },
    {
      code: `const internal = 1`,
      filename: '/app/vite.config.mjs',
    },
    {
      code: `const internal = 1`,
      filename: '/app/vite.config.cjs',
    },
    {
      code: `const internal = 1`,
      filename: '/src/server/proxy.ts',
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
    // Anonymous default declarations are not call-expression wrappers.
    {
      code: `export default function () {}`,
    },
    // Variable declarations exported through a later specifier are visible.
    {
      code: `const value = 1\nexport { value }`,
    },
    // Unsupported named declaration kinds remain outside this rule's scope.
    {
      code: `namespace Helpers {}`,
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
      errors: [hiddenDeclarationError('hidden', 1, 7)],
    },
    {
      code: `function helper() {}`,
      errors: [hiddenDeclarationError('helper', 1, 1)],
    },
    {
      code: `interface Internal {}`,
      errors: [hiddenDeclarationError('Internal', 1, 1)],
    },
    {
      code: `class Internal {}`,
      errors: [hiddenDeclarationError('Internal', 1, 1)],
    },
    {
      code: `type Internal = string`,
      errors: [hiddenDeclarationError('Internal', 1, 1)],
    },
    {
      code: `enum Internal { Value }`,
      errors: [hiddenDeclarationError('Internal', 1, 1)],
    },
    // Destructuring hides names just as effectively as a plain identifier.
    {
      code: `const { a, b } = source`,
      errors: [
        hiddenDeclarationError('a', 1, 7),
        hiddenDeclarationError('b', 1, 7),
      ],
    },
    {
      code: `const { a, ...rest } = source`,
      errors: [
        hiddenDeclarationError('a', 1, 7),
        hiddenDeclarationError('rest', 1, 7),
      ],
    },
    {
      code: `const [first, ...others] = source`,
      errors: [
        hiddenDeclarationError('first', 1, 7),
        hiddenDeclarationError('others', 1, 7),
      ],
    },
    // A wrapper call that does not resolve to a single identifier exports
    // nothing by name, so the declaration above it is still hidden.
    {
      code: `
        function Component() {}
        export default memo(Component, areEqual)
      `,
      errors: [hiddenDeclarationError('Component', 2, 9)],
    },
    // A second outer argument stops nested wrapper unwrapping.
    {
      code: `
        function Component() {}
        export default memo(forwardRef(Component), areEqual)
      `,
      errors: [hiddenDeclarationError('Component', 2, 9)],
    },
  ],
})
