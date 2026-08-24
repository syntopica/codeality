import type { TSESTree } from '@typescript-eslint/utils'

import { boundIdentifierNames } from '@/utils/bound-identifier-names.js'
import { createRule } from '@/utils/create-rule.js'

type Options = []

type MessageIds = 'hiddenDeclaration'

export default createRule<Options, MessageIds>({
  name: 'no-hidden-top-level-declarations',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow non-exported top-level functions, classes, constants, interfaces, and type aliases.',
    },
    schema: [],
    messages: {
      hiddenDeclaration:
        'Top-level declaration "{{name}}" is not exported. The Primary Unit Rule forbids hidden internal helpers or types at the module scope.',
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename || context.physicalFilename || ''

    if (
      filename.endsWith('.config.ts') ||
      filename.endsWith('.config.js') ||
      filename.endsWith('.config.mjs') ||
      filename.endsWith('.config.cjs') ||
      filename.endsWith('.d.ts') ||
      filename.endsWith('.vue') || // SFC <script setup> bindings are reactive state, never exported
      filename.endsWith('proxy.ts') // Exempt explicit configuration or typings
    ) {
      return {}
    }

    return {
      Program(node: TSESTree.Program) {
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
              while (
                currentArgs.length === 1 &&
                currentArgs[0]?.type === 'CallExpression'
              ) {
                currentArgs = currentArgs[0].arguments
              }
              if (
                currentArgs.length === 1 &&
                currentArgs[0]?.type === 'Identifier'
              ) {
                exportedNames.add(currentArgs[0].name)
              }
            }
          }
        }

        // Second pass: Find unexported declarations
        for (const stmt of node.body) {
          if (stmt.type === 'VariableDeclaration') {
            for (const decl of stmt.declarations) {
              for (const name of boundIdentifierNames(decl.id)) {
                if (!exportedNames.has(name)) {
                  context.report({
                    node: decl,
                    messageId: 'hiddenDeclaration',
                    data: { name },
                  })
                }
              }
            }
          } else if (
            (stmt.type === 'FunctionDeclaration' ||
              stmt.type === 'ClassDeclaration' ||
              stmt.type === 'TSTypeAliasDeclaration' ||
              stmt.type === 'TSInterfaceDeclaration' ||
              stmt.type === 'TSEnumDeclaration') &&
            stmt.id?.type === 'Identifier' &&
            !exportedNames.has(stmt.id.name)
          ) {
            context.report({
              node: stmt,
              messageId: 'hiddenDeclaration',
              data: { name: stmt.id.name },
            })
          }
        }
      },
    }
  },
})
