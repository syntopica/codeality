import boundaries from 'eslint-plugin-boundaries'

/**
 * Layered import boundaries for frontend apps (Next.js App Router, Vite React,
 * Vite Vue, Astro with React islands).
 *
 * Intent:
 * - `components/**` stays UI-oriented: may import shared code, not service internals directly.
 * - `hooks`, `composables`, `types`, `utils`, `const`, `lib`, `store` are shared ownership layers.
 * - `services/**` holds integrations; may import shared utilities/types, not `components`.
 * - Root/shared code may call into `services` so hooks can orchestrate providers without
 *   leaking SDK details into TSX.
 *
 * @see docs/standards/typescript-frontend-architecture.md
 *
 * Migration note (eslint-plugin-boundaries v6):
 * - `mode: "full"` is required so patterns are matched against the full relative file path
 *   (e.g., "src/services/fetchGreeting.ts") rather than the accumulated path segments used
 *   by the default "folder" mode. In "folder" mode the effective pattern becomes
 *   `<pattern>/**\/*` which never fires for direct children of `src/<layer>/`.
 * - The rule was renamed from `boundaries/element-types` to `boundaries/dependencies` in v6.
 * - The rule `allow` syntax changed: `{ from: { type }, allow: { to: { type } } }` (object form).
 */
export const createFrontendBoundariesConfig = () => [
  {
    files: ['**/*.{js,jsx,ts,tsx,vue,mjs,cjs}'],
    plugins: { boundaries },
    settings: {
      // Ensure TypeScript path aliases (e.g. @/*) resolve correctly for all file
      // types including .vue and .astro, which are not covered by the base config's
      // import/resolver setting (that only applies to .ts/.tsx/.js etc.).
      'import/resolver': { typescript: true },
      'boundaries/elements': [
        // app layer
        { type: 'app', mode: 'full', pattern: ['app/**/*', 'src/app/**/*'] },
        // components layer
        {
          type: 'components',
          mode: 'full',
          pattern: ['components/**/*', 'src/components/**/*'],
        },
        // shared layer: hooks, composables, types, lib, utils, const, constants, store, stores
        {
          type: 'shared',
          mode: 'full',
          pattern: [
            'hooks/**/*',
            'src/hooks/**/*',
            'composables/**/*',
            'src/composables/**/*',
            'types/**/*',
            'src/types/**/*',
            'lib/**/*',
            'src/lib/**/*',
            'utils/**/*',
            'src/utils/**/*',
            'const/**/*',
            'src/const/**/*',
            'constants/**/*',
            'src/constants/**/*',
            'store/**/*',
            'src/store/**/*',
            'stores/**/*',
            'src/stores/**/*',
          ],
        },
        // services layer: services, actions
        {
          type: 'services',
          mode: 'full',
          pattern: [
            'services/**/*',
            'src/services/**/*',
            'actions/**/*',
            'src/actions/**/*',
          ],
        },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: { type: 'app' },
              allow: { to: { type: ['app', 'components', 'shared', 'services'] } },
            },
            {
              from: { type: 'components' },
              allow: { to: { type: ['components', 'shared'] } },
            },
            {
              from: { type: 'shared' },
              allow: { to: { type: ['shared', 'services'] } },
            },
            {
              from: { type: 'services' },
              allow: { to: { type: ['services', 'shared'] } },
            },
          ],
        },
      ],
    },
  },
]

export default createFrontendBoundariesConfig
