import { createRule } from '@/utils/create-rule.js'
import { moduleSourceVisitors } from '@/utils/module-source-visitors.js'

type Options = [
  {
    bannedSubpaths?: string[]
    allowedSubpaths?: string[]
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
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const bannedSubpaths = options?.bannedSubpaths ?? ['/src/']
    const allowedSubpaths = options?.allowedSubpaths ?? []

    return moduleSourceVisitors((node, importPath) => {
      if (importPath.startsWith('.')) return // Ignore relative imports within the same package
      // A subpath the package deliberately exports, such as `pkg/src/public`.
      if (allowedSubpaths.some((allowed) => importPath.includes(allowed))) {
        return
      }
      if (bannedSubpaths.some((subpath) => importPath.includes(subpath))) {
        context.report({
          node,
          messageId: 'deepImportNotAllowed',
          data: { importPath },
        })
      }
    })
  },
})
