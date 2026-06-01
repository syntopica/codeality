import type { TSESTree } from '@typescript-eslint/utils'

import { createRule } from '@/utils/create-rule.js'
import { NEXT_RESERVED_EXPORTS } from '@/utils/next-reserved-exports.js'

type Options = []

type MessageIds = 'multipleDeclarations'

export default createRule<Options, MessageIds>({
  name: 'atomic-file',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce atomic file structure (exactly one top-level unit per file)',
    },
    schema: [],
    messages: {
      multipleDeclarations:
        'File contains multiple top-level declarations (found {{count}}). Extract them into separate files to enforce atomic file structure.',
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
      filename.endsWith('index.ts') ||
      filename.endsWith('index.tsx') ||
      filename.endsWith('index.js')
    ) {
      return {}
    }

    const isNextJsRouterFile =
      /(?:page|layout|loading|error|not-found)\.tsx$|route\.ts$|middleware\.ts$|proxy\.ts$/.test(
        filename,
      )

    return {
      Program(node: TSESTree.Program) {
        let count = 0
        const declarations: {
          statement: TSESTree.ProgramStatement
          added: number
        }[] = []

        for (const statement of node.body) {
          if (
            statement.type === 'ImportDeclaration' ||
            statement.type === 'ExportAllDeclaration' ||
            statement.type === 'EmptyStatement' ||
            statement.type === 'TSImportEqualsDeclaration'
          ) {
            continue
          }

          if (
            statement.type === 'ExportNamedDeclaration' &&
            !statement.declaration
          ) {
            continue
          }

          if (
            isNextJsRouterFile &&
            statement.type === 'ExportNamedDeclaration' &&
            statement.declaration
          ) {
            if (
              statement.declaration.type === 'FunctionDeclaration' &&
              statement.declaration.id !== null &&
              NEXT_RESERVED_EXPORTS.has(statement.declaration.id.name)
            ) {
              continue
            }
            if (statement.declaration.type === 'VariableDeclaration') {
              const allReserved = statement.declaration.declarations.every(
                (d) =>
                  d.id.type === 'Identifier' &&
                  NEXT_RESERVED_EXPORTS.has(d.id.name),
              )
              if (allReserved) {
                continue
              }
            }
          }

          if (
            statement.type === 'ExpressionStatement' &&
            (statement.directive ||
              (statement.expression.type === 'Literal' &&
                typeof statement.expression.value === 'string'))
          ) {
            continue
          }

          if (statement.type === 'ExportDefaultDeclaration') {
            if (statement.declaration.type === 'Identifier') {
              continue
            }
            if (
              statement.declaration.type === 'CallExpression' &&
              statement.declaration.arguments.length === 1 &&
              statement.declaration.arguments[0]?.type === 'Identifier'
            ) {
              continue // e.g., export default memo(Component)
            }
          }

          const added =
            statement.type === 'VariableDeclaration'
              ? statement.declarations.length
              : statement.type === 'ExportNamedDeclaration' &&
                  statement.declaration?.type === 'VariableDeclaration'
                ? statement.declaration.declarations.length
                : 1

          count += added
          if (added > 0) {
            declarations.push({ statement, added })
          }
        }

        if (count > 1) {
          let reported = 0
          for (const { statement, added } of declarations) {
            if (reported > 0 || added > 1) {
              context.report({
                node: statement,
                messageId: 'multipleDeclarations',
                data: { count: String(count) },
              })
            }
            reported += added
          }
        }
      },
    }
  },
})
