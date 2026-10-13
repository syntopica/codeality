export default {
  name: 'code-policy/boundaries',
  plugins: {
    get 'code-policy'() {
      // Workaround for circular dependency: configs import rules, index exports both.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return (require('../index.js') as { default: unknown }).default
    },
  },
  // Import-boundary rules only, without the atomic-file layout: for projects
  // that want module entry points enforced but not one exported unit per file.
  rules: {
    'code-policy/public-api-imports': 'error',
    'code-policy/no-cross-module-deep-imports': 'error',
    'code-policy/no-mixed-barrel': 'error',
  },
} as const
