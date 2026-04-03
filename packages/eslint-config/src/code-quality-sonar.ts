import sonarjs from 'eslint-plugin-sonarjs'

/** Duplication and smell rules from eslint-plugin-sonarjs. Composed by code-quality. */
export const createCodeQualitySonarConfig = () => [
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: { sonarjs },
    rules: {
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-duplicated-branches': 'error',
      'sonarjs/no-duplicate-string': ['warn', { threshold: 4 }],
    },
  },
]

export default createCodeQualitySonarConfig
