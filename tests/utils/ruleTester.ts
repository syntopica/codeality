import { RuleTester } from 'eslint'
import { afterAll, describe, it } from 'vitest'

;(RuleTester as any).afterAll = afterAll
;(RuleTester as any).describe = describe
;(RuleTester as any).it = it

export const ruleTester = new RuleTester({
  languageOptions: {
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
