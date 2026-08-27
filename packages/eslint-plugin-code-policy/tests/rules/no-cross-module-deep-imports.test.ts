import rule from '@/rules/no-cross-module-deep-imports.js'
import { runRuleTest } from '@tests/rule-testers/runRuleTest.js'
import { describe, expect, it } from 'vitest'

describe('no-cross-module-deep-imports metadata', () => {
  it('declares the exact rule contract', () => {
    expect(rule.name).toBe('no-cross-module-deep-imports')
    expect(Reflect.get(rule, 'defaultOptions')).toEqual([{}])
    expect(rule.meta).toEqual({
      type: 'problem',
      docs: {
        description:
          'Forbid relative imports that bypass the public API of another module within the monorepo by importing directly from its internal directories.',
        url: 'https://github.com/VibraComet/eslint-plugin-code-policy/blob/main/packages/eslint-plugin-code-policy/docs/rules/no-cross-module-deep-imports.md',
      },
      schema: [
        {
          type: 'object',
          properties: {
            minParentTraversals: { type: 'number' },
            internalDirs: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          additionalProperties: false,
        },
      ],
      messages: {
        deepImport:
          'Cross-module deep import "{{importPath}}" bypasses the module\'s public API. Import from the module root (index) instead.',
      },
    })
  })
})

const deepImportError = (importPath: string) => ({
  messageId: 'deepImport' as const,
  data: { importPath },
  line: 1,
  column: 1,
})

runRuleTest('no-cross-module-deep-imports', rule, {
  assertionOptions: {
    requireData: true,
  },
  valid: [
    // single-level relative — within same module
    {
      code: `import { helper } from '../utils/helper'`,
    },
    // absolute/alias import — never flagged
    {
      code: `import { helper } from '@myorg/core'`,
    },
    // two levels up but not descending into src
    {
      code: `import config from '../../config'`,
    },
    // two levels up, descending into non-internal dir
    {
      code: `import stuff from '../../packages/something/lib/stuff'`,
    },
    // custom internalDirs — 'lib' not banned by default
    {
      code: `import { x } from '../../other-module/lib/internal'`,
    },
    // Alias imports remain exempt even when the traversal threshold is zero.
    {
      code: `import { helper } from '@myorg/core/src/helper'`,
      options: [{ minParentTraversals: 0 }],
    },
    // One parent traversal is immediately below the default threshold.
    {
      code: `import { x } from '../sibling/src/module'`,
    },
    // Parent markers are not descendant path segments.
    {
      code: `import { x } from '../../other-module/lib/internal'`,
      options: [{ internalDirs: ['..'] }],
    },
  ],

  invalid: [
    // classic cross-module deep import
    {
      code: `import { helper } from '../../core/src/utils/helper'`,
      errors: [deepImportError('../../core/src/utils/helper')],
    },
    // three levels up, then into src
    {
      code: `import { api } from '../../../packages/api/src/client'`,
      errors: [deepImportError('../../../packages/api/src/client')],
    },
    // custom internalDirs option
    {
      code: `import { x } from '../../other-module/lib/internal'`,
      options: [{ internalDirs: ['lib'] }],
      errors: [deepImportError('../../other-module/lib/internal')],
    },
    // minParentTraversals: 1 — even one level up into src is flagged
    {
      code: `import { x } from '../sibling/src/module'`,
      options: [{ minParentTraversals: 1 }],
      errors: [deepImportError('../sibling/src/module')],
    },
  ],
})
