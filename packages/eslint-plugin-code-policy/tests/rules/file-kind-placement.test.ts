/* eslint-disable max-lines -- Keep one rule's mutation boundary matrix in its RuleTester suite. */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import rule from '@/rules/file-kind-placement.js'
import { runRuleTest } from '@tests/rule-testers/runRuleTest.js'
import { describe, expect, it } from 'vitest'

describe('file-kind-placement metadata', () => {
  it('declares the exact rule contract', () => {
    expect(rule.name).toBe('file-kind-placement')
    expect(Reflect.get(rule, 'defaultOptions')).toEqual([{}])
    expect(rule.meta).toEqual({
      type: 'problem',
      docs: {
        description:
          'Enforce that atomic units are placed within their corresponding feature-local semantic folders.',
        url: 'https://github.com/VibraComet/eslint-plugin-code-policy/blob/main/packages/eslint-plugin-code-policy/docs/rules/file-kind-placement.md',
      },
      schema: [
        {
          type: 'object',
          properties: {
            allowGenericFolders: { type: 'boolean' },
            allowColocation: { type: 'boolean' },
          },
          additionalProperties: false,
        },
      ],
      messages: {
        invalidPlacement:
          'The file "{{basename}}" appears to be a {{kind}}, but it is not located in a "{{expectedFolder}}/" folder. Please respect placement boundaries.',
        invalidGenericFolder:
          'Generic grouping folders like "utils" or "helpers" are forbidden. Use semantic folders (e.g., formatters, validators, mappers, extractors), or enable the "allowGenericFolders" option.',
      },
    })
  })
})

// Colocation detection reads the real directory of the linted file, so these
// cases point at on-disk fixtures under fixtures/colocation/.
//
// They sit at the package root rather than under tests/, because the rule now
// exempts anything under a `tests/` path component as test scope - which is
// right for a consumer and would have made every fixture below silently
// exempt, passing these cases for the wrong reason.
const fixtures = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures')
const USE_THING_FILENAME = 'useThing.ts'
const HOOK_KIND = 'hook or composable'
const colocation = (...segments: string[]) =>
  join(fixtures, 'colocation', ...segments)
const placementError = (
  basename: string,
  kind: string,
  expectedFolder: string,
) => ({
  messageId: 'invalidPlacement' as const,
  data: { basename, kind, expectedFolder },
  line: 1,
  column: 1,
})
const genericFolderError = {
  messageId: 'invalidGenericFolder' as const,
  line: 1,
  column: 1,
}

