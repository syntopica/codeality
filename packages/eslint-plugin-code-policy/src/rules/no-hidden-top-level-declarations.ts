import type { Rule } from 'eslint'

import { DOCS_BASE_URL } from '@/utils/docs-base-url.js'

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow non-exported top-level functions, classes, constants, interfaces, and type aliases.',
      recommended: true,
      url: `${DOCS_BASE_URL}/no-hidden-top-level-declarations.md`,
    },
    fixable: undefined,
    schema: [],
    messages: {
      hiddenDeclaration:
        'Top-level declaration "{{name}}" is not exported. The Primary Unit Rule forbids hidden internal helpers or types at the module scope.',
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
      filename.endsWith('proxy.ts') // Exempt explicit configuration or typings
    ) {
      return {}
    }

    return {
      Program(node) {
        const exportedNames = new Set<string>()

        // First pass: collect all explicitly exported names
        for (const stmt of node.body) {
          if (stmt.type === 'ExportNamedDeclaration') {
            for (const specifier of stmt.specifiers) {
              if (specifier.local.type === 'Identifier') {
                exportedNames.add(specifier.local.name)
              }
            }
          } else if (stmt.type === 'ExportDefaultDeclaration') {
            if (stmt.declaration.type === 'Identifier') {
              exportedNames.add(stmt.declaration.name)
            } else if (stmt.declaration.type === 'CallExpression') {
              let currentArgs = stmt.declaration.arguments
              while (currentArgs.length === 1 && currentArgs[0]?.type === 'CallExpression') {
                currentArgs = currentArgs[0].arguments
              }
              if (currentArgs.length === 1 && currentArgs[0]?.type === 'Identifier') {
                exportedNames.add(currentArgs[0].name)
              }
            }
          }
        }

        // Second pass: Find unexported declarations
        for (const stmt of node.body) {
          if (stmt.type === 'VariableDeclaration') {
            for (const decl of stmt.declarations) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const checkPattern = (pattern: any) => {
                if (!pattern) return
                if (pattern.type === 'Identifier') {
                  if (!exportedNames.has(pattern.name)) {
                    context.report({
                      node: decl,
                      messageId: 'hiddenDeclaration',
                      data: { name: pattern.name },
                    })
                  }
                } else if (pattern.type === 'ObjectPattern') {
                  for (const prop of pattern.properties) {
                    if (prop.type === 'Property') checkPattern(prop.value)
                    else if (prop.type === 'RestElement') checkPattern(prop.argument)
                  }
                } else if (pattern.type === 'ArrayPattern') {
                  for (const elem of pattern.elements) {
                    if (elem?.type === 'RestElement') checkPattern(elem.argument)
                    else checkPattern(elem)
                  }
                }
              }
              checkPattern(decl.id)
            }
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const nodeWithId = stmt as any
            if (
              (nodeWithId.type === 'FunctionDeclaration' ||
                nodeWithId.type === 'ClassDeclaration' ||
                nodeWithId.type === 'TSTypeAliasDeclaration' ||
                nodeWithId.type === 'TSInterfaceDeclaration' ||
                nodeWithId.type === 'TSEnumDeclaration') &&
              nodeWithId.id?.type === 'Identifier' &&
              !exportedNames.has(nodeWithId.id.name)
            ) {
              context.report({
                node: stmt,
                messageId: 'hiddenDeclaration',
                data: { name: nodeWithId.id.name },
              })
            }
          }
        }
      },
    }
  },
} as Rule.RuleModule
