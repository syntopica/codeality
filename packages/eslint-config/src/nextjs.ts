import nextPlugin from '@next/eslint-plugin-next'
import boundaries from 'eslint-plugin-boundaries'
import reactHooks from 'eslint-plugin-react-hooks'
import { globalIgnores } from 'eslint/config'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const react = require('eslint-plugin-react') as {
  configs: { flat: { recommended: unknown; 'jsx-runtime': unknown } }
}

export type NextjsConfigOptions = {
  tsconfigRootDir?: string
}

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
    {
      files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
      plugins: { boundaries },
      settings: {
        'boundaries/elements': [
          { type: 'app', pattern: 'app/*' },
          { type: 'app', pattern: 'app/**/*' },
          { type: 'components', pattern: 'components/*' },
          { type: 'components', pattern: 'components/**/*' },
          { type: 'shared', pattern: 'lib/*' },
          { type: 'shared', pattern: 'hooks/*' },
          { type: 'shared', pattern: 'types/*' },
          { type: 'shared', pattern: 'store/*' },
          { type: 'server', pattern: 'services/*' },
          { type: 'server', pattern: 'actions/*' },
        ],
      },
      rules: {
        'boundaries/element-types': [
          'error',
          {
            default: 'disallow',
            rules: [
              { from: ['app'], allow: ['components', 'shared', 'server'] },
              { from: ['components'], allow: ['components', 'shared'] },
              { from: ['shared'], allow: ['shared'] },
              { from: ['server'], allow: ['server', 'shared'] },
            ],
          },
        ],
      },
    },
  ]
}

export default createNextjsConfig