runRuleTest('file-kind-placement', rule, {
  assertionOptions: {
    requireData: true,
  },
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
      filename: '/src/useThing.config.ts',
    },
    {
      code: `export function useThing() {}`,
      filename: '/src/useThing.config.js',
    },
    {
      code: `export function useThing() {}`,
      filename: '/src/useThing.config.mjs',
    },
    {
      code: `export function useThing() {}`,
      filename: '/src/useThing.config.cjs',
    },
    {
      code: `export function useThing() {}`,
      filename: '/src/useThing.d.ts',
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
    // The second supported generic ancestor has its own option boundary.
    {
      code: `export function doThing() {}`,
      filename: '/src/helpers/doThing.ts',
      options: [{ allowGenericFolders: true }],
    },
    // A path without a parent directory is outside placement analysis.
    {
      code: `export function useThing() {}`,
      filename: USE_THING_FILENAME,
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
    // A test is named after the unit it covers. Reading that name as a kind
    // demands the test move into `selectors/`, away from the code it tests.
    // Found in consumer-i, whose tests/plans/selectSpacePlans.test.ts began
    // reporting once eslint-config 0.7.0 gave test files real rules.
    {
      code: `export function selectSpacePlans() {}`,
      filename: '/tests/plans/selectSpacePlans.test.ts',
    },
    {
      code: `export function mapOrder() {}`,
      filename: '/src/services/mapOrder.spec.tsx',
    },
    {
      code: `export function formatDate() {}`,
      filename: '/src/__tests__/formatDate.ts',
    },
  ],
  invalid: [
    // `use*` outside any accepted folder.
    {
      code: `export function useThing() {}`,
      filename: '/src/widgets/useThing.ts',
      errors: [placementError(USE_THING_FILENAME, HOOK_KIND, 'hooks')],
    },
    // Formatter outside formatters/.
    {
      code: `export function formatDate() {}`,
      filename: '/src/widgets/formatDate.ts',
      errors: [placementError('formatDate.ts', 'formatter', 'formatters')],
    },
    // Genuine mapper (camelCase boundary) outside mappers/ still flags, even
    // though `mapping.ts` (no boundary) is now valid.
    {
      code: `export function mapEntry() {}`,
      filename: '/src/services/mapEntry.ts',
      errors: [placementError('mapEntry.ts', 'mapper', 'mappers')],
    },
    // Suffix detection is extension-agnostic: the `.tsx` twin of a `Mapper.ts`
    // used to escape placement entirely, which in a React codebase is where
    // mappers and formatters actually get written.
    {
      code: `export function orderMapper() {}`,
      filename: '/src/services/orderMapper.tsx',
      errors: [placementError('orderMapper.tsx', 'mapper', 'mappers')],
    },
    {
      code: `export function priceFormatter() {}`,
      filename: '/src/services/priceFormatter.jsx',
      errors: [placementError('priceFormatter.jsx', 'formatter', 'formatters')],
    },
    {
      code: `export function inputValidator() {}`,
      filename: '/src/services/inputValidator.mts',
      errors: [placementError('inputValidator.mts', 'validator', 'validators')],
    },
    // The component exemption is PascalCase-and-JSX only: a PascalCase `.ts`
    // file carries no JSX and is still a placement-checked unit.
    {
      code: `export function UserMapper() {}`,
      filename: '/src/services/UserMapper.ts',
      errors: [placementError('UserMapper.ts', 'mapper', 'mappers')],
    },
    // Generic grouping folders are banned by default.
    {
      code: `export function doThing() {}`,
      filename: '/src/utils/doThing.ts',
      errors: [genericFolderError],
    },
    // `_`-private generic folder is banned by default too.
    {
      code: `export function doThing() {}`,
      filename: '/src/app/_utils/doThing.ts',
      errors: [genericFolderError],
    },
    // Helpers are banned by the same default parent-folder boundary as utils.
    {
      code: `export function doThing() {}`,
      filename: '/src/helpers/doThing.ts',
      errors: [genericFolderError],
    },
    // Generic-folder permission does not exempt unrelated directories.
    {
      code: `export function useThing() {}`,
      filename: '/src/widgets/useThing.ts',
      options: [{ allowGenericFolders: true }],
      errors: [placementError(USE_THING_FILENAME, HOOK_KIND, 'hooks')],
    },
    // Two path parts are sufficient to apply placement analysis.
    {
      code: `export function useThing() {}`,
      filename: '/useThing.ts',
      errors: [placementError(USE_THING_FILENAME, HOOK_KIND, 'hooks')],
    },
    // Windows separators are normalized before folder and basename checks.
    {
      code: `export function useThing() {}`,
      filename: 'C:\\src\\widgets\\useThing.ts',
      errors: [placementError(USE_THING_FILENAME, HOOK_KIND, 'hooks')],
    },
    // allowColocation: an orphaned hook with no anchor in its folder still flags.
    {
      code: `export function useOrphan() {}`,
      filename: colocation('orphan', 'useOrphan.ts'),
      options: [{ allowColocation: true }],
      errors: [placementError('useOrphan.ts', HOOK_KIND, 'hooks')],
    },
    // Without allowColocation, a colocated hook is still flagged (strict default
    // is preserved): the WithComponent fixture has an anchor but the option off.
    {
      code: `export function useWithComponent() {}`,
      filename: colocation('WithComponent', 'useWithComponent.ts'),
      errors: [placementError('useWithComponent.ts', HOOK_KIND, 'hooks')],
    },
  ],
})
