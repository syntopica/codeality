import rule from '@/rules/public-api-imports.js'
import { runRuleTest } from '@tests/rule-testers/runRuleTest.js'
import { describe, expect, it } from 'vitest'

const CORE_UTILS = '@my-pkg/core/src/utils'

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
            bannedSubpaths: {
              type: 'array',
              items: { type: 'string' },
            },
            allowedSubpaths: {
              type: 'array',
              items: { type: 'string' },
            },
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

runRuleTest('public-api-imports', rule, {
  assertionOptions: {
    requireData: true,
  },
  valid: [
    {
      code: `
      import { util } from '@my-pkg/core'
      import { Local } from './src/utils'
      import config from '../src/config'
      `,
    },
    {
      code: `
      import deep from 'some-package/lib/internal'
      `,
      options: [{ bannedSubpaths: ['/src/'] }],
    },
    // A subpath the package declares public is allowed.
    {
      code: `import { Button } from '@my-pkg/ui/src/public/Button'`,
      options: [{ allowedSubpaths: ['/src/public/'] }],
    },
    // A computed dynamic import names no module and cannot be checked.
    {
      code: `const mod = await import(path)`,
    },
  ],
  invalid: [
    {
      code: `export { util } from '${CORE_UTILS}'`,
      errors: [
        {
          messageId: 'deepImportNotAllowed',
          data: { importPath: CORE_UTILS },
          line: 1,
          column: 1,
        },
      ],
    },
    {
      code: `export * from '${CORE_UTILS}'`,
      errors: [
        {
          messageId: 'deepImportNotAllowed',
          data: { importPath: CORE_UTILS },
          line: 1,
          column: 1,
        },
      ],
    },
    {
      code: `const mod = await import('${CORE_UTILS}')`,
      errors: [
        {
          messageId: 'deepImportNotAllowed',
          data: { importPath: CORE_UTILS },
          line: 1,
          column: 19,
        },
      ],
    },
    {
      code: `
      import { util } from '${CORE_UTILS}'
      `,
      errors: [
        {
          messageId: 'deepImportNotAllowed',
          data: { importPath: CORE_UTILS },
          line: 2,
          column: 7,
        },
      ],
    },
    {
      code: `
      import lib from 'dependency/src/lib'
      `,
      errors: [
        {
          messageId: 'deepImportNotAllowed',
          data: { importPath: 'dependency/src/lib' },
          line: 2,
          column: 7,
        },
      ],
    },
    {
      code: `import internal from '@my-pkg/core/internal/value'`,
      options: [{ bannedSubpaths: ['/internal/'] }],
      errors: [
        {
          messageId: 'deepImportNotAllowed',
          data: { importPath: '@my-pkg/core/internal/value' },
          line: 1,
          column: 1,
        },
      ],
    },
  ],
})
