import { RuleTester } from 'eslint'
import { afterAll, describe, it } from 'vitest'

// RuleTester needs vitest's test runner hooks injected via dynamic assignment.
// The `any` casts are unavoidable: RuleTester's static properties are not in
// its public type signature but are supported at runtime.

;(RuleTester as any).afterAll = afterAll
;(RuleTester as any).describe = describe
;(RuleTester as any).it = it

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
