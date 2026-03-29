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
    'code-policy/atomic-file': 'error',
    'code-policy/no-inline-types': 'error',
    'code-policy/view-logic-separation': 'error',
    'code-policy/public-api-imports': 'error',
    'code-policy/no-cross-module-deep-imports': 'error',
  },
} as const
