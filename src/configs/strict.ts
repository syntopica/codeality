import recommended from './recommended.js'

export default {
  ...recommended,
  name: 'code-policy/strict',
  rules: {
    ...recommended.rules,
    // Strict overrides added here
  },
} as const
