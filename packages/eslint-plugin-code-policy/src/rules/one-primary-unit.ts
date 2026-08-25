import type { TSESTree } from '@typescript-eslint/utils'

import { boundIdentifierNames } from '@/utils/bound-identifier-names.js'
import { createRule } from '@/utils/create-rule.js'
import { isExemptEntryFilename } from '@/utils/is-exempt-entry-filename.js'
import { isFactoryDestructuring } from '@/utils/is-factory-destructuring.js'
import { isSchemaDerivedType } from '@/utils/is-schema-derived-type.js'
import { localValueNames } from '@/utils/local-value-names.js'
import { NEXT_RESERVED_EXPORTS } from '@/utils/next-reserved-exports.js'
import { ROUTE_METHODS } from '@/utils/route-methods.js'

type Options = []

type MessageIds = 'multiplePrimaryUnits'

export default createRule<Options, MessageIds>({
  name: 'one-primary-unit',
  meta: {
    type: 'problem',
    docs: {
      description:
        'A file must contain exactly one primary top-level exported unit.',
    },
    schema: [],
    messages: {
      multiplePrimaryUnits:
        'File contains multiple primary exported units (found {{count}}). The Atomic File Rule requires exactly one primary exported unit.',
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename || context.physicalFilename || ''

    if (
      isExemptEntryFilename(filename) ||
      filename.endsWith('proxy.ts') // Exempt explicit configuration or typings
    ) {
      return {}
    }

    const isNextJsRouterFile =
      /(?:page|layout|loading|error|not-found)\.(?:tsx|jsx|js|ts)$|route\.(?:ts|js)$|middleware\.(?:ts|js)$/.test(
        filename,
      )

    return {
      Program(node: TSESTree.Program) {
        let exportCount = 0
        const exportedEntities: TSESTree.Node[] = []
        const valueNames = localValueNames(node)

        for (const statement of node.body) {
          if (statement.type === 'ExportNamedDeclaration') {
            if (statement.declaration) {
              if (statement.declaration.type === 'VariableDeclaration') {
                for (const decl of statement.declaration.declarations) {
                  // One declarator can bind several names:
                  // `export const { a, b } = source` exports two units, and
                  // counting the declarator instead would let it pass.
                  const names = boundIdentifierNames(decl.id).filter(
                    (name) =>
                      !(
                        isNextJsRouterFile &&
                        (NEXT_RESERVED_EXPORTS.has(name) ||
                          ROUTE_METHODS.has(name))
                      ),
                  )
                  if (!names.length) continue
                  // Destructuring one call's result is one unit, not one per
                  // name: the factory returns a single object and the names
                  // are how it hands the pieces over.
                  const units = isFactoryDestructuring(decl) ? 1 : names.length
                  for (let index = 0; index < units; index += 1) {
                    exportCount += 1
                    exportedEntities.push(decl)
                  }
                }
              } else {
                const declaration = statement.declaration
                if (
                  declaration.type === 'FunctionDeclaration' ||
                  declaration.type === 'ClassDeclaration' ||
                  declaration.type === 'TSTypeAliasDeclaration' ||
                  declaration.type === 'TSInterfaceDeclaration' ||
                  declaration.type === 'TSEnumDeclaration'
                ) {
                  const name =
                    declaration.type === 'TSTypeAliasDeclaration'
                      ? declaration.id.name
                      : (declaration.id?.name ?? null)
                  if (
                    name &&
                    isNextJsRouterFile &&
                    (NEXT_RESERVED_EXPORTS.has(name) || ROUTE_METHODS.has(name))
                  ) {
                    continue
                  }
                  // A type derived from a schema declared in this same file is
                  // that schema's signature, not a second unit.
                  if (isSchemaDerivedType(declaration, valueNames)) continue
                  exportCount += 1
                  exportedEntities.push(declaration)
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
})
