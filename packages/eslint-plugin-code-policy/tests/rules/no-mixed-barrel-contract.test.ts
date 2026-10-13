import rule from '@/rules/no-mixed-barrel.js'
import { runRuleTest } from '@tests/rule-testers/runRuleTest.js'
import { describe, expect, it } from 'vitest'

describe('no-mixed-barrel metadata', () => {
  it('declares the exact rule contract', () => {
    expect(rule.name).toBe('no-mixed-barrel')
    expect(Reflect.get(rule, 'defaultOptions')).toEqual([])
    expect(rule.meta).toEqual({
      type: 'problem',
      docs: {
        description:
          'Disallow barrel files (index.*) that mix re-exports from other modules with inline declarations.',
        url: 'https://github.com/syntopica/codeality/blob/main/packages/eslint-plugin-code-policy/docs/rules/no-mixed-barrel.md',
      },
      schema: [],
      messages: {
        mixedBarrel:
          'Barrel file mixes re-exports from other modules with inline {{kind}} declarations. Either keep this file as a pure barrel (re-exports only) or move inline declarations to their own files.',
      },
    })
  })
})

runRuleTest('no-mixed-barrel statements', rule, {
  valid: [
    // An import is not an inline declaration, even beside a re-export.
    {
      code: `import { a } from './a'\nexport * from './b'\nexport { a }`,
      filename: '/src/feature/index.ts',
    },
  ],
  invalid: [],
})
