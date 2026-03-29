import { RuleTester } from 'eslint'
import { afterAll, describe, it } from 'vitest'

// RuleTester needs vitest's test runner hooks injected via dynamic assignment.
// The `any` casts are unavoidable: RuleTester's static properties are not in
// its public type signature but are supported at runtime.
const tester = RuleTester as any
tester.afterAll = afterAll
tester.describe = describe
tester.it = it

export const ruleTester = new RuleTester({
  languageOptions: {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    parser: require('@typescript-eslint/parser'),
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
})
