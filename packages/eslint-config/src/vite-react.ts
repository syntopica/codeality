import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

import { createFrontendBoundariesConfig } from './frontend-boundaries'
import { resolveReactVersion } from './react-version'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const react = require('eslint-plugin-react') as {
  configs: { flat: { recommended: unknown; 'jsx-runtime': unknown } }
}

export type ViteReactConfigOptions = {
  /**
   * React version handed to `eslint-plugin-react`. Defaults to the version of
   * the React installed beside the project, and only falls back to `'detect'`
   * when that cannot be resolved - see `resolveReactVersion`.
   */
  reactVersion?: string
}

export const createViteReactConfig = (options: ViteReactConfigOptions = {}) => [
  // Core React correctness rules + automatic JSX transform (React 17+)
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  // Unscoped on purpose: the two configs above carry no `files` key, so their
  // rules can run on any linted file and each one would otherwise re-enter
  // version detection.
  {
    settings: {
      react: {
        version: options.reactVersion ?? resolveReactVersion() ?? 'detect',
      },
    },
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // hooks rules
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // prevent {count && <Comp />} rendering "0" when count === 0
      'react/jsx-no-leaked-render': 'error',
      // avoid array index as list key (causes stale renders)
      'react/no-array-index-key': 'warn',
      // <MyComp></MyComp> → <MyComp /> (auto-fixable)
      'react/self-closing-comp': 'warn',
      // dangerouslySetInnerHTML opens XSS vectors
      'react/no-danger': 'error',
      // inline component definitions cause infinite re-mount loops
      'react/no-unstable-nested-components': 'error',
      // remove pointless <> wrappers
      'react/jsx-no-useless-fragment': ['warn', { allowExpressions: true }],
    },
  },
  // Same layered boundaries as Next.js (src/components, src/services, etc.)
  ...createFrontendBoundariesConfig(),
]
