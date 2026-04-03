import boundaries from 'eslint-plugin-boundaries'

/**
 * Layered import boundaries for frontend apps (Next.js App Router, Vite React).
 *
 * Intent:
 * - `components/**` stays UI-oriented: may import shared code, not service internals directly.
 * - `hooks`, `types`, `utils`, `const`, `lib`, `store` are shared ownership layers.
 * - `services/**` holds integrations; may import shared utilities/types, not `components`.
 * - Root/shared code may call into `services` so hooks can orchestrate providers without
 *   leaking SDK details into TSX.
 *
 * @see docs/standards/typescript-frontend-architecture.md
 */
export const createFrontendBoundariesConfig = () => [
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'app/*' },
        { type: 'app', pattern: 'app/**/*' },
        { type: 'app', pattern: 'src/app/*' },
        { type: 'app', pattern: 'src/app/**/*' },
        { type: 'components', pattern: 'components/*' },
        { type: 'components', pattern: 'components/**/*' },
        { type: 'components', pattern: 'src/components/*' },
        { type: 'components', pattern: 'src/components/**/*' },
        { type: 'shared', pattern: 'hooks/*' },
        { type: 'shared', pattern: 'hooks/**/*' },
        { type: 'shared', pattern: 'src/hooks/*' },
        { type: 'shared', pattern: 'src/hooks/**/*' },
        { type: 'shared', pattern: 'types/*' },
        { type: 'shared', pattern: 'types/**/*' },
        { type: 'shared', pattern: 'src/types/*' },
        { type: 'shared', pattern: 'src/types/**/*' },
        { type: 'shared', pattern: 'lib/*' },
        { type: 'shared', pattern: 'lib/**/*' },
        { type: 'shared', pattern: 'src/lib/*' },
        { type: 'shared', pattern: 'src/lib/**/*' },
        { type: 'shared', pattern: 'utils/*' },
        { type: 'shared', pattern: 'utils/**/*' },
        { type: 'shared', pattern: 'src/utils/*' },
        { type: 'shared', pattern: 'src/utils/**/*' },
        { type: 'shared', pattern: 'const/*' },
        { type: 'shared', pattern: 'const/**/*' },
        { type: 'shared', pattern: 'src/const/*' },
        { type: 'shared', pattern: 'src/const/**/*' },
        { type: 'shared', pattern: 'constants/*' },
        { type: 'shared', pattern: 'constants/**/*' },
        { type: 'shared', pattern: 'src/constants/*' },
        { type: 'shared', pattern: 'src/constants/**/*' },
        { type: 'shared', pattern: 'store/*' },
        { type: 'shared', pattern: 'store/**/*' },
        { type: 'shared', pattern: 'src/store/*' },
        { type: 'shared', pattern: 'src/store/**/*' },
        { type: 'services', pattern: 'services/*' },
        { type: 'services', pattern: 'services/**/*' },
        { type: 'services', pattern: 'src/services/*' },
        { type: 'services', pattern: 'src/services/**/*' },
        { type: 'services', pattern: 'actions/*' },
        { type: 'services', pattern: 'actions/**/*' },
        { type: 'services', pattern: 'src/actions/*' },
        { type: 'services', pattern: 'src/actions/**/*' },
      ],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: ['app'], allow: ['components', 'shared', 'services'] },
            { from: ['components'], allow: ['components', 'shared'] },
            { from: ['shared'], allow: ['shared', 'services'] },
            { from: ['services'], allow: ['services', 'shared'] },
          ],
        },
      ],
    },
  },
]

export default createFrontendBoundariesConfig
