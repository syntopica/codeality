import rule from '@/rules/file-kind-placement.js'
import { ruleTester } from '@tests/utils/rule-tester.js'

ruleTester.run('file-kind-placement', rule as any, {
  valid: [
    // React hook in hooks/.
    {
      code: `export function useThing() {}`,
      filename: '/src/hooks/useThing.ts',
    },
    // Vue composable in composables/.
    {
      code: `export function useProductosCatalog() {}`,
      filename: '/src/composables/useProductosCatalog.ts',
    },
    // Pinia store in stores/.
    {
      code: `export const useCartStore = defineStore('cart', () => {})`,
      filename: '/src/stores/useCartStore.ts',
    },
    // Store singular folder is also accepted.
    {
      code: `export const useServicesStore = defineStore('services', () => {})`,
      filename: '/src/store/useServicesStore.ts',
    },
    // Other kinds in their semantic folders.
    {
      code: `export function formatDate() {}`,
      filename: '/src/formatters/formatDate.ts',
    },
    {
      code: `export function validateEmail() {}`,
      filename: '/src/validators/validateEmail.ts',
    },
    // Config/typing files are exempt.
    {
      code: `export function useThing() {}`,
      filename: '/src/use.config.ts',
    },
  ],
  invalid: [
    // `use*` outside any accepted folder.
    {
      code: `export function useThing() {}`,
      filename: '/src/widgets/useThing.ts',
      errors: [{ messageId: 'invalidPlacement' }],
    },
    // Formatter outside formatters/.
    {
      code: `export function formatDate() {}`,
      filename: '/src/widgets/formatDate.ts',
      errors: [{ messageId: 'invalidPlacement' }],
    },
    // Generic grouping folders are banned.
    {
      code: `export function doThing() {}`,
      filename: '/src/utils/doThing.ts',
      errors: [{ messageId: 'invalidGenericFolder' }],
    },
  ],
})
