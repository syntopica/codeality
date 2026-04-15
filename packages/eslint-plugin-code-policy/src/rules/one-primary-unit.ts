import type { Rule } from 'eslint'

import { DOCS_BASE_URL } from '@/utils/docs-base-url.js'
import { NEXT_RESERVED_EXPORTS } from '@/utils/next-reserved-exports.js'
import { ROUTE_METHODS } from '@/utils/route-methods.js'

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'A file must contain exactly one primary top-level exported unit.',
      recommended: true,
      url: `${DOCS_BASE_URL}/one-primary-unit.md`,
    },
    fixable: undefined,
    schema: [],
    messages: {
      multiplePrimaryUnits:
        'File contains multiple primary exported units (found {{count}}). The Atomic File Rule requires exactly one primary exported unit.',
    },
  },
  create(context) {
    const filename = context.filename || context.physicalFilename || ''

    if (
      filename.endsWith('.config.ts') ||
      filename.endsWith('.config.js') ||
      filename.endsWith('.config.mjs') ||
      filename.endsWith('.config.cjs') ||
      filename.endsWith('.d.ts') ||
      filename.endsWith('index.ts') ||
      filename.endsWith('index.tsx') ||
      filename.endsWith('index.js') ||
      filename.endsWith('proxy.ts') // Exempt explicit configuration or typings
    ) {
      return {}
    }

    const isNextJsRouterFile =
      /(?:page|layout|loading|error|not-found)\.(?:tsx|jsx|js|ts)$|route\.(?:ts|js)$|middleware\.(?:ts|js)$/.test(
        filename,
      )

    return {
      Program(node) {
        let exportCount = 0
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const exportedEntities: any[] = []

        for (const statement of node.body) {
          if (statement.type === 'ExportNamedDeclaration') {
            if (statement.declaration) {
              if (statement.declaration.type === 'VariableDeclaration') {
                for (const decl of statement.declaration.declarations) {
                  const name =
                    decl.id.type === 'Identifier' ? decl.id.name : null
                  if (
                    name &&
                    isNextJsRouterFile &&
                    (NEXT_RESERVED_EXPORTS.has(name) || ROUTE_METHODS.has(name))
                  ) {
                    continue
                  }
                  exportCount += 1
                  exportedEntities.push(decl)
                }
              } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const declAny = statement.declaration as any
                if (
                  [
                    'FunctionDeclaration',
                    'ClassDeclaration',
                    'TSTypeAliasDeclaration',
                    'TSInterfaceDeclaration',
                    'TSEnumDeclaration',
                  ].includes(declAny.type)
                ) {
                  const name = declAny.id?.name
                  if (
                    name &&
                    isNextJsRouterFile &&
                    (NEXT_RESERVED_EXPORTS.has(name) || ROUTE_METHODS.has(name))
                  ) {
                    continue
                  }
                  exportCount += 1
                  exportedEntities.push(statement.declaration)
                }
              }
            } else if (statement.specifiers.length > 0) {
              for (const specifier of statement.specifiers) {
                const name =
                  specifier.exported.type === 'Identifier'
                    ? specifier.exported.name
                    : null
                if (
                  name &&
                  isNextJsRouterFile &&
                  (NEXT_RESERVED_EXPORTS.has(name) || ROUTE_METHODS.has(name))
                ) {
                  continue
                }
                exportCount += 1
                exportedEntities.push(specifier)
              }
            }
          } else if (statement.type === 'ExportDefaultDeclaration') {
            exportCount += 1
            exportedEntities.push(statement)
          }
        }

        if (exportCount > 1) {
          let reported = 0
          for (const entity of exportedEntities) {
            if (reported > 0) {
              context.report({
                node: entity,
                messageId: 'multiplePrimaryUnits',
                data: { count: String(exportCount) },
              })
            }
            reported += 1
          }
        }
      },
    }
  },
} as Rule.RuleModule
