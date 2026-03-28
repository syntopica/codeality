import type { Rule } from 'eslint'

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce that cross-module imports only target the module public API (index), not deep internal files.',
      recommended: true,
    },
    fixable: undefined,
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
  create(context) {
    const options = context.options[0] || {}
    const bannedSubpaths: string[] = options.bannedSubpaths || ['/src/']

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ImportDeclaration(node: any) {
        const importPath = node.source.value

        if (typeof importPath !== 'string') return
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
} as Rule.RuleModule
