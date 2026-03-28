export default {
  plugins: {
    get 'code-policy'() {
      // Workaround for circular dependency
      // Since configs imports rules, and index exports both
      // Flat config works best when plugin object is injected locally
      // We will resolve this strictly in execution.
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
}
