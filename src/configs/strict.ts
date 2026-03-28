import recommended from './recommended.js'

export default {
  ...recommended,
  rules: {
    ...recommended.rules,
    // Strict overrides added here
  },
}
