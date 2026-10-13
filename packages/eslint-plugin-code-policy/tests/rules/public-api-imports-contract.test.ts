import rule from '@/rules/public-api-imports.js'
import { runRuleTest } from '@tests/rule-testers/runRuleTest.js'
import { describe, expect, it } from 'vitest'

describe('public-api-imports metadata', () => {
  it('declares the exact rule contract', () => {
    expect(rule.name).toBe('public-api-imports')
    expect(Reflect.get(rule, 'defaultOptions')).toEqual([{}])
    expect(rule.meta).toEqual({
      type: 'problem',
      docs: {
        description:
          'Enforce that cross-module imports only target the module public API (index), not deep internal files.',
        url: 'https://github.com/syntopica/codeality/blob/main/packages/eslint-plugin-code-policy/docs/rules/public-api-imports.md',
      },
      schema: [
        {
          type: 'object',
          properties: {
            bannedSubpaths: { type: 'array', items: { type: 'string' } },
            allowedSubpaths: { type: 'array', items: { type: 'string' } },
          },
          additionalProperties: false,
        },
      ],
      messages: {
        deepImportNotAllowed:
          'Deep import "{{importPath}}" is not allowed. Import from the public API (root) of the module instead.',
      },
    })
  })
})

runRuleTest('public-api-imports banned subpaths', rule, {
  valid: [],
  invalid: [
    // Any one banned segment is enough; the path need not contain them all.
    {
      code: `import { x } from '@pkg/core/internal/x'`,
      options: [{ bannedSubpaths: ['/src/', '/internal/'] }],
      errors: [{ messageId: 'deepImportNotAllowed' }],
    },
  ],
})
