import recommended from '@/configs/recommended.js'

export default {
  ...recommended,
  name: 'code-policy/next',
  rules: {
    ...recommended.rules,
    // Next specific adjustments
  },
} as const
