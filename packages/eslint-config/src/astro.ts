import astroPlugin from 'eslint-plugin-astro'
import { globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

import { createFrontendBoundariesConfig } from './frontend-boundaries'

export type AstroConfigOptions = {
  tsconfigRootDir?: string
}

type FlatConfigLike = Record<string, unknown>
const astroConfigs = astroPlugin.configs as unknown as Record<
  string,
  FlatConfigLike[]
>
const astroRecommended = astroConfigs['flat/recommended'] ?? []
const astroA11yRecommended = astroConfigs['flat/jsx-a11y-recommended'] ?? []

export const createAstroConfig = (options: AstroConfigOptions = {}) => {
  const tsconfigRootDir = options.tsconfigRootDir ?? process.cwd()

  return [
    globalIgnores(['dist/**', '.astro/**', 'coverage/**']),
    ...astroRecommended,
    ...astroA11yRecommended,
    {
      files: ['**/*.astro'],
      languageOptions: {
        parserOptions: {
          parser: tseslint.parser,
          project: true,
          tsconfigRootDir,
          extraFileExtensions: ['.astro'],
        },
      },
    },
    {
      files: ['**/*.{ts,tsx}'],
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
      rules: {
        '@typescript-eslint/no-confusing-void-expression': 'off',
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/no-misused-promises': [
          'error',
          { checksVoidReturn: false },
        ],
      },
    },
    {
      files: ['**/*.d.ts'],
      rules: { '@typescript-eslint/triple-slash-reference': 'off' },
    },
    // Same layered boundaries as Next.js / Vite React (components, services, hooks, …)
    ...createFrontendBoundariesConfig(),
  ]
}

export default createAstroConfig
