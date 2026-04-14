export default {
  name: 'code-policy/recommended',
  plugins: {
    get 'code-policy'() {
      // Workaround for circular dependency: configs import rules, index exports both.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('../index.js').default
    },
  },
  rules: {
    'code-policy/atomic-file': 'off', // Legacy
    // New exact specification rules
    'code-policy/one-primary-unit': 'error',
    'code-policy/no-hidden-top-level-declarations': 'error',
    'code-policy/no-inline-types-in-runtime-files': 'error',
    'code-policy/file-kind-placement': 'error',

    'code-policy/no-inline-types': 'off', // Replaced by more precise rules above
    'code-policy/view-logic-separation': 'warn',
    'code-policy/public-api-imports': 'error',
    'code-policy/no-cross-module-deep-imports': 'error',
  },
} as const
