import recommended from './recommended.js'

export default {
  ...recommended,
  name: 'code-policy/react',
  rules: {
    ...recommended.rules,
    // React specific adjustments
  },
} as const
