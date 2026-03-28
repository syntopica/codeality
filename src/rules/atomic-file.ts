import type { Rule } from 'eslint'

const NEXT_RESERVED_EXPORTS = new Set([
  'config', 'metadata', 'dynamic', 'revalidate', 'fetchCache', 
  'runtime', 'preferredRegion', 'viewport', 'generateMetadata', 
  'generateViewport', 'generateStaticParams', 'GET', 'POST', 'PUT', 
  'PATCH', 'DELETE', 'HEAD', 'OPTIONS'
])

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce atomic file structure (exactly one top-level unit per file)',
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      multipleDeclarations: 'File contains multiple top-level declarations (found {{count}}). Extract them into separate files to enforce atomic file structure.',
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
      filename.endsWith('index.js')
    ) {
      return {}
    }

    const isNextJsRouterFile = /(?:page|layout|loading|error|not-found)\.tsx$|route\.ts$|middleware\.ts$|proxy\.ts$/.test(filename)

    return {
      Program(node) {
        let count = 0
        const declarations: any[] = []

        for (const statement of node.body) {
          if (
            statement.type === 'ImportDeclaration' ||
            statement.type === 'ExportAllDeclaration' ||
            statement.type === 'EmptyStatement' ||
            // @ts-expect-error Typescript specific nodes not in standard estree
            statement.type === 'TSImportEqualsDeclaration'
          ) {
            continue
          }

          if (statement.type === 'ExportNamedDeclaration' && !statement.declaration) {
            continue
          }

          if (isNextJsRouterFile && statement.type === 'ExportNamedDeclaration' && statement.declaration) {
            if (statement.declaration.type === 'FunctionDeclaration' && statement.declaration.id && NEXT_RESERVED_EXPORTS.has(statement.declaration.id.name)) {
              continue
            }
            if (statement.declaration.type === 'VariableDeclaration') {
              const allReserved = statement.declaration.declarations.every(d => 
                d.id.type === 'Identifier' && NEXT_RESERVED_EXPORTS.has(d.id.name)
              )
              if (allReserved) {
                continue
              }
            }
          }

          if (statement.type === 'ExpressionStatement') {
            if ((statement as any).directive || (statement.expression.type === 'Literal' && typeof statement.expression.value === 'string')) {
              continue
            }
          }

          if (statement.type === 'ExportDefaultDeclaration') {
            if (statement.declaration.type === 'Identifier') {
              continue
            }
            if (
              statement.declaration.type === 'CallExpression' &&
              statement.declaration.arguments.length === 1 &&
              statement.declaration.arguments[0].type === 'Identifier'
            ) {
              continue // e.g., export default memo(Component)
            }
          }

          let added = 0
          if (statement.type === 'VariableDeclaration') {
            added = statement.declarations.length
          } else if (
            statement.type === 'ExportNamedDeclaration' &&
            statement.declaration &&
            statement.declaration.type === 'VariableDeclaration'
          ) {
            added = statement.declaration.declarations.length
          } else {
            added = 1
          }

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
                node: statement as any,
                messageId: 'multipleDeclarations',
                data: { count },
              })
            }
            reported += added
          }
        }
      },
    }
  },
} as Rule.RuleModule
