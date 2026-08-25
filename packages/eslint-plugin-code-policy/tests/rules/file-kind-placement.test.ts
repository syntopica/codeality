import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import rule from '@/rules/file-kind-placement.js'
import { runRuleTest } from '@tests/rule-testers/runRuleTest.js'

// Colocation detection reads the real directory of the linted file, so these
// cases point at on-disk fixtures under tests/fixtures/colocation/.
const fixtures = join(dirname(fileURLToPath(import.meta.url)), '../fixtures')
const colocation = (...segments: string[]) =>
  join(fixtures, 'colocation', ...segments)

runRuleTest('file-kind-placement', rule, {
  valid: [
    // allowColocation: a hook next to its component (PascalCase .tsx anchor).
    {
      code: `export function useWithComponent() {}`,
      filename: colocation('WithComponent', 'useWithComponent.ts'),
      options: [{ allowColocation: true }],
    },
    // allowColocation: a mapper next to a neighbouring non-kind consumer.
    {
      code: `export function mapThing() {}`,
      filename: colocation('withService', 'mapThing.ts'),
      options: [{ allowColocation: true }],
    },
    // allowColocation: a hook next to a public-API barrel (index.ts anchor).
    {
      code: `export function useBarrelled() {}`,
      filename: colocation('withBarrel', 'useBarrelled.ts'),
      options: [{ allowColocation: true }],
    },
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
    // A kind prefix must form a camelCase word boundary (uppercase next char),
    // so `user*`/`users*` are NOT hooks, `mapping*` is NOT a mapper, etc.
    {
      code: `export const userCache = new Map()`,
      filename: '/src/services/cache/userCache.ts',
    },
    {
      code: `export function usersScope() {}`,
      filename: '/src/services/users/usersScope.ts',
    },
    {
      code: `export const userLockTtlMs = 5000`,
      filename: '/src/services/users/constants/userLockTtlMs.ts',
    },
    {
      code: `export const mapping = {}`,
      filename: '/src/services/mapping.ts',
    },
    {
      code: `export const selected = true`,
      filename: '/src/state/selected.ts',
    },
    {
      code: `export const validated = true`,
      filename: '/src/state/validated.ts',
    },
    {
      code: `export const formatted = ''`,
      filename: '/src/state/formatted.ts',
    },
    // Extension stripping does not invent kinds: the correctly placed `.tsx`
    // twin is as valid as the `.ts` one.
    {
      code: `export function orderMapper() {}`,
      filename: '/src/mappers/orderMapper.tsx',
    },
    // A PascalCase .tsx/.jsx file is a React component, even when its name
    // ends in a kind word. Measured across 22 adopting repos: every file
    // matching a kind suffix on a .tsx extension was one of these, so
    // detecting them flagged 45 components that belong exactly where they are.
    {
      code: `export function MarketSelector() { return null }`,
      filename: '/src/components/MarketSelector.tsx',
    },
    {
      code: `export function DateRangeFormatter() { return null }`,
      filename: '/src/components/DateRangeFormatter.jsx',
    },
    {
      code: `export function ContentTypeSelector() { return null }`,
      filename: '/src/components/ContentTypeSelector/ContentTypeSelector.tsx',
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
    // Genuine mapper (camelCase boundary) outside mappers/ still flags, even
    // though `mapping.ts` (no boundary) is now valid.
    {
      code: `export function mapEntry() {}`,
      filename: '/src/services/mapEntry.ts',
      errors: [{ messageId: 'invalidPlacement' }],
    },
    // Suffix detection is extension-agnostic: the `.tsx` twin of a `Mapper.ts`
    // used to escape placement entirely, which in a React codebase is where
    // mappers and formatters actually get written.
    {
      code: `export function orderMapper() {}`,
      filename: '/src/services/orderMapper.tsx',
      errors: [{ messageId: 'invalidPlacement' }],
    },
    {
      code: `export function priceFormatter() {}`,
      filename: '/src/services/priceFormatter.jsx',
      errors: [{ messageId: 'invalidPlacement' }],
    },
    {
      code: `export function inputValidator() {}`,
      filename: '/src/services/inputValidator.mts',
      errors: [{ messageId: 'invalidPlacement' }],
    },
    // The component exemption is PascalCase-and-JSX only: a PascalCase `.ts`
    // file carries no JSX and is still a placement-checked unit.
    {
      code: `export function UserMapper() {}`,
      filename: '/src/services/UserMapper.ts',
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
    // allowColocation: an orphaned hook with no anchor in its folder still flags.
    {
      code: `export function useOrphan() {}`,
      filename: colocation('orphan', 'useOrphan.ts'),
      options: [{ allowColocation: true }],
      errors: [{ messageId: 'invalidPlacement' }],
    },
    // Without allowColocation, a colocated hook is still flagged (strict default
    // is preserved): the WithComponent fixture has an anchor but the option off.
    {
      code: `export function useWithComponent() {}`,
      filename: colocation('WithComponent', 'useWithComponent.ts'),
      errors: [{ messageId: 'invalidPlacement' }],
    },
  ],
})
