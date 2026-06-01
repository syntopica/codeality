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
    // Next.js private folder `_hooks/` is recognized as `hooks/`.
    {
      code: `export function useThing() {}`,
      filename: '/src/app/dashboard/_hooks/useThing.ts',
    },
    // allowGenericFolders: a pure helper directly in utils/ is accepted.
    {
      code: `export function doThing() {}`,
      filename: '/src/utils/doThing.ts',
      options: [{ allowGenericFolders: true }],
    },
    // allowGenericFolders: utils/<area>/ organization is accepted, even for a
    // unit that would otherwise be placement-checked (formatter).
    {
      code: `export function formatDate() {}`,
      filename: '/src/utils/dates/formatDate.ts',
      options: [{ allowGenericFolders: true }],
    },
    // allowGenericFolders is `_`-aware too: _utils/ counts as utils/.
    {
      code: `export function doThing() {}`,
      filename: '/src/app/_utils/doThing.ts',
      options: [{ allowGenericFolders: true }],
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
    // Generic grouping folders are banned by default.
    {
      code: `export function doThing() {}`,
      filename: '/src/utils/doThing.ts',
      errors: [{ messageId: 'invalidGenericFolder' }],
    },
    // `_`-private generic folder is banned by default too.
    {
      code: `export function doThing() {}`,
      filename: '/src/app/_utils/doThing.ts',
      errors: [{ messageId: 'invalidGenericFolder' }],
    },
  ],
})
