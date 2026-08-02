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
 * Migration note (eslint-plugin-boundaries v7):
 * - Element patterns are folder prefixes with `partialMatch: false` (anchored at the
 *   project root); this replaces v6's `mode: "full"` + `<pattern>/**\/*` full-path globs.
 * - The per-rule option is `policies` (renamed from `rules` in v7).
 * - Selectors use the entity model: `{ from: { element: { types } } }` and
 *   `{ allow: { to: { element: { types: { anyOf } } } } }`.
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
        { type: 'app', pattern: ['app', 'src/app'], partialMatch: false },
        // components layer
        {
          type: 'components',
          pattern: ['components', 'src/components'],
          partialMatch: false,
        },
        // shared layer: hooks, composables, types, lib, utils, const, constants, store, stores
        {
          type: 'shared',
          pattern: [
            'hooks',
            'src/hooks',
            'composables',
            'src/composables',
            'types',
            'src/types',
            'lib',
            'src/lib',
            'utils',
            'src/utils',
            'const',
            'src/const',
            'constants',
            'src/constants',
            'store',
            'src/store',
            'stores',
            'src/stores',
          ],
          partialMatch: false,
        },
        // services layer: services, actions
        {
          type: 'services',
          pattern: ['services', 'src/services', 'actions', 'src/actions'],
          partialMatch: false,
        },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: Object.entries({
            app: ['app', 'components', 'shared', 'services'],
            components: ['components', 'shared'],
            shared: ['shared', 'services'],
            services: ['services', 'shared'],
          }).map(([from, to]) => ({
            from: { element: { types: from } },
            allow: { to: { element: { types: { anyOf: to } } } },
          })),
        },
      ],
    },
  },
]
