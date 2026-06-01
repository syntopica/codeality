export default {
  name: 'code-policy/recommended',
  plugins: {
    get 'code-policy'() {
      // Workaround for circular dependency: configs import rules, index exports both.
      // Cast the dynamic require to a known shape so plugin access is not `any`
      // (kept portable for declaration emit, unlike a reference to ESLint.Plugin).
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return (require('../index.js') as { default: unknown }).default
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
    'code-policy/no-mixed-barrel': 'error',
  },
} as const
