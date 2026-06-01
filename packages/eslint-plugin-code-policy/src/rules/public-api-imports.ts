import type { TSESTree } from '@typescript-eslint/utils'

import { createRule } from '@/utils/create-rule.js'

type Options = [
  {
    bannedSubpaths?: string[]
  }?,
]

type MessageIds = 'deepImportNotAllowed'

export default createRule<Options, MessageIds>({
  name: 'public-api-imports',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce that cross-module imports only target the module public API (index), not deep internal files.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          bannedSubpaths: {
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
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const bannedSubpaths = options?.bannedSubpaths ?? ['/src/']

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        const importPath = node.source.value

        if (importPath.startsWith('.')) return // Ignore relative imports within the same package

        for (const subpath of bannedSubpaths) {
          // If the import is an absolute/alias import and contains the banned subpath
          if (importPath.includes(subpath)) {
            context.report({
              node,
              messageId: 'deepImportNotAllowed',
              data: { importPath },
            })
            break
          }
        }
      },
    }
  },
})
