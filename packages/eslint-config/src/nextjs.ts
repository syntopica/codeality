import nextPlugin from '@next/eslint-plugin-next'
import reactHooks from 'eslint-plugin-react-hooks'
import { globalIgnores } from 'eslint/config'

import { createFrontendBoundariesConfig } from './frontend-boundaries'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const react = require('eslint-plugin-react') as {
  configs: { flat: { recommended: unknown; 'jsx-runtime': unknown } }
}

export type NextjsConfigOptions = {
  tsconfigRootDir?: string
}

// This preset registers @next/next, react and react-hooks itself and pulls only
// Next's Core Web Vitals *rules* from @next/eslint-plugin-next. It does NOT spread
// the full `eslint-config-next` flat config, because that package also registers
// `import`, `jsx-a11y` and `@typescript-eslint` — plugins the layered baseline
// (base + accessibility) already owns — which throws "Cannot redefine plugin".
// `eslint-config-next` is kept as an optional peer dependency so standalone Next
// projects that do not layer the full baseline can import it directly.
const nextRules = {
  ...nextPlugin.configs['core-web-vitals'].rules,
}

export const createNextjsConfig = (_options: NextjsConfigOptions = {}) => {
  return [
    globalIgnores([
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'coverage/**',
      'next-env.d.ts',
    ]),

    // Core React correctness rules + automatic JSX transform (React 17+)
    react.configs.flat.recommended,
    react.configs.flat['jsx-runtime'],

    {
      files: ['**/*.{js,jsx,ts,tsx}'],
      plugins: {
        '@next/next': nextPlugin,
        'react-hooks': reactHooks,
      },
      settings: {
        react: { version: 'detect' },
      },
      rules: {
        ...nextRules,
        ...reactHooks.configs.recommended.rules,

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
    ...createFrontendBoundariesConfig(),
  ]
}

export default createNextjsConfig
